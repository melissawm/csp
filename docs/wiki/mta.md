# Using CSP to analyze MTA data

The Metropolitan Transportation Authority provides an API for developers, and we'll explore the MTA's realtime [GTFS-rt](https://developers.google.com/transit/gtfs-realtime) feed. This feeds requires authentication, so before you run this example yourself you will need to create an API key at https://api.mta.info/#/signup. You can define your API_KEY as an environment variable in your system for safe keeping.

In order to deal with the GTFS-rt data, we'll use the [nyct-gtfs](https://pypi.org/project/nyct-gtfs/) library, available from PyPI through

```
pip install nyct-gtfs
```

The MTA feed can be inspected as follows:


```python
from nyct_gtfs import NYCTFeed
import os

API_KEY = os.environ.get('API_KEY')

# Load the realtime feed from the MTA site
feed = NYCTFeed("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs", api_key=API_KEY)

# feed_id must be a valid feed URL or one of: 
# '1', '2', '3', '4', '5', '6', '7',
# 'S', 'GS', 'A', 'C', 'E', 'H',
# 'FS', 'SF', 'SR',
# 'B', 'D', 'F', 'M', 'G', 'J', 'Z', 'N', 'Q', 'R', 'W', 'L',
# 'SI', 'SS', 'SIR'
```

Let's explore the data first. `feed` is a `nyct_gtfs.feed.NYCTFeed` instance, with the most important methods being the following:


```python
feed.refresh?
```


```python
feed.filter_trips?
```


```python
feed.trips?
```

In our case, we will (for simplicity) filter the trips to collect information only about the 1, 2 and 3 trains, and we will start with trains going through 34 St-Penn Station.


```python
# This cell can be run multiple times, and data will be refreshed every 30s
feed.refresh()
trains = feed.filter_trips(underway=True, headed_for_stop_id=['128', '128N'])
trains
```

We can also show this data in a human-readable way.


```python
for train in trains:
    print(train)
```

We can now check for the times when trains have passed through 34St-Penn Station.


```python
trains_at_penn = []
print("Station | Line | Direction | Arrival time")
for train in trains:
    for update in train.stop_time_updates:
        if update.stop_id in ['128', '128N']:
            print(f"{update.stop_name} | {train.route_id} | {train.headsign_text} | {update.arrival}")
            trains_at_penn.append((train, update))
```

---

## Using CSP to ingest and analyze the data

When using CSP to ingest and analyze this data, we start with a graph representing the operations we want to perform. Graphs are composed of some number of "input" adapters, a set of connected calculation "nodes" and at the end sent off to "output" adapters. For simplicity, we'll build a very simple graph that will show trains passing through 34 St-Penn Station.

There are two types of [Input Adapters](https://github.com/Point72/csp/wiki/5.-Adapters): Historical (aka Simulated) adapters and Realtime Adapters. Historical adapters are used to feed in historical timeseries data into the graph from some data source which has timeseries data. Realtime Adapters are used to feed in live event based data in realtime, generally events created from external sources on separate threads.

As you may have guessed, in our case we need to use a Realtime adapter, which will ingest the data and periodically refresh it.

In CSP terminology, a single adapter corresponds to a single timeseries edge in the graph. When writing realtime adapters, you will need to implement a "push" adapter, which will get data from a separate thread that drives external events and "pushes" them into the engine as they occur.

When writing input adapters it is also very important to denote the difference between "graph building time" and "runtime" versions of your adapter. For example, `csp.adapters.csv` has a `CSVReader` class that is used at graph building time. Graph build time components solely describe the adapter. They are meant to do little else than keep track of the type of adapter and its parameters, which will then be used to construct the actual adapter implementation when the engine is constructed from the graph description. It is the runtime implementation that actual runs during the engine execution phase to process data.

> Once the graph is constructed, `csp.graph` code is no longer needed. Once the
> graph is run, only inputs, `csp.nodes` and outputs will be active as data flows
> through the graph, driven by input ticks.

In our case, "ticks" correspond to feed refreshes, and we'll observe this data being updated every 30s.


```python
import csp
from csp.impl.pushadapter import PushInputAdapter
from csp.impl.wiring import py_push_adapter_def

import nyct_gtfs

import os
import time
import threading
from datetime import datetime, timedelta

API_KEY = os.environ.get('API_KEY')


class Event(csp.Struct):
    train: nyct_gtfs.trip.Trip
    update: nyct_gtfs.stop_time_update.StopTimeUpdate


class FetchTrainDataAdapter(PushInputAdapter):
    def __init__(self, interval):
        self._interval = interval
        self._thread = None
        self._running = False

    def start(self, starttime, endtime):
        print("FetchTrainDataAdapter::start")
        self._running = True
        self._thread = threading.Thread(target=self._run)
        self._thread.start()

    def stop(self):
        print("FetchTrainDataAdapter::stop")
        if self._running:
            self._running = False
            self._thread.join()

    def _run(self):
        feed = nyct_gtfs.NYCTFeed("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs", api_key=API_KEY)

        while self._running:
            print(f"{datetime.utcnow()}: refreshing MTA feed")
            feed.refresh()
            # trains will contain all trains underway currently headed to 34St-Penn Station.
            trains = feed.filter_trips(underway=True, headed_for_stop_id=['128', '128N'])
            # tick whenever feed is refreshed
            for train in trains:
                for update in train.stop_time_updates:
                    if update.stop_id in ['128', '128N']:
                        #self.push_tick(Event(train=(train.route_id, train.headsign_text), update=update.arrival))
                        self.push_tick(Event(train=train, update=update))
            time.sleep(self._interval.total_seconds())

FetchTrainData = py_push_adapter_def("FetchTrainData", FetchTrainDataAdapter, csp.ts[Event], interval=timedelta)

@csp.graph
def mta_graph():
    print("Start of graph building")
    trains_at_penn = FetchTrainData(timedelta(seconds=30))
    csp.print("MTA data", trains_at_penn)
    print("End of graph building")

start = datetime.utcnow()
end = start + timedelta(minutes=3)
#csp.showgraph.show_graph(mta_graph)
csp.run(mta_graph, starttime=start, realtime=True, endtime=end)
print("Done.")
```

---

### References

* https://erikbern.com/2016/04/04/nyc-subway-math
* https://erikbern.com/2016/07/09/waiting-time-math.html
* https://pypi.org/project/nyct-gtfs/
* https://api.mta.info/#/landing
* https://developers.google.com/transit/gtfs-realtime
* https://github.com/Point72/csp/blob/main/examples/4_writing_adapters/e_14_user_adapters_03_pushinput.py
* https://github.com/Point72/csp/wiki/5.-Adapters#realtime-adapters


```python

```

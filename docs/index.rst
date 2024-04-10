.. CSP documentation master file, created by
   sphinx-quickstart on Wed Apr  3 13:15:56 2024.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. image:: img/csp-light.png
    :alt: CSP Logo
    :width: 300px

``csp`` ("Composable Stream Processing") is a functional-like reactive
language that makes time-series stream processing simple to do.  The
main reactive engine is a C++ based engine which has been exposed to
python ( other languages may optionally be extended in future versions
). `csp` applications define a connected graph of components using a
declarative language (which is essentially python).  Once a graph is
constructed it can be run using the C++ engine. Graphs are composed of
some number of "input" adapters, a set of connected calculation "nodes"
and at the end sent off to "output" adapters. Inputs as well as the
engine can be seamlessly run in simulation mode using historical input
adapters or in realtime mode using realtime input adapters.

.. toctree::
   :maxdepth: 1
   :caption: Contents

   wiki/user_guide.md
   wiki/developer_guide.md

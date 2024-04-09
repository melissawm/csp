import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Composable Stream Processing',
    Svg: require('@site/static/img/csp-light.svg').default,
    description: (
      <>
        <b>csp</b> ("Composable Stream Processing") is a functional-like reactive
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
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--12')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

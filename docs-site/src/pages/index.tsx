import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

type EntryPoint = {
  title: string;
  audience: string;
  description: string;
  to: string;
  linkLabel: string;
};

const entryPoints: EntryPoint[] = [
  {
    title: 'Understand CSTAR',
    audience: 'For anyone new to CSTAR',
    description:
      'Tenants, groups, CSTAR roles and connected-service roles, and how they fit together.',
    to: '/docs/overview/what-is-cstar',
    linkLabel: 'Read the overview',
  },
  {
    title: 'Manage a tenant',
    audience: 'For tenant owners and user admins',
    description:
      'Request a tenant, add users, create groups and assign connected-service roles.',
    to: '/docs/tenant-management/tenants',
    linkLabel: 'Go to tenant management',
  },
  {
    title: 'Integrate a connected service',
    audience: 'For connected service teams',
    description:
      'Set up a connected service, authenticate with CSTAR and retrieve the roles a user holds.',
    to: '/docs/connected-service-integration/getting-started',
    linkLabel: 'Start integrating',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="CSTAR Documentation"
      description="Documentation for Connected Services Team Access and Roles">
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            CSTAR Documentation
          </Heading>
          <p className={styles.lead}>
            Connected Services Team Access and Roles (CSTAR) manages who can
            access BC Government connected services, and with which roles, for
            each tenant.
          </p>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <div className="row">
          {entryPoints.map((entry) => (
            <div key={entry.title} className="col col--4 margin-bottom--lg">
              <div className={styles.card}>
                <p className={styles.audience}>{entry.audience}</p>
                <Heading as="h2" className={styles.cardTitle}>
                  {entry.title}
                </Heading>
                <p className={styles.cardText}>{entry.description}</p>
                <Link className={styles.cardLink} to={entry.to}>
                  {entry.linkLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}

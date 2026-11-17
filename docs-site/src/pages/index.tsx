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

type QuickLink = {
  label: string;
  description: string;
  to: string;
};

const entryPoints: EntryPoint[] = [
  {
    title: 'Understand CSTAR',
    audience: 'For anyone new to CSTAR',
    description: 'The access model, the core principles and the CSTAR roles.',
    to: '/docs/overview/what-is-cstar',
    linkLabel: 'Read the overview',
  },
  {
    title: 'Manage a tenant',
    audience: 'For tenant owners and user admins',
    description:
      'Tenant requests, tenant users, groups and the assignment of connected-service roles.',
    to: '/docs/tenant-management/tenants',
    linkLabel: 'Go to tenant management',
  },
  {
    title: 'Integrate a connected service',
    audience: 'For connected service teams',
    description:
      'Onboarding, authentication and the retrieval of a user’s roles.',
    to: '/docs/connected-service-integration/getting-started',
    linkLabel: 'Start integrating',
  },
];

const quickLinks: QuickLink[] = [
  {
    label: 'Core principles',
    description: 'The rules on which CSTAR is designed.',
    to: '/docs/overview/core-principles',
  },
  {
    label: 'Troubleshooting access',
    description: 'Error responses and how to resolve them.',
    to: '/docs/connected-service-integration/troubleshooting-access',
  },
  {
    label: 'Support',
    description: 'How to contact the CSTAR team.',
    to: '/docs/reference/support',
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
            Connected Services Team Access and Roles (CSTAR) manages access to
            BC Government connected services. Tenant administrators decide who
            belongs to their team and which roles each person holds. Connected
            services retrieve those roles from CSTAR.
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
        <section className={styles.quickLinks}>
          <Heading as="h2" className={styles.quickLinksTitle}>
            Frequently used pages
          </Heading>
          <ul className={styles.quickLinkList}>
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className={styles.quickLinkLabel}>
                  {link.label}
                </Link>
                <span className={styles.quickLinkText}>{link.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Layout>
  );
}

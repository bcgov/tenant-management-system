import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function Home(): ReactNode {
  return (
    <Layout
      title="CSTAR Documentation"
      description="Documentation for Connected Services Team Access and Roles">
      <main className="container margin-vert--xl">
        <Heading as="h1">CSTAR Documentation</Heading>
        <p>
          This site contains documentation for Connected Services Team Access
          and Roles.
        </p>
        <p>
          <Link to="/docs/overview/what-is-cstar">What is CSTAR?</Link>
        </p>
      </main>
    </Layout>
  );
}

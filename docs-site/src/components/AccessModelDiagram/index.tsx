import type {ReactNode} from 'react';
import styles from './styles.module.css';

type Step = {
  label: string;
  detail: string;
};

const steps: Step[] = [
  {label: 'Tenant', detail: 'A team whose access is managed together'},
  {label: 'Tenant users', detail: 'People added to the tenant'},
  {label: 'Groups', detail: 'Named sets of tenant users'},
  {
    label: 'Connected-service roles',
    detail: 'Assigned to groups by tenant owners and user admins',
  },
  {
    label: 'Effective roles',
    detail: 'Returned to the connected service for each user',
  },
];

export default function AccessModelDiagram(): ReactNode {
  return (
    <figure className={styles.figure}>
      <ol className={styles.flow}>
        {steps.map((step) => (
          <li key={step.label} className={styles.step}>
            <span className={styles.label}>{step.label}</span>
            <span className={styles.detail}>{step.detail}</span>
          </li>
        ))}
      </ol>
      <figcaption className={styles.caption}>
        Tenant users belong to a tenant. Groups contain tenant users, and
        connected-service roles are assigned to groups. A user&apos;s
        effective roles are the roles held by the groups they belong to.
      </figcaption>
    </figure>
  );
}

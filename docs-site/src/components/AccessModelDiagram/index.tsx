import type {ReactNode} from 'react';
import styles from './styles.module.css';

type Step = {
  label: string;
  detail: string;
};

const steps: Step[] = [
  {label: 'Tenant', detail: 'The team whose access is managed together'},
  {label: 'Tenant users', detail: 'People added to the tenant'},
  {label: 'Groups', detail: 'Named sets of tenant users'},
  {
    label: 'Connected-service roles',
    detail: 'Assigned to groups by a tenant owner or user admin',
  },
  {
    label: 'Effective roles',
    detail: 'Returned to the connected service when the user signs in',
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
        Users belong to a tenant, groups are made up of tenant users, and
        roles are assigned to groups. A user&apos;s effective roles come from
        the groups they belong to.
      </figcaption>
    </figure>
  );
}

import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Overview',
      items: [
        'overview/what-is-cstar',
        'overview/core-concepts',
        'overview/how-cstar-works',
        'overview/cstar-roles',
        'overview/connected-services',
      ],
    },
    {
      type: 'category',
      label: 'Tenant management',
      items: [
        'tenant-management/tenants',
        'tenant-management/tenant-users',
        'tenant-management/groups',
        'tenant-management/tenant-approval-workflow',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: ['security/identity-providers', 'security/authorization'],
    },
    {
      type: 'category',
      label: 'Connected service integration',
      items: [
        'connected-service-integration/getting-started',
        'connected-service-integration/authentication',
        'connected-service-integration/effective-roles',
        'connected-service-integration/connected-service-setup',
        'connected-service-integration/tenant-association',
        'connected-service-integration/troubleshooting-access',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['reference/api-reference'],
    },
  ],
};

export default sidebars;

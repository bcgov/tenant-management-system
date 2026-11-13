import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CSTAR Documentation',
  tagline: 'Connected Services Team Access and Roles',

  future: {
    v4: true,
  },

  url: process.env.DOCS_URL ?? 'http://localhost',
  baseUrl: process.env.DOCS_BASE_URL ?? '/',

  organizationName: 'bcgov',
  projectName: 'tenant-management-system',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/bcgov/tenant-management-system/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'CSTAR Documentation',
      items: [
        {
          type: 'doc',
          docId: 'overview/what-is-cstar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/bcgov/tenant-management-system',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'What is CSTAR',
              to: '/docs/overview/what-is-cstar',
            },
            {
              label: 'Core principles',
              to: '/docs/overview/core-principles',
            },
            {
              label: 'CSTAR roles',
              to: '/docs/overview/cstar-roles',
            },
          ],
        },
        {
          title: 'Manage a tenant',
          items: [
            {
              label: 'Tenants',
              to: '/docs/tenant-management/tenants',
            },
            {
              label: 'Groups',
              to: '/docs/tenant-management/groups',
            },
          ],
        },
        {
          title: 'Integrate a service',
          items: [
            {
              label: 'Getting started',
              to: '/docs/connected-service-integration/getting-started',
            },
            {
              label: 'API reference',
              to: '/docs/reference/api-reference',
            },
          ],
        },
        {
          title: 'Source',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/bcgov/tenant-management-system',
            },
          ],
        },
      ],
      copyright: 'Government of British Columbia',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

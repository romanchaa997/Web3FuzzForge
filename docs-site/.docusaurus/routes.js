import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '09d'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'f0b'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '5d8'),
            routes: [
              {
                path: '/docs/advanced-guides',
                component: ComponentCreator('/docs/advanced-guides', '8d0'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/commands-reference',
                component: ComponentCreator('/docs/commands-reference', '2da'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/community-test-examples',
                component: ComponentCreator('/docs/community-test-examples', '9cd'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/cross-chain-testing',
                component: ComponentCreator('/docs/cross-chain-testing', '1c9'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/installation',
                component: ComponentCreator('/docs/installation', 'ce6'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '853'),
                exact: true
              },
              {
                path: '/docs/mobile-wallets',
                component: ComponentCreator('/docs/mobile-wallets', 'ff1'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/overview',
                component: ComponentCreator('/docs/overview', '0b5'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/quickstart',
                component: ComponentCreator('/docs/quickstart', 'cc0'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/real-wallet-integration',
                component: ComponentCreator('/docs/real-wallet-integration', '7fd'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/reporting-overview',
                component: ComponentCreator('/docs/reporting-overview', 'c10'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/security-testing',
                component: ComponentCreator('/docs/security-testing', 'd4c'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/vulnerability-categorization',
                component: ComponentCreator('/docs/vulnerability-categorization', 'ab0'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/wallet-state-snapshots',
                component: ComponentCreator('/docs/wallet-state-snapshots', '0e3'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/docs/why-it-matters',
                component: ComponentCreator('/docs/why-it-matters', '019'),
                exact: true,
                sidebar: "mainSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

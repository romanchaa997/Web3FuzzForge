module.exports = {
  title: 'Web3FuzzForge',
  tagline: 'Automated test scaffolding for Web3 developers',
  url: 'https://web3fuzzforge.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'web3fuzzforge', // Usually your GitHub org/user name.
  projectName: 'web3-security-test-kit', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/web3fuzzforge/web3-security-test-kit/edit/main/docs-site/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Web3FuzzForge',
      logo: {
        alt: 'Web3FuzzForge Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/intro',
          activeBasePath: 'docs',
          label: 'Documentation',
          position: 'left',
        },
        {
          href: 'https://github.com/web3fuzzforge/web3-security-test-kit',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: 'docs/intro',
            },
            {
              label: 'Installation',
              to: 'docs/installation',
            },
            {
              label: 'Quickstart',
              to: 'docs/quickstart',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/web3fuzzforge/web3-security-test-kit/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/web3fuzzforge/web3-security-test-kit',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Web3FuzzForge. Built with Docusaurus.`,
    },
  },
};

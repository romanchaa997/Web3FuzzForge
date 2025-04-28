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
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          includeCurrentVersion: true,
          versions: {
            current: {
              label: 'Current',
              path: '',
            },
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/web3fuzzforge/web3-security-test-kit/edit/main/docs-site/blog/',
          postsPerPage: 5,
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 10,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    algolia: {
      appId: 'YOUR_APP_ID', // Replace with actual Algolia App ID once you have it
      apiKey: 'YOUR_SEARCH_API_KEY', // Replace with actual API key once you have it
      indexName: 'web3fuzzforge',
      contextualSearch: true,
    },
    navbar: {
      title: 'Web3FuzzForge',
      logo: {
        alt: 'Web3FuzzForge Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          to: 'docs/intro',
          activeBasePath: 'docs',
          label: 'Documentation',
          position: 'left',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left'
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
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
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    image: 'img/logo-social.png', // Image used in social card
    metadata: [{name: 'keywords', content: 'web3, security, testing, blockchain, ethereum, wallet'}],
  },
};

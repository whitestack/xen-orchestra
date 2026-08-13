import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Nephora Conductor',
  tagline: 'Discover how to use Nephora Conductor',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  // Set the production url of your site here
  url: 'https://docs.whitestack.com/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/nephora-conductor/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // organizationName: 'facebook', // Usually your GitHub org/user name.
  // projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    require.resolve('docusaurus-lunr-search'),
     [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/manage_infrastructure#vms',
            from: '/administration',
          },
          {
            to: '/users#acls',
            from: '/acls',
          },
          {
            to: '/incremental_replication',
            from: '/continuous_replication',
          },
          {
            to: '/advanced#alerts',
            from: '/alerts',
          },
          {
            to: '/architecture#plugins',
            from: '/plugins',
          },
          {
            to: '/troubleshooting',
            from: '/general-troubleshooting',
          },
        ],
      },
    ],
  ],
  scripts: [
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          exclude: [
            '**/support/**',
            '**/project/**'
          ]
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/vates-xo-logo-smol-new-baseline.png',
    navbar: {
      title: 'Nephora Conductor (NC)',
      logo: { alt: 'Nephora Conductor logo', src: 'img/logo.png', href: '/' },
      items: [
        { href: '/', label: 'Home', position: 'right' }
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Whitestack`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config

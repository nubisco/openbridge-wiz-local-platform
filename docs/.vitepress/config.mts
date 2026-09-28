import { defineConfig } from 'vitepress'

/** Getting bulbs working: what almost every reader came for. */
const usingIt = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Introduction', link: '/introduction' },
      { text: 'Installation', link: '/installation' },
      { text: 'Finding your bulbs', link: '/finding-bulbs' },
    ],
  },
  {
    text: 'Configuration',
    items: [
      { text: 'Configuration', link: '/configuration' },
      { text: 'Examples', link: '/config-example' },
    ],
  },
  {
    text: 'Help',
    items: [
      { text: 'Migrating', link: '/migrating' },
      { text: 'How it works', link: '/how-it-works' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
    ],
  },
  {
    text: 'Working on the plugin',
    items: [{ text: 'Contributing', link: '/contributing' }],
  },
]

/** Working on the plugin rather than with it. */
const contributing = [
  {
    text: 'Contributing',
    items: [
      { text: 'How to contribute', link: '/contributing' },
      { text: 'Credits', link: '/credits' },
    ],
  },
  {
    text: 'Back to the guide',
    items: [{ text: 'Using the plugin', link: '/introduction' }],
  },
]

export default defineConfig({
  title: 'OpenBridge WiZ Local Platform',
  description: 'Control WiZ lights locally over UDP through OpenBridge and Apple HomeKit.',

  base: '/openbridge-wiz-local-platform/',

  head: [
    ['link', { rel: 'icon', href: '/openbridge-wiz-local-platform/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#22335e' }],
    ['meta', { name: 'keywords', content: 'openbridge, wiz, local, homekit, plugin, smart-home' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'OpenBridge WiZ Local Platform' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Control WiZ lights locally over UDP through OpenBridge and Apple HomeKit.',
      },
    ],
    [
      'script',
      {
        defer: '',
        src: 'https://analytics.nubisco.io/script.js',
        'data-app': 'openbridge-wiz-docs',
      },
    ],
  ],

  sitemap: {
    hostname: 'https://docs.nubisco.io/openbridge-wiz-local-platform/',
  },

  lastUpdated: true,

  themeConfig: {
    siteTitle: 'WiZ Local Platform',
    logo: { src: '/logo-mini.svg', width: 24, height: 24 },

    // TWO DOORS, SPLIT BY ACTIVITY, NOT PERSONA. Everyone reading this is the
    // same self-hosting person: install, JSON config, troubleshooting. A users
    // versus developers split would put a door here with nobody behind it.
    // What differs is what you came to do. See "Documentation sites" in the
    // workspace AGENTS.md for the plugin tier.
    nav: [
      { text: 'Using it', link: '/introduction' },
      { text: 'Contributing', link: '/contributing' },
      {
        text: 'Project',
        items: [
          { text: 'Repository', link: 'https://github.com/nubisco/openbridge-wiz-local-platform' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@nubisco/openbridge-wiz-local-platform' },
          {
            text: 'Contributing',
            link: 'https://github.com/nubisco/openbridge-wiz-local-platform/blob/master/CONTRIBUTING.md',
          },
          { text: 'Sponsor', link: 'https://github.com/sponsors/joseporto' },
        ],
      },
      {
        text: 'Nubisco',
        items: [
          { text: 'nubisco.io', link: 'https://nubisco.io' },
          { text: 'OpenBridge', link: 'https://github.com/nubisco/openbridge' },
          { text: 'Tuya Local Platform', link: 'https://docs.nubisco.io/openbridge-tuya-local-platform/' },
          { text: 'Nubisco UI', link: 'https://docs.nubisco.io/ui/' },
        ],
      },
    ],

    // Every page sits at the root, so the two halves are keyed page by page
    // rather than by directory. Nothing moves, so no published URL changes.
    sidebar: {
      '/contributing': contributing,
      '/credits': contributing,
      '/': usingIt,
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/nubisco/openbridge-wiz-local-platform' }],

    editLink: {
      pattern: 'https://github.com/nubisco/openbridge-wiz-local-platform/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    lastUpdated: {
      text: 'Last updated',
    },

    footer: {
      message:
        'Released under the <a href="https://github.com/nubisco/openbridge-wiz-local-platform/blob/master/LICENSE">MIT License</a>. · <a href="https://github.com/sponsors/joseporto">♥ Sponsor this project</a>',
      copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
    },
  },
})

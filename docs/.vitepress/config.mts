import { defineConfig } from 'vitepress'

// Project page on github.io, so the site lives under a subpath. VitePress
// rewrites the links it owns but passes `head` through verbatim, so anything
// there has to carry the prefix itself.
const base = '/openbridge-wiz-local-platform/'

export default defineConfig({
  title: 'OpenBridge WiZ Local',
  description: 'Control WiZ lights locally over UDP, without cloud or broadcast discovery',
  base,
  cleanUrls: true,
  lastUpdated: true,

  head: [['meta', { name: 'theme-color', content: '#0d0d0f' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'Configuration', link: '/configuration' },
      { text: 'OpenBridge', link: 'https://github.com/nubisco/openbridge' },
    ],

    sidebar: [
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
          { text: 'Migrating from homebridge-wiz-lan', link: '/migrating' },
          { text: 'How it works', link: '/how-it-works' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
      {
        text: 'Working on the plugin',
        items: [{ text: 'Contributing', link: '/contributing' }],
      },
    ],

    search: { provider: 'local' },

    socialLinks: [{ icon: 'github', link: 'https://github.com/nubisco/openbridge-wiz-local-platform' }],

    editLink: {
      pattern: 'https://github.com/nubisco/openbridge-wiz-local-platform/edit/master/docs/:path',
      text: 'Suggest changes to this page',
    },

    footer: {
      message: 'Part of the Nubisco ecosystem · MIT License',
      copyright: '© 2026 Nubisco',
    },
  },
})

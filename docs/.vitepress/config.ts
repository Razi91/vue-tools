import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vue Tools",
  description: "Vue high-level utilities done right",
  base: "/vue-tools",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Event bus', link: '/event-bus/' },
      { text: 'Form tools', link: '/form-tools/' },
    ],

    sidebar: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Event bus',
        items: [
          { text: 'Intro', link: '/event-bus/' },
          { text: 'Defining and creating', link: '/event-bus/defining' },
          { text: 'Emitting and receiving', link: '/event-bus/emitting-and-receiving' },
          { text: 'Advanced stuff', link: '/event-bus/advanced' },
          { text: 'Debugging', link: '/event-bus/debugging' }
        ]
      },
      {
        text: 'Form tools',
        items: [
          { text: 'Intro', link: '/form-tools/' },
          { text: 'Config', link: '/form-tools/config' },
          { text: 'Asynchronous setters', link: '/form-tools/async' },
          { text: 'Chained setters', link: '/form-tools/chained-setters' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Razi91/vue-tools' }
    ]
  }
})

// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    preset: "static"
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000',
    },
  },

  imports: {
    dirs: ['composables', 'utils'],
  },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  site: {
    name: 'Kampang Official',
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/logo-ko.svg' },
        { rel: 'apple-touch-icon', href: '/logo-ko.svg' },
      ],
      titleTemplate: '%s Kampang Official',
      meta: [
        {
          name: 'description',
          content: 'Kampang Official adalah platform confess dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
        },
        {
          name: 'keywords',
          content: 'Kampang Official, platform, blog modern, berbagi cerita, pengalaman, pemikiran, fitur inovatif, antarmuka user-friendly, ekspresikan diri, privasi, keamanan, komunitas, cerita menarik',
        },

        // Open Graph
        {
          property: 'og:title',
          content: 'Kampang Official',
        },
        {
          property: 'og:description',
          content: 'Kampang Official adalah platform confess dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
        },
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:url',
          content: 'https://kampangofficial.vercel.app',
        },
        {
          property: 'og:image',
          content: 'https://kampangofficial.vercel.app/logo-ko.png',
        },

        // Twitter
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: 'Kampang Official',
        },
        {
          name: 'twitter:description',
          content: 'Kampang Official adalah platform confess dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
        },
        {
          name: 'twitter:image',
          content: 'https://kampangofficial.vercel.app/logo-ko.png',
        },
      ],
    },
  },

  modules: [
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/google-fonts',
    '@nuxtjs/seo',
    'nuxt-auth-sanctum',
    'nuxt-google-auth'
  ],

  googleFonts: {
    families: {
      Manrope: true,
      Mansalva: true,
      Rubik: true,
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
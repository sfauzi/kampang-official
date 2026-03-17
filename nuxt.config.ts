// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    preset: "static"
  },
  
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

  modules: [
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/google-fonts',
    '@nuxtjs/seo',
    '@nuxtjs/tailwindcss',
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
})
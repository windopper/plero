import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fastly.jsdelivr.net/gh/projectnoonnu/2503@1.0/KakaoSmallSans-Bold.woff2",
        },
      ],
    },
  },
  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "plero-color-mode",
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/color-mode", "@nuxt/content", "@nuxtjs/mdc", "nuxt-auth-utils"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'debug',
        'debug/src/browser'
      ]
    }
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
      }
    }
  }
});
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "plero-color-mode",
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/color-mode",
    "@nuxtjs/mdc",
    "nuxt-auth-utils",
    "@nuxt/test-utils/module"
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["debug", "debug/src/browser"],
    },
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
      },
    },
  },
});
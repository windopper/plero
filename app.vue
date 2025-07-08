<script setup lang="ts">
import Header from './components/Header.vue'
import Body from './components/Body.vue'
import Footer from './components/common/Footer.vue'
</script>

<template>
  <NuxtRouteAnnouncer />
  <Header></Header>

  <Body>
    <NuxtPage />
  </Body>
  <Footer></Footer>
</template>

<style>
@import 'tailwindcss';

* {
  transition: all 0.15s ease;
}

body {
  overflow-x: hidden;
  font-family: 'KakaoSmallSans-Bold', sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--ui-bg);
  color: var(--ui-text);
}
</style>
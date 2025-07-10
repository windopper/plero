<script setup>
import HorizontalLine from '~/components/common/HorizontalLine.vue';
import { Icon } from '@iconify/vue';

const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()


watch(loggedIn, (newVal) => {
  if (newVal) {
    navigateTo('/');
  }
})
</script>

<template>
  <div v-if="loggedIn">
    <h1>Welcome {{ user.login }}!</h1>
    <p>Logged in since {{ session.loggedInAt }}</p>
    <button @click="clear">Logout</button>
  </div>
  <div v-else class="mx-auto h-[584px] max-w-lg border-x border-[var(--ui-border)] p-16">
    <div class="flex flex-col justify-center items-center gap-6 relative w-full h-full">
      <HorizontalLine class="top-0" />
      <div class="flex flex-col justify-center items-center gap-6">
        <h1 class="text-2xl font-bold">로그인</h1>
        <p class="text-sm text-[var(--ui-text-dimmed)]">로그인 후 더 많은 기능을 이용해보세요.</p>
        <button
          class="bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] px-4 py-2 rounded-md 
          w-full flex items-center justify-center cursor-pointer gap-2"
          @click="openInPopup('/auth/google')">
          <Icon icon="flat-color-icons:google" width="24" height="24" />
          <span class="text-sm font-semibold">Google로 로그인</span>
        </button>
      </div>
      <HorizontalLine class="bottom-0" />
    </div>
  </div>
</template>
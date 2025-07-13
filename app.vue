<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Header from './components/Header.vue'
import Body from './components/Body.vue'
import Footer from './components/common/Footer.vue'
import AuthorizePopup from './components/common/AuthorizePopup.vue'
import AdminPanel from './components/admin/AdminPanel.vue'

const authorizePopup = useAuthorizeStore()
const adminPanel = useAdminPanelStore()

// 사용자 세션 및 권한 확인
const { user } = useUserSession()

// 관리자 권한 확인
const isAdmin = computed(() => {
  return user.value?.role === 'admin'
})

// 어드민 패널 토글 함수
const toggleAdminPanel = () => {
  adminPanel.value.visible = !adminPanel.value.visible
}

// 키보드 단축키 (Ctrl+Shift+A)
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'A' && isAdmin.value) {
    event.preventDefault()
    toggleAdminPanel()
  }
}

onMounted(() => {
  authorizePopup.value.popupOpen = false
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <NuxtRouteAnnouncer />
  
  <!-- 어드민 패널 토글 버튼 (관리자만 표시) -->
  <button
    v-if="isAdmin"
    @click="toggleAdminPanel"
    class="admin-toggle-btn"
    title="관리자 패널 열기 (Ctrl+Shift+A)"
  >
    <Icon icon="mdi:shield-crown" class="text-lg" />
  </button>
  
  <Header></Header>

  <Body>
    <NuxtPage />
  </Body>
  
  <Footer></Footer>
  
  <AuthorizePopup 
    :visible="authorizePopup.popupOpen" 
    @close="authorizePopup.popupOpen = false"
    @login="authorizePopup.popupOpen = false" 
    :return-url="authorizePopup.returnUrl" 
  />
  
  <!-- 어드민 패널 (관리자만 표시) -->
  <AdminPanel
    v-if="isAdmin"
    :visible="adminPanel.visible"
    @toggle="toggleAdminPanel"
  />
</template>

<style>
@import 'tailwindcss';
@import './assets/css/main.css';
@custom-variant dark (&:where(.dark, .dark *));

html {
  overflow-x: hidden;
}

body {
  overflow-x: hidden;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--ui-bg);
  color: var(--ui-text);
}

/* 어드민 패널 토글 버튼 */
.admin-toggle-btn {
  @apply fixed top-4 right-4 z-40;
  @apply bg-red-500 hover:bg-red-600 text-white;
  @apply w-12 h-12 rounded-full shadow-lg;
  @apply flex items-center justify-center;
  @apply transition-all duration-200;
  @apply hover:scale-110 active:scale-95;
}

.admin-toggle-btn:hover {
  @apply shadow-xl;
}
</style>
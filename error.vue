<script setup>
import NotFound from '~/components/common/404.vue';
import { Icon } from '@iconify/vue';

const error = useError()

// 에러 정보 추출
const statusCode = error.value?.statusCode || 404
const statusMessage = error.value?.statusMessage || '알 수 없는 오류가 발생했습니다'

// 상세 에러 메시지 표시 여부 (에러 디버깅용)
const showDetailedError = computed(() => {
  return statusMessage && statusMessage !== '알 수 없는 오류가 발생했습니다'
})

// 에러 타입별 메시지 정의
const getErrorInfo = (code) => {
  switch (code) {
    case 400:
      return {
        title: '잘못된 요청',
        message: '요청이 올바르지 않습니다.',
        description: '입력한 정보를 다시 확인해주세요.',
        icon: 'material-symbols:error-outline'
      }
    case 401:
      return {
        title: '인증이 필요합니다',
        message: '로그인이 필요한 페이지입니다.',
        description: '로그인 후 다시 시도해주세요.',
        icon: 'material-symbols:lock-outline'
      }
    case 403:
      return {
        title: '접근이 거부되었습니다',
        message: '이 페이지에 접근할 권한이 없습니다.',
        description: '관리자에게 문의하거나 다른 페이지를 이용해주세요.',
        icon: 'material-symbols:block'
      }
    case 404:
      return null // 기존 404 컴포넌트 사용
    case 500:
      return {
        title: '서버 오류',
        message: '서버에 문제가 발생했습니다.',
        description: '잠시 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의해주세요.',
        icon: 'material-symbols:warning-outline'
      }
    default:
      return null
  }
}

const errorInfo = getErrorInfo(statusCode)
</script>

<template>
    <!-- 404 에러는 기존 컴포넌트 사용 -->
    <NotFound v-if="statusCode === 404" />
    
    <!-- 다른 에러들은 새로운 에러 페이지 -->
    <div v-else class="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full text-center">
            <!-- 에러 아이콘 -->
            <div class="mb-8">
                <div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <Icon :icon="errorInfo.icon" 
                          class="text-red-600 dark:text-red-400" 
                          width="32" height="32" />
                </div>
                
                <!-- 상태 코드 -->
                <div class="text-6xl font-bold text-[var(--ui-text-highlighted)] mb-2">
                    {{ statusCode }}
                </div>
                
                <!-- 에러 제목 -->
                <h1 class="text-2xl font-bold text-[var(--ui-text-highlighted)] mb-4">
                    {{ errorInfo.title }}
                </h1>
                
                <!-- 에러 메시지 -->
                <p class="text-lg text-[var(--ui-text-muted)] mb-2">
                    {{ errorInfo.message }}
                </p>
                <p class="text-sm text-[var(--ui-text-dimmed)]">
                    {{ errorInfo.description }}
                </p>
                
                <!-- 상세 에러 메시지 -->
                <div v-if="showDetailedError" class="mt-4 p-3 bg-[var(--ui-bg-muted)] rounded-lg">
                    <p class="text-xs text-[var(--ui-text-muted)] font-mono">
                        {{ statusMessage }}
                    </p>
                </div>
            </div>

            <!-- 액션 버튼들 -->
            <div class="space-y-4">
                <!-- 홈으로 돌아가기 버튼 -->
                <NuxtLink to="/" 
                         class="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg">
                    <Icon icon="material-symbols:home" width="20" height="20" />
                    <span class="font-medium">홈페이지로 돌아가기</span>
                </NuxtLink>

                <!-- 로그인 버튼 (401, 403 에러인 경우) -->
                <NuxtLink v-if="statusCode === 401" 
                         to="/login" 
                         class="flex items-center justify-center gap-2 w-full px-6 py-3 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200">
                    <Icon icon="material-symbols:login" width="20" height="20" />
                    <span class="font-medium">로그인하기</span>
                </NuxtLink>

                <!-- 위키 목록 보기 버튼 -->
                <NuxtLink to="/wiki/list" 
                         class="flex items-center justify-center gap-2 w-full px-6 py-3 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200">
                    <Icon icon="material-symbols:list" width="20" height="20" />
                    <span class="font-medium">위키 목록 보기</span>
                </NuxtLink>

                <!-- 뒤로가기 버튼 -->
                <button @click="$router.go(-1)"
                       class="flex items-center justify-center gap-2 w-full px-6 py-3 text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text-muted)] transition-colors duration-200">
                    <Icon icon="material-symbols:arrow-back" width="20" height="20" />
                    <span class="font-medium">이전 페이지로 돌아가기</span>
                </button>

                <!-- 새로고침 버튼 (500 에러인 경우) -->
                <button v-if="statusCode >= 500" 
                       @click="window.location.reload()"
                       class="flex items-center justify-center gap-2 w-full px-6 py-3 text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text-muted)] transition-colors duration-200">
                    <Icon icon="material-symbols:refresh" width="20" height="20" />
                    <span class="font-medium">페이지 새로고침</span>
                </button>
            </div>
        </div>
    </div>
</template>
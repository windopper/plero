<template>
    <div class="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full text-center">

            <!-- 메인 메시지 -->
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-[var(--ui-text-highlighted)] mb-4">
                    페이지를 찾을 수 없습니다
                </h1>
                <p class="text-lg text-[var(--ui-text-muted)] mb-2">
                    요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
                </p>
                <p class="text-sm text-[var(--ui-text-dimmed)]">
                    URL을 다시 확인하거나 홈페이지에서 원하는 내용을 찾아보세요.
                </p>
            </div>

            <!-- 액션 버튼들 -->
            <div class="space-y-4">
                <!-- 홈으로 돌아가기 버튼 -->
                <NuxtLink to="/" 
                         class="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg">
                    <Icon icon="material-symbols:home" width="20" height="20" />
                    <span class="font-medium">홈페이지로 돌아가기</span>
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
            </div>

            <!-- 추가 도움말 -->
            <div class="mt-12 pt-8 border-t border-[var(--ui-border)]">
                <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-4">
                    이런 경우에 도움이 될 수 있어요
                </h2>
                <div class="grid gap-3 text-left">
                    <div class="flex items-start gap-3">
                        <Icon icon="material-symbols:search" 
                              class="text-[var(--ui-primary)] mt-0.5 flex-shrink-0" 
                              width="18" height="18" />
                        <div>
                            <p class="text-sm font-medium text-[var(--ui-text)]">검색 기능 사용</p>
                            <p class="text-xs text-[var(--ui-text-muted)]">원하는 위키를 검색해보세요</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Icon icon="material-symbols:add-circle-outline" 
                              class="text-[var(--ui-primary)] mt-0.5 flex-shrink-0" 
                              width="18" height="18" />
                        <div>
                            <p class="text-sm font-medium text-[var(--ui-text)]">새 위키 만들기</p>
                            <p class="text-xs text-[var(--ui-text-muted)]">원하는 주제의 위키를 직접 만들어보세요</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
</script>
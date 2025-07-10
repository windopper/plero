<script setup>
import Container from '~/components/wiki/Container.vue';
import { MdPreview } from 'md-editor-v3';
import { Icon } from '@iconify/vue';

const route = useRoute()
const id = route.params.id
const historyId = route.params.historyId

const { data: response } = await useFetch(`/api/wiki/${id}/history/${historyId}/diff`)
console.log(response.value.data.changedLines)

// 뒤로가기 함수들
const navigateToHistory = () => {
    navigateTo(`/wiki/${id}/history`)
}

const navigateToWiki = () => {
    navigateTo(`/wiki/${id}`)
}

const navigateToVersion = () => {
    navigateTo(`/wiki/${id}/history/${historyId}`)
}
</script>

<template>
    <div class="min-h-screen bg-[var(--ui-bg)]">
        <!-- 상단 헤더 -->
        <div class="sticky top-0 z-10 bg-[var(--ui-bg)] border-b-[1px] border-[var(--ui-border)]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4 flex-wrap gap-4">
                    <!-- 왼쪽: 브레드크럼 -->
                    <div class="flex items-center gap-2 text-sm">
                        <button 
                            @click="navigateToHistory" 
                            class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group"
                        >
                            <Icon icon="material-symbols:arrow-back" width="20" height="20" class="group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium">변경 기록</span>
                        </button>
                        <div class="ml-2 h-6 w-px bg-[var(--ui-border)]"></div>
                        <h1 class="ml-2 text-lg font-semibold text-[var(--ui-text)]">변경 사항 비교</h1>
                    </div>
                    
                    <!-- 오른쪽: 액션 버튼들 -->
                    <div class="flex items-center gap-3">
                        <button 
                            @click="navigateToVersion"
                            class="flex items-center gap-2 px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200"
                        >
                            <Icon icon="material-symbols:visibility" width="16" height="16" />
                            <span class="text-sm font-medium">이 버전 보기</span>
                        </button>
                        <button 
                            @click="navigateToWiki"
                            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <Icon icon="material-symbols:article" width="16" height="16" />
                            <span class="text-sm font-medium">현재 위키</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <!-- Diff 카드 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <!-- 헤더 -->
                <div class="px-6 py-4 border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">변경 내용</h2>
                        <div class="flex items-center gap-6">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-green-200 dark:bg-green-600 rounded"></div>
                                <span class="text-sm text-[var(--ui-text-muted)]">추가됨</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-red-200 dark:bg-red-600 rounded"></div>
                                <span class="text-sm text-[var(--ui-text-muted)]">제거됨</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Diff 내용 -->
                <div class="p-6">
                    <div class="space-y-1 font-mono text-sm">
                        <div v-for="line in response.data.changedLines" :key="line.line" class="diff-line group">
                            <div class="line-number">
                                {{ line.line + 1 }}
                            </div>
                            <div class="line-content">
                                <span v-for="part in line.diff" :key="part.index" class="diff-part">
                                    <span v-if="part.added" class="added">{{ part.value }}</span>
                                    <span v-else-if="part.removed" class="removed">{{ part.value }}</span>
                                    <span v-else class="unchanged">{{ part.value }}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 변경사항이 없는 경우 -->
                    <div v-if="!response?.data?.changedLines || response.data.changedLines.length === 0" class="text-center py-12">
                        <Icon icon="material-symbols:check-circle-outline" width="48" height="48" class="mx-auto text-[var(--ui-text-muted)] mb-4" />
                        <h3 class="text-lg font-medium text-[var(--ui-text)] mb-2">변경사항 없음</h3>
                        <p class="text-[var(--ui-text-muted)]">이 버전에서는 내용 변경이 없습니다.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference '~/assets/css/main.css';

.diff-line {
    @apply flex bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)] rounded-lg overflow-hidden;
}

.diff-line:hover {
    @apply bg-[var(--ui-bg-elevated)] border-[var(--ui-border-accented)];
}

.line-number {
    @apply flex-shrink-0 px-3 py-2 text-right select-none bg-[var(--ui-bg-accented)] text-[var(--ui-text-muted)] border-r border-[var(--ui-border)];
    width: 60px;
    font-size: 12px;
    line-height: 1.5;
}

.line-content {
    @apply flex-1 px-3 py-2 min-w-0;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    word-break: break-all;
}

.diff-part {
    @apply inline;
}

.added {
    @apply bg-green-50 text-green-700 rounded;
}

.removed {
    @apply bg-red-50 text-red-700 rounded line-through;
}

.unchanged {
    @apply text-[var(--ui-text)];
}

/* 다크 모드 스타일 */
.dark .added {
    @apply bg-green-900/20 text-green-300;
}

.dark .removed {
    @apply bg-red-900/20 text-red-300;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .line-number {
        width: 50px;
        font-size: 11px;
    }
    
    .line-content {
        font-size: 13px;
        @apply px-2 py-1;
    }
}
</style>
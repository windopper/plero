<script setup>
import Container from '~/components/wiki/Container.vue';
import { MdPreview } from 'md-editor-v3';
import { Icon } from '@iconify/vue';
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';

const route = useRoute()
const id = route.params.id
const historyId = route.params.historyId

const { data: response, error } = await useFetch(`/api/wiki/${id}/history/${historyId}/diff`)

if (error.value) {
    throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.statusMessage,
    })
}

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
    <!-- 상단 헤더 -->
    <ContentHeader>
        <!-- 왼쪽: 브레드크럼 -->
        <NavigationTitle title="변경 사항 비교" backButton :navigatePath="`/wiki/${id}/history/${historyId}`" />

        <!-- 오른쪽: 액션 버튼들 -->
        <div class="flex items-center gap-3">
            <button @click="navigateToVersion"
                class="action-button text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]">
                <Icon icon="material-symbols:visibility" width="16" height="16" />
                <span class="text-sm font-medium">이 버전 보기</span>
            </button>
            <button @click="navigateToWiki"
                class="action-button bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)]">
                <Icon icon="material-symbols:article" width="16" height="16" />
                <span class="text-sm font-medium">현재 위키</span>
            </button>
        </div>
    </ContentHeader>

    <!-- 메인 컨텐츠 -->
    <ContentBody>
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
                <div class="font-mono text-sm">
                    <div v-for="(line, index) in response.data.changedLines" :key="line.line" class="diff-line group"
                        :class="{
                                 'rounded-t-lg': index === 0 || line.line !== response.data.changedLines[index - 1]?.line + 1,
                                 'rounded-b-lg': index === response.data.changedLines.length - 1 || line.line + 1 !== response.data.changedLines[index + 1]?.line,
                                 'border-t': index === 0 || line.line !== response.data.changedLines[index - 1]?.line + 1,
                                 'border-b': index === response.data.changedLines.length - 1 || line.line + 1 !== response.data.changedLines[index + 1]?.line,
                                 'border-l border-r': true,
                                 'mb-2': index === response.data.changedLines.length - 1 || line.line + 1 !== response.data.changedLines[index + 1]?.line
                             }">
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
                <div v-if="!response?.data?.changedLines || response.data.changedLines.length === 0"
                    class="text-center py-12">
                    <Icon icon="material-symbols:check-circle-outline" width="48" height="48"
                        class="mx-auto text-[var(--ui-text-muted)] mb-4" />
                    <h3 class="text-lg font-medium text-[var(--ui-text)] mb-2">변경사항 없음</h3>
                    <p class="text-[var(--ui-text-muted)]">이 버전에서는 내용 변경이 없습니다.</p>
                </div>
            </div>
        </div>
    </ContentBody>
</template>

<style scoped>
@reference '~/assets/css/main.css';

.diff-line {
    @apply flex bg-[var(--ui-bg-muted)] border-[var(--ui-border-muted)] overflow-hidden;
}

.diff-line:hover {
    @apply bg-[var(--ui-bg-elevated)] border-[var(--ui-border-accented)];
}

/* 연속된 라인들의 경계선 제거 */
.diff-line:not(.border-t) {
    @apply border-t-0;
}

.diff-line:not(.border-b) {
    @apply border-b-0;
}

/* 라운드 모서리 적용 */
.diff-line.rounded-t-lg {
    @apply rounded-t-lg;
}

.diff-line.rounded-b-lg {
    @apply rounded-b-lg;
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
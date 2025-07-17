<script setup lang="ts">
import { Icon } from '@iconify/vue';


const props = defineProps<{
    id: string;
    masterVersion: number;
}>();

const [{ data: masterWiki }, { data: latestHistory }] = await Promise.all([
    useFetch(`/api/wiki/${props.id}/history/version/${props.masterVersion}`),
    useFetch(`/api/wiki/${props.id}/history/latest`)
]);

if (!masterWiki.value?.success || !latestHistory.value?.success) {
    console.log("Failed to get wiki history");
    throw createError({
        statusCode: 500,
        statusMessage: "Failed to get wiki history"
    })
}

const contentDiff = getContentDiff(masterWiki.value.data.content, latestHistory.value.data.content);
const changedLines = getChangedLineFromDiff(contentDiff.diff);
</script>

<template>
    <div class="bg-[var(--ui-bg)] border border-[var(--ui-warning)] rounded-xl shadow-sm p-6 space-y-6">
        <!-- 헤더 -->
        <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2 flex items-center gap-2">
                <Icon icon="material-symbols:merge-type" class="w-5 h-5 text-[var(--ui-warning)]" />
                자동 병합 충돌
            </h3>
            <p class="text-[var(--ui-text-muted)]">
                다른 사용자가 수정한 내용이 있습니다. 아래 변경사항을 확인하고 편집기에 반영한 후 저장해주세요.
            </p>
        </div>

        <!-- 변경사항 통계 -->
        <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-[var(--ui-text-muted)]">추가된 내용 {{ contentDiff.added }}개</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span class="text-[var(--ui-text-muted)]">삭제된 내용 {{ contentDiff.removed }}개</span>
            </div>
        </div>

        <!-- 변경사항 목록 -->
        <div class="space-y-4">
            <h4 class="font-medium text-[var(--ui-text)] flex items-center gap-2">
                <Icon icon="material-symbols:list-alt" class="w-4 h-4" />
                변경된 줄 목록
            </h4>
            
            <div class="space-y-3 max-h-96 overflow-y-auto">
                <div v-for="(line, index) in changedLines" :key="line.line" class="diff-line group"
                        :class="{
                                 'rounded-t-lg': index === 0 || line.line !== changedLines[index - 1]?.line + 1,
                                 'rounded-b-lg': index === changedLines.length - 1 || line.line + 1 !== changedLines[index + 1]?.line,
                                 'border-t': index === 0 || line.line !== changedLines[index - 1]?.line + 1,
                                 'border-b': index === changedLines.length - 1 || line.line + 1 !== changedLines[index + 1]?.line,
                                 'border-l border-r': true,
                                 'mb-2': index === changedLines.length - 1 || line.line + 1 !== changedLines[index + 1]?.line
                             }">
                        <div class="line-number">
                            {{ line.line + 1 }}
                        </div>
                        <div class="line-content">
                            <span v-for="(part, index) in line.diff" :key="index" class="diff-part">
                                <span v-if="part.added" class="added">{{ part.value }}</span>
                                <span v-else-if="part.removed" class="removed">{{ part.value }}</span>
                                <span v-else class="unchanged">{{ part.value }}</span>
                            </span>
                        </div>
                    </div>
            </div>

            <!-- 변경사항이 없는 경우 -->
            <div v-if="changedLines.length === 0" 
                 class="text-center py-8 text-[var(--ui-text-muted)]">
                <Icon icon="material-symbols:check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>감지된 충돌이 없습니다.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference '~/assets/css/main.css';

.diff-container {
    @apply space-y-1;
}

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
    @apply flex-1 px-3 py-2 min-w-0 font-mono;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    word-break: break-all;
}

.added {
    @apply bg-green-50 text-green-700 rounded px-1;
}

.removed {
    @apply bg-red-50 text-red-700 rounded line-through px-1;
}

.unchanged {
    @apply text-[var(--ui-text)];
}

.copy-button-container {
    @apply flex-shrink-0 px-3 py-2 border-l border-[var(--ui-border)];
}

.copy-button {
    @apply text-xs text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors flex items-center gap-1 px-2 py-1 rounded bg-[var(--ui-bg)] hover:bg-[var(--ui-bg-elevated)];
}

.copy-guide {
    @apply text-xs text-[var(--ui-text-muted)] bg-[var(--ui-bg-muted)] rounded-md p-2 mt-2;
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
    
    .copy-button-container {
        @apply px-2;
    }
}
</style>
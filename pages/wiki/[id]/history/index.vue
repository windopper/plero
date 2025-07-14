<script setup lang="ts">
import RevertModal from '~/components/wiki/RevertModal.vue';
import HistoryCard from '~/components/wiki/HistoryCard.vue';
import { Icon } from '@iconify/vue';
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';

const route = useRoute()
const id = route.params.id
const { data: response, error } = await useFetch(`/api/wiki/${id}/history`)

if (error.value) {
    throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.statusMessage,
    })
}

// revert 관련 공통 기능 사용
const { 
    isRevertModalVisible, 
    selectedVersionForRevert, 
    showRevertModal, 
    closeRevertModal, 
    confirmRevert 
} = useWikiRevert(id)

// 이 버전에서 페이지 보기
const navigateToVersion = (historyId: string) => {
    navigateTo(`/wiki/${id}/history/${historyId}`)
}

// 버전 차이 보기
const navigateToVersionDiff = (historyId: string) => {
    navigateTo(`/wiki/${id}/history/${historyId}/diff`)
}

// 현재 위키로 돌아가기
const navigateToWiki = () => {
    navigateTo(`/wiki/${id}`)
}

</script>

<template>
        <!-- 상단 헤더 -->
        <ContentHeader>
            <!-- 왼쪽: 브레드크럼 -->

            <NavigationTitle title="변경 기록" backButton :navigatePath="`/wiki/${id}`" />

            <!-- 오른쪽: 통계 정보 -->
            <div class="flex items-center gap-4 text-sm text-[var(--ui-text-muted)]">
                <div class="flex items-center gap-2">
                    <Icon icon="material-symbols:history" width="16" height="16" />
                    <span>총 {{ response?.data?.length || 0 }}개 버전</span>
                </div>
            </div>
        </ContentHeader>

        <!-- 메인 컨텐츠 -->
        <ContentBody>
            <!-- 히스토리 목록 카드 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <!-- 히스토리 목록 -->
                <div v-if="response?.data && response.data.length > 0" class="divide-y divide-[var(--ui-border)]">
                    <HistoryCard v-for="(history, index) in response.data" :key="history.id" :history="history"
                        :wiki-id="id" @view-version="navigateToVersion" @view-diff="navigateToVersionDiff"
                        @revert="showRevertModal" />
                </div>

                <!-- 로딩 상태 -->
                <div v-else-if="!response?.data" class="p-6">
                    <div class="space-y-4">
                        <div v-for="i in 5" :key="i" class="flex items-start gap-4 animate-pulse">
                            <div class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 bg-[var(--ui-bg-muted)] rounded w-3/4"></div>
                                <div class="h-4 bg-[var(--ui-bg-muted)] rounded w-1/2"></div>
                                <div class="flex gap-4">
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-20"></div>
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-16"></div>
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-24"></div>
                                </div>
                            </div>
                            <div class="flex gap-1">
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 빈 상태 -->
                <div v-else class="p-12 text-center">
                    <div
                        class="w-16 h-16 bg-[var(--ui-bg-muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="material-symbols:history" class="text-[var(--ui-text-muted)]" width="32"
                            height="32" />
                    </div>
                    <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">변경 기록이 없습니다</h3>
                    <p class="text-sm text-[var(--ui-text-muted)] max-w-md mx-auto">
                        아직 이 문서에 대한 변경 기록이 없습니다. 문서를 편집하면 변경 기록이 생성됩니다.
                    </p>
                </div>
            </div>
        </ContentBody>

        <!-- 되돌리기 확인 모달 -->
        <RevertModal :is-visible="isRevertModalVisible" :version-info="selectedVersionForRevert"
            @close="closeRevertModal" @confirm="confirmRevert" />
</template>

<style scoped>
/* 스크롤바 스타일링 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: var(--ui-bg-muted);
}

::-webkit-scrollbar-thumb {
    background: var(--ui-border-accented);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--ui-text-muted);
}

/* 포커스 상태 개선 */
button:focus-visible {
    outline: 2px solid var(--ui-primary);
    outline-offset: 2px;
}

/* 애니메이션 */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
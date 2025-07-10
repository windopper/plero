<script setup>
import { Icon } from '@iconify/vue';
import Contributors from '~/components/wiki/Contributors.vue';
import StarButton from '~/components/wiki/StarButton.vue';
import { MdPreview } from 'md-editor-v3'

const route = useRoute()
const id = route.params.id
const colorMode = useColorMode()
const { data: response } = await useFetch(`/api/wiki/${id}`)
const content = ref(response.value.data.content)
const title = ref(response.value.data.title)

// 포맷된 업데이트 시간
const latestUpdate = computed(() => {
    if (!response.value?.data?.updatedAt) return ''
    return new Date(response.value.data.updatedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})

// 기여자 정보 가져오기
const { data: contributors } = await useFetch(`/api/wiki/${id}/contributors`)

// 네비게이션 함수들
const navigateToEdit = () => {
    navigateTo(`/wiki/${id}/edit`)
}

const navigateToHistory = () => {
    navigateTo(`/wiki/${id}/history`)
}

const navigateToHome = () => {
    navigateTo('/')
}
</script>

<template>
    <div class="min-h-screen bg-[var(--ui-bg)]">
        <!-- 상단 헤더 -->
        <div class="sticky top-0 z-10 bg-[var(--ui-bg)] border-b-[1px] border-[var(--ui-border)]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4 flex-wrap gap-4">
                    <!-- 왼쪽: 네비게이션 -->
                    <div class="flex items-center gap-2 text-sm">
                        <button @click="navigateToHome"
                            class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group">
                            <Icon icon="material-symbols:home-outline" width="20" height="20"
                                class="group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium">홈</span>
                        </button>
                        <div class="ml-2 h-6 w-px bg-[var(--ui-border)]"></div>
                        <h1 class="ml-2 text-lg font-semibold text-[var(--ui-text)] truncate">{{ title }}</h1>
                    </div>

                    <!-- 오른쪽: 액션 버튼들 -->
                    <div class="flex items-center gap-3">
                        <StarButton />
                        <button @click="navigateToHistory"
                            class="flex items-center gap-2 px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200">
                            <Icon icon="material-symbols:history" width="16" height="16" />
                            <span class="text-sm font-medium">변경 기록</span>
                        </button>
                        <button @click="navigateToEdit"
                            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg">
                            <Icon icon="material-symbols:edit" width="16" height="16" />
                            <span class="text-sm font-medium">편집</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- 메인 컨텐츠 영역 -->
                <div class="lg:col-span-3">
                    <div
                        class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                        <div class="p-6 sm:p-8">
                            <!-- 위키 제목 -->
                            <div class="mb-6 pb-4 border-b border-[var(--ui-border)]">
                                <h1 class="text-3xl font-bold text-[var(--ui-text-highlighted)] mb-2">{{ title }}</h1>
                                <div class="flex items-center gap-4 text-sm text-[var(--ui-text-muted)]">
                                    <div class="flex items-center gap-2">
                                        <Icon icon="material-symbols:schedule-outline" width="16" height="16" />
                                        <span>최근 업데이트: {{ latestUpdate }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 마크다운 컨텐츠 -->
                            <MdPreview :modelValue="content"
                                class="break-words max-w-none prose md:prose-base prose-sm prose-zinc dark:prose-invert" />
                        </div>
                    </div>
                </div>

                <!-- 사이드바 영역 -->
                <div class="lg:col-span-1">
                    <div class="space-y-6">
                        <!-- 빠른 액션 카드 -->
                        <div
                            class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-4">빠른 액션</h3>

                            <div class="space-y-3">
                                <!-- 편집 버튼 -->
                                <button @click="navigateToEdit"
                                    class="w-full flex items-center gap-3 p-3 text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)] rounded-lg transition-all duration-200 group">
                                    <div
                                        class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                        <Icon icon="material-symbols:edit" width="16" height="16"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                    <div class="flex-1 text-left">
                                        <div class="text-sm font-medium">편집하기</div>
                                        <div class="text-xs text-[var(--ui-text-muted)]">이 문서를 수정합니다</div>
                                    </div>
                                    <Icon icon="material-symbols:chevron-right" width="16" height="16"
                                        class="text-[var(--ui-text-muted)] group-hover:translate-x-1 transition-transform duration-200" />
                                </button>

                                <!-- 변경 기록 버튼 -->
                                <button @click="navigateToHistory"
                                    class="w-full flex items-center gap-3 p-3 text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)] rounded-lg transition-all duration-200 group">
                                    <div
                                        class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                        <Icon icon="material-symbols:history" width="16" height="16"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                    <div class="flex-1 text-left">
                                        <div class="text-sm font-medium">변경 기록</div>
                                        <div class="text-xs text-[var(--ui-text-muted)]">수정 이력을 확인합니다</div>
                                    </div>
                                    <Icon icon="material-symbols:chevron-right" width="16" height="16"
                                        class="text-[var(--ui-text-muted)] group-hover:translate-x-1 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        <!-- 기여자 카드 -->
                        <div v-if="contributors?.data && contributors.data.length > 0"
                            class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-4">기여자</h3>
                            <Contributors :contributors="contributors.data" />
                        </div>

                        <!-- 문서 정보 카드 -->
                        <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-4">문서 정보</h3>

                            <div class="space-y-3 text-sm">
                                <!-- 생성일 -->
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                        <Icon icon="material-symbols:calendar-add-on" width="16" height="16"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">
                                            생성일</div>
                                        <div class="font-medium text-[var(--ui-text)]">
                                            {{ new Date(response?.data?.createdAt).toLocaleDateString('ko-KR') }}
                                        </div>
                                    </div>
                                </div>

                                <!-- 최근 수정일 -->
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                        <Icon icon="material-symbols:schedule-outline" width="16" height="16"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">
                                            최근 수정</div>
                                        <div class="font-medium text-[var(--ui-text)]">{{ latestUpdate }}</div>
                                    </div>
                                </div>

                                <!-- 문서 ID -->
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                        <Icon icon="material-symbols:fingerprint" width="16" height="16"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">
                                            문서 ID</div>
                                        <div class="font-mono text-sm text-[var(--ui-text)]">{{ id }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
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
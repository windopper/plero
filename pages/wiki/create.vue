<script setup>
import Editor from '~/components/wiki/Editor.vue'
import ContentHeader from '~/components/common/ContentHeader.vue'
import ContentBody from '~/components/common/ContentBody.vue'
import { Icon } from '@iconify/vue'

const text = ref('')
const title = ref('')
const tags = ref([])
const createLoading = ref(false)

const createWiki = async () => {
    if (!title.value.trim()) {
        alert('제목을 입력해주세요.')
        return
    }

    createLoading.value = true
    try {
        const response = await $fetch("/api/wiki", {
            method: "POST",
            body: {
                title: title.value,
                content: text.value,
                tags: tags.value
            }
        })
        navigateTo(`/wiki/${response.data.wiki.id}`)
    } catch (error) {
        console.error('위키 생성 중 오류가 발생했습니다:', error)
        alert('위키 생성 중 오류가 발생했습니다.')
    } finally {
        createLoading.value = false
    }
}

// 저장 단축키 (Ctrl+S)
const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        createWiki()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
    <!-- 상단 헤더 -->
    <ContentHeader>
        <!-- 왼쪽: 뒤로가기 -->
        <div class="flex items-center">
            <button @click="navigateTo('/')"
                class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group">
                <Icon icon="material-symbols:arrow-back" width="20" height="20"
                    class="group-hover:scale-110 transition-transform duration-200" />
                <span class="font-medium">뒤로가기</span>
            </button>
            <div class="ml-4 h-6 w-px bg-[var(--ui-border)]"></div>
            <h1 class="ml-4 text-lg font-semibold text-[var(--ui-text)]">새 위키 만들기</h1>
        </div>

        <!-- 오른쪽: 생성 버튼 -->
        <div class="flex items-center">
            <button @click="createWiki" :disabled="createLoading"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon v-if="!createLoading" icon="material-symbols:add" width="18" height="18" />
                <Icon v-else icon="line-md:loading-loop" width="18" height="18" />
                <span class="text-sm font-medium">{{ createLoading ? '생성 중...' : '위키 생성' }}</span>
                <span class="text-xs opacity-75 hidden sm:inline">(Ctrl+S)</span>
            </button>
        </div>
    </ContentHeader>

    <!-- 메인 컨텐츠 -->
    <ContentBody>
        <!-- 편집기 영역 -->
        <div class="mb-6">
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <Editor v-model:content-value="text" v-model:title-value="title" v-model:tags="tags"
                        class="w-full" />
                </div>
            </div>
        </div>

        <!-- 하단 정보 영역 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 위키 생성 안내 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">위키 생성 안내</h3>
                <div class="space-y-3 text-sm text-[var(--ui-text-muted)]">
                    <div class="flex items-start gap-3">
                        <Icon icon="material-symbols:lightbulb-outline" width="16" height="16"
                            class="mt-0.5 text-[var(--ui-primary)] flex-shrink-0" />
                        <div>
                            <p class="font-medium text-[var(--ui-text)]">명확한 제목 작성</p>
                            <p>다른 사용자들이 쉽게 찾을 수 있도록 구체적이고 명확한 제목을 작성해주세요.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Icon icon="material-symbols:edit-document" width="16" height="16"
                            class="mt-0.5 text-[var(--ui-primary)] flex-shrink-0" />
                        <div>
                            <p class="font-medium text-[var(--ui-text)]">마크다운 활용</p>
                            <p>제목, 목록, 링크 등 마크다운 문법을 활용하여 구조화된 문서를 작성해보세요.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <Icon icon="material-symbols:group" width="16" height="16"
                            class="mt-0.5 text-[var(--ui-primary)] flex-shrink-0" />
                        <div>
                            <p class="font-medium text-[var(--ui-text)]">협업을 고려한 작성</p>
                            <p>다른 사용자들이 쉽게 이해하고 편집할 수 있도록 명확하게 작성해주세요.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 편집 가이드 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">편집 가이드</h3>

                <!-- 단축키 -->
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-[var(--ui-text)] mb-2">단축키</h4>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-[var(--ui-text-muted)]">위키 생성</span>
                            <div class="flex items-center gap-1">
                                <kbd
                                    class="px-2 py-1 text-xs bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] rounded">Ctrl</kbd>
                                <span class="text-xs text-[var(--ui-text-muted)]">+</span>
                                <kbd
                                    class="px-2 py-1 text-xs bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] rounded">S</kbd>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 마크다운 팁 -->
                <div>
                    <h4 class="text-sm font-medium text-[var(--ui-text)] mb-2">마크다운 팁</h4>
                    <div class="grid grid-cols-1 gap-2 text-xs">
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:title" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded"># 제목</code>
                            <span class="text-[var(--ui-text-muted)]">대제목</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:format-list-bulleted" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">- 항목</code>
                            <span class="text-[var(--ui-text-muted)]">목록</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:format-bold" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">**굵게**</code>
                            <span class="text-[var(--ui-text-muted)]">굵은 텍스트</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:link" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">[링크](URL)</code>
                            <span class="text-[var(--ui-text-muted)]">하이퍼링크</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ContentBody>
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
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
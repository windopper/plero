<script setup>
import { Icon } from '@iconify/vue'
import Editor from '~/components/wiki/Editor.vue'
import ContentHeader from '~/components/common/ContentHeader.vue'
import ContentBody from '~/components/common/ContentBody.vue'
import NavigationTitle from '~/components/common/NavigationTitle.vue';

const route = useRoute()
const id = route.params.id

const { data: wiki } = await useFetch(`/api/wiki/${id}`)

const title = ref(wiki.value.data.title || "")
const content = ref(wiki.value.data.content || "")
const tags = ref(wiki.value.data.tags || [])
const updateMessage = ref("")

const saveLoading = ref(false)
const showDeleteConfirm = ref(false)

const save = async () => {
    if (!title.value.trim()) {
        alert('제목을 입력해주세요.')
        return
    }

    if (!updateMessage.value.trim()) {
        alert('수정 메시지를 입력해주세요.')
        return
    }
    
    saveLoading.value = true
    try {
        const res = await $fetch(`/api/wiki/${id}`, {
            method: "PATCH",
            body: { content: content.value, title: title.value, updateMessage: updateMessage.value, tags: tags.value }
        })
        navigateTo(`/wiki/${id}`)
    } catch (error) {
        console.error('저장 중 오류가 발생했습니다:', error)
        alert('저장 중 오류가 발생했습니다.')
    } finally {
        saveLoading.value = false
    }
}

const handleDelete = () => {
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    const res = await $fetch(`/api/wiki/${id}`, {
        method: "DELETE"
    })
    if (res.success) {
        navigateTo(`/wiki/${id}`)
    } else {
        alert('삭제 중 오류가 발생했습니다.')
    }
    showDeleteConfirm.value = false
}

const cancelDelete = () => {
    showDeleteConfirm.value = false
}

// 저장 단축키 (Ctrl+S)
const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        save()
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
        <NavigationTitle title="위키 편집" backButton :navigatePath="`/wiki/${id}`" />

        <!-- 오른쪽: 액션 버튼들 -->
        <div class="flex items-center gap-3">
            <!-- 삭제 버튼 -->
            <button @click="handleDelete"
                class="action-button text-[var(--ui-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Icon icon="material-symbols:delete-outline" width="18" height="18" />
                <span class="text-sm font-medium">삭제</span>
            </button>

            <!-- 저장 버튼 -->
            <button @click="save" :disabled="saveLoading"
                class="action-button bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)]">
                <Icon v-if="!saveLoading" icon="material-symbols:save" width="18" height="18" />
                <Icon v-else icon="line-md:loading-loop" width="18" height="18" />
                <span class="text-sm font-medium">{{ saveLoading ? '저장 중...' : '저장' }}</span>
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
                    <Editor v-model:content-value="content" v-model:title-value="title" v-model:tags="tags"
                        class="w-full" />
                </div>
            </div>
        </div>

        <!-- 하단 편집 정보 영역 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 수정 메시지 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">수정 메시지</h3>
                <textarea v-model="updateMessage" placeholder="이번 수정 사항에 대해 간단히 설명해주세요..." rows="4"
                    class="w-full text-sm text-[var(--ui-text)] bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/20 focus:border-[var(--ui-primary)] transition-all duration-200 resize-none" />
                <p class="text-xs text-[var(--ui-text-muted)] mt-2">
                    수정 내용을 간단히 요약해주시면 다른 사용자들이 변경사항을 이해하는데 도움이 됩니다.
                </p>
            </div>

            <!-- 편집 가이드 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">편집 가이드</h3>

                <!-- 단축키 -->
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-[var(--ui-text)] mb-2">단축키</h4>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-[var(--ui-text-muted)]">빠른 저장</span>
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
                            <Icon icon="material-symbols:format-bold" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">**굵게**</code>
                            <span class="text-[var(--ui-text-muted)]">굵은 텍스트</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:format-italic" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">*기울임*</code>
                            <span class="text-[var(--ui-text-muted)]">기울임 텍스트</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:link" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">[링크](URL)</code>
                            <span class="text-[var(--ui-text-muted)]">하이퍼링크</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:code" width="14" height="14"
                                class="text-[var(--ui-text-muted)]" />
                            <code class="bg-[var(--ui-bg-muted)] px-1 rounded">`코드`</code>
                            <span class="text-[var(--ui-text-muted)]">인라인 코드</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ContentBody>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="cancelDelete">
        <div class="bg-[var(--ui-bg)] rounded-xl shadow-xl p-6 max-w-md w-full">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <Icon icon="material-symbols:warning" width="20" height="20" class="text-red-500" />
                </div>
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">위키 삭제</h3>
            </div>

            <p class="text-[var(--ui-text-muted)] mb-6">
                정말로 이 위키를 삭제하시겠습니까?
                <strong class="text-[var(--ui-text)]">이 작업은 되돌릴 수 없습니다.</strong>
            </p>

            <div class="flex gap-3 justify-end">
                <button @click="cancelDelete"
                    class="px-4 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200">
                    취소
                </button>
                <button @click="confirmDelete"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200">
                    삭제
                </button>
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
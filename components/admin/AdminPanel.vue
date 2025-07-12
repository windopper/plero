<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
    visible?: boolean
}

interface Emits {
    (e: 'toggle'): void
}

const props = withDefaults(defineProps<Props>(), {
    visible: false
})

const emit = defineEmits<Emits>()

// 위키 삭제 관련 상태
const wikiIdToDelete = ref('')
const isDeleting = ref(false)
const deleteError = ref('')

// 위키 삭제 함수
const deletePermanentWiki = async (id: string) => {
    if (!id.trim()) {
        deleteError.value = '위키 ID를 입력해주세요.'
        return
    }
    
    if (!confirm(`정말로 위키 ID "${id}"를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        return
    }
    
    try {
        isDeleting.value = true
        deleteError.value = ''
        
        const result = await $fetch(`/admin/wiki/${id}`, {
            method: 'DELETE'
        })
        
        console.log('삭제 완료:', result)
        alert('위키가 성공적으로 삭제되었습니다.')
        wikiIdToDelete.value = ''
        
    } catch (error: any) {
        console.error('삭제 실패:', error.data.statusMessage)
        deleteError.value = error.data.statusMessage || '삭제 중 오류가 발생했습니다.'
    } finally {
        isDeleting.value = false
    }
}

const testWiki = ref(false);
const testWikiLoading = ref(false);

// 테스트 위키 생성
const createTestWiki = async () => {
    testWikiLoading.value = true;
    const result = await $fetch(`/admin/wiki/test`, {
        method: 'POST',
    })
    console.log('테스트 위키 생성:', result)
    testWiki.value = true;
    testWikiLoading.value = false;
}

// 테스트 위키 삭제
const deleteTestWiki = async () => {
    testWikiLoading.value = true;
    const result = await $fetch(`/admin/wiki/test`, {
        method: 'DELETE',
    })
    console.log('테스트 위키 삭제:', result)
    testWiki.value = false;
    testWikiLoading.value = false;
}

// 패널 토글
const togglePanel = () => {
    emit('toggle')
}

// ESC 키로 패널 닫기
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.visible) {
        emit('toggle')
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
    <div v-if="visible" class="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/20 backdrop-blur-sm"
        @click.self="togglePanel">
        <div
            class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-in">
            <!-- 헤더 -->
            <div
                class="flex items-center justify-between p-4 border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] rounded-t-lg">
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:shield-crown" class="text-xl text-red-500" />
                    <h2 class="text-lg font-semibold">관리자 패널</h2>
                </div>
                <button @click="togglePanel"
                    class="p-2 rounded-lg hover:bg-[var(--ui-bg-accented)] transition-colors text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                    aria-label="패널 닫기">
                    <Icon icon="mdi:close" class="text-lg" />
                </button>
            </div>

            <!-- 위키 삭제 섹션 -->
            <div class="p-4 space-y-4">
                <h3
                    class="flex items-center gap-2 text-base font-medium text-[var(--ui-text)] pb-2 border-b border-[var(--ui-border-muted)]">
                    <Icon icon="mdi:delete-forever" class="text-red-500" />
                    위키 영구 삭제
                </h3>

                <div class="space-y-2">
                    <label for="wikiId" class="block text-sm font-medium text-[var(--ui-text-toned)]">위키 ID</label>
                    <input id="wikiId" v-model="wikiIdToDelete" type="text" placeholder="삭제할 위키 ID를 입력하세요"
                        class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="isDeleting" />
                </div>

                <div v-if="deleteError" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {{ deleteError }}
                </div>

                <button @click="deletePermanentWiki(wikiIdToDelete)" :disabled="isDeleting || !wikiIdToDelete.trim()"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500">
                    <Icon :icon="isDeleting ? 'mdi:loading' : 'mdi:delete-forever'"
                        :class="{ 'animate-spin': isDeleting }" />
                    {{ isDeleting ? '삭제 중...' : '영구 삭제' }}
                </button>
            </div>

            <!-- 위키 테스트 섹션 -->
            <div class="p-4 space-y-4">
                <h3
                    class="flex items-center gap-2 text-base font-medium text-[var(--ui-text)] pb-2 border-b border-[var(--ui-border-muted)]">
                    <Icon icon="mdi:test-tube" class="text-blue-500" />
                    위키 테스트 섹션
                </h3>

                <button @click="createTestWiki" :disabled="testWikiLoading"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500">
                    <Icon icon="mdi:test-tube" class="text-blue-500" />
                    테스트 위키 생성
                </button>
                <button @click="deleteTestWiki" :disabled="testWikiLoading"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500">
                    <Icon icon="mdi:test-tube" class="text-red-500" />
                    테스트 위키 삭제
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 애니메이션 */
@keyframes slideInFromRight {
    from {
        transform: translateX(1.25rem);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-in {
    animation: slideInFromRight 0.3s ease-out;
}
</style>
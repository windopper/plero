<script setup lang="ts">
import { Icon } from '@iconify/vue';

const props = defineProps<{
    isPublished: boolean;
    wikiId: string;
    wikiTitle: string;
}>();

const openModal = ref(false);
const modalType = ref<'publish' | 'unpublish'>('publish'); // 모달 타입 구분
const openButtonRef = useTemplateRef('openButton');
const modalTemplateRef = useTemplateRef('modalTemplate');
const isChecking = ref(false);
const titleExists = ref(false);
const isPublishing = ref(false);
const isUnpublishing = ref(false); // 비공개 처리 상태

const handleModalClickOutside = (e: MouseEvent) => {
    if (openButtonRef.value && openButtonRef.value.contains(e.target as Node)) {
        return;
    }

    if (modalTemplateRef.value && modalTemplateRef.value.contains(e.target as Node)) {
        return;
    }

    openModal.value = false;
}

onMounted(() => {
    document.addEventListener('click', handleModalClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleModalClickOutside);
});

const emit = defineEmits<{
    (e: 'update:isPublished', value: boolean): void;
}>();

// 제목 중복 검사
const checkTitleExists = async () => {
    if (!props.wikiTitle) return;
    
    isChecking.value = true;
    try {
        const response = await $fetch<{
            success: boolean;
            data: {
                exists: boolean;
            };
        }>('/api/wiki/check-title', {
            method: 'POST',
            body: {
                title: props.wikiTitle,
                excludeId: props.wikiId
            }
        });
        titleExists.value = response.data.exists;
    } catch (error) {
        console.error('제목 중복 검사 중 오류:', error);
    } finally {
        isChecking.value = false;
    }
};

// 공개 모달 열기
const handleOpenPublishModal = async () => {
    modalType.value = 'publish';
    openModal.value = true;
    await checkTitleExists();
};

// 비공개 모달 열기
const handleOpenUnpublishModal = () => {
    modalType.value = 'unpublish';
    openModal.value = true;
};

// 공개 처리
const handlePublish = async () => {
    if (titleExists.value) {
        return; // 제목이 중복되면 공개 불가
    }
    
    isPublishing.value = true;
    try {
        await $fetch(`/api/wiki/${props.wikiId}/publish`, {
            method: 'PATCH',
            body: {
                isPublished: true
            }
        });
        emit('update:isPublished', true);
        openModal.value = false;
    } catch (error) {
        console.error('위키 공개 중 오류:', error);
        // 에러 처리 - 사용자에게 알림
    } finally {
        isPublishing.value = false;
    }
};

// 비공개 처리
const handleUnpublish = async () => {
    isUnpublishing.value = true;
    try {
        await $fetch(`/api/wiki/${props.wikiId}/publish`, {
            method: 'PATCH',
            body: {
                isPublished: false
            }
        });
        emit('update:isPublished', false);
        openModal.value = false;
    } catch (error) {
        console.error('위키 비공개 중 오류:', error);
        // 에러 처리 - 사용자에게 알림
    } finally {
        isUnpublishing.value = false;
    }
};
</script>

<template>
    <div class="relative">
        <button v-if="!isPublished" ref="openButton" @click="handleOpenPublishModal"
            class="action-button bg-gradient-to-r from-[var(--ui-secondary)] to-[var(--ui-secondary-muted)] text-white hover:from-[var(--ui-secondary-muted)] hover:to-[var(--ui-secondary-elevated)]">
            <Icon icon="material-symbols:lock" width="16" height="16" />
            <span class="text-sm font-medium">위키 공개하기</span>
        </button>
        <button v-else ref="openButton" @click="handleOpenUnpublishModal"
            class="action-button bg-gradient-to-r from-[var(--ui-secondary)] to-[var(--ui-secondary-muted)] text-white hover:from-[var(--ui-secondary-muted)] hover:to-[var(--ui-secondary-elevated)]">
            <Icon icon="material-symbols:lock-open" width="16" height="16" />
            <span class="text-sm font-medium">위키 비공개하기</span>
        </button>
        
        <!-- 공개/비공개 확인 모달 -->
        <div v-if="openModal" ref="modalTemplate" class="absolute bottom-0 translate-y-[calc(100%+1rem)] right-0 w-80 z-50">
            <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg shadow-lg p-4">
                <!-- 공개 모달 -->
                <div v-if="modalType === 'publish'">
                    <div class="flex items-center gap-2 mb-3">
                        <Icon icon="material-symbols:public" width="20" height="20" class="text-[var(--ui-secondary)]" />
                        <h3 class="text-base font-semibold text-[var(--ui-text)]">위키 공개하기</h3>
                    </div>
                    
                    <div class="space-y-3 mb-4">
                        <p class="text-sm text-[var(--ui-text-muted)] leading-relaxed">
                            위키를 공개하면 다른 사용자들이 검색하고 볼 수 있습니다.
                        </p>
                        
                        <!-- 제목 중복 검사 상태 -->
                        <div v-if="isChecking" class="flex items-center gap-2 p-3 bg-[var(--ui-bg-muted)] rounded-lg">
                            <Icon icon="material-symbols:sync" width="16" height="16" class="animate-spin text-[var(--ui-primary)]" />
                            <span class="text-sm text-[var(--ui-text-muted)]">제목 중복 검사 중...</span>
                        </div>
                        
                        <!-- 제목 중복 경고 -->
                        <div v-else-if="titleExists" class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <Icon icon="material-symbols:warning" width="16" height="16" class="text-red-500 mt-0.5" />
                            <div>
                                <p class="text-sm text-red-700 dark:text-red-400 font-medium">제목 중복</p>
                                <p class="text-xs text-red-600 dark:text-red-400 mt-1">
                                    동일한 제목의 공개 위키가 이미 존재합니다. 공개하려면 제목을 변경해주세요.
                                </p>
                            </div>
                        </div>
                        
                        <!-- 제목 사용 가능 -->
                        <div v-else class="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <Icon icon="material-symbols:check-circle" width="16" height="16" class="text-green-500 mt-0.5" />
                            <div>
                                <p class="text-sm text-green-700 dark:text-green-400 font-medium">제목 사용 가능</p>
                                <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                                    현재 제목으로 위키를 공개할 수 있습니다.
                                </p>
                            </div>
                        </div>
                        
                        <div class="text-xs text-[var(--ui-text-dimmed)] bg-[var(--ui-bg-muted)] p-2 rounded">
                            <Icon icon="material-symbols:info" width="14" height="14" class="inline mr-1" />
                            공개된 위키들 중에서 제목은 유일해야 합니다.
                        </div>
                    </div>
                    
                    <!-- 공개 버튼 영역 -->
                    <div class="flex items-center justify-end gap-2">
                        <button @click="openModal = false"
                            class="px-3 py-1.5 text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors">
                            취소
                        </button>
                        <button @click="handlePublish"
                            :disabled="titleExists || isChecking || isPublishing"
                            class="px-4 py-1.5 text-sm bg-[var(--ui-secondary)] text-white rounded-lg hover:bg-[var(--ui-secondary-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                            <Icon v-if="isPublishing" icon="material-symbols:sync" width="14" height="14" class="animate-spin" />
                            <span>{{ isPublishing ? '공개 중...' : '공개하기' }}</span>
                        </button>
                    </div>
                </div>
                
                <!-- 비공개 모달 -->
                <div v-else-if="modalType === 'unpublish'">
                    <div class="flex items-center gap-2 mb-3">
                        <Icon icon="material-symbols:lock" width="20" height="20" class="text-[var(--ui-warning)]" />
                        <h3 class="text-base font-semibold text-[var(--ui-text)]">위키 비공개하기</h3>
                    </div>
                    
                    <div class="space-y-3 mb-4">
                        <p class="text-sm text-[var(--ui-text-muted)] leading-relaxed">
                            위키를 비공개로 전환하면 다른 사용자들이 검색하거나 볼 수 없게 됩니다.
                        </p>
                        
                        <div class="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <Icon icon="material-symbols:warning" width="16" height="16" class="text-yellow-500 mt-0.5" />
                            <div>
                                <p class="text-sm text-yellow-700 dark:text-yellow-400 font-medium">비공개 전환</p>
                                <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                    비공개로 전환하면 오직 작성자만 위키에 접근할 수 있습니다.
                                </p>
                            </div>
                        </div>
                        
                        <div class="text-xs text-[var(--ui-text-dimmed)] bg-[var(--ui-bg-muted)] p-2 rounded">
                            <Icon icon="material-symbols:info" width="14" height="14" class="inline mr-1" />
                            언제든지 다시 공개로 전환할 수 있습니다.
                        </div>
                    </div>
                    
                    <!-- 비공개 버튼 영역 -->
                    <div class="flex items-center justify-end gap-2">
                        <button @click="openModal = false"
                            class="px-3 py-1.5 text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors">
                            취소
                        </button>
                        <button @click="handleUnpublish"
                            :disabled="isUnpublishing"
                            class="px-4 py-1.5 text-sm bg-[var(--ui-warning)] text-white rounded-lg hover:bg-[var(--ui-warning-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                            <Icon v-if="isUnpublishing" icon="material-symbols:sync" width="14" height="14" class="animate-spin" />
                            <span>{{ isUnpublishing ? '비공개 중...' : '비공개하기' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
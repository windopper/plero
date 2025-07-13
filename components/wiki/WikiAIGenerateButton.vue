<script setup lang="ts">
import { Icon } from '@iconify/vue';

const openModal = ref(false);
const instruction = ref('');
const isGenerating = ref(false);

const generateWiki = async () => {
    if (!instruction.value.trim()) return;
    
    isGenerating.value = true;
    try {
        // TODO: AI 위키 생성 API 호출
        console.log('Generating wiki with instruction:', instruction.value);
        
        // 임시로 2초 후 완료
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 생성 완료 후 모달 닫기
        openModal.value = false;
        instruction.value = '';
    } catch (error) {
        console.error('Failed to generate wiki:', error);
    } finally {
        isGenerating.value = false;
    }
};

const closeModal = () => {
    if (isGenerating.value) return; // 생성 중일 때는 닫기 방지
    openModal.value = false;
    instruction.value = '';
};
</script>

<template>
    <button
        class="action-button bg-[var(--ui-secondary)] hover:bg-[var(--ui-secondary-elevated)] font-bold px-4 py-2 flex items-center gap-2"
        @click="openModal = true">
        <Icon icon="jam:magic" width="18" height="18" class="text-white" />
        <span class="text-sm font-medium text-white">위키 생성</span>
    </button>
    
    <Teleport to="body">
        <div v-if="openModal" class="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4">
            <div class="bg-[var(--ui-bg)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <!-- 헤더 -->
                <div class="flex items-center justify-between p-6 border-b border-[var(--ui-border)]">
                    <div class="flex items-center gap-3">
                        <Icon icon="jam:magic" width="24" height="24" class="text-[var(--ui-secondary)]" />
                        <h2 class="text-2xl font-bold text-[var(--ui-text)]">AI 위키 생성</h2>
                    </div>
                    <button 
                        @click="closeModal"
                        :disabled="isGenerating"
                        class="p-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Icon icon="material-symbols:close" width="20" height="20" class="text-[var(--ui-text-secondary)]" />
                    </button>
                </div>

                <!-- 콘텐츠 -->
                <div class="p-6 space-y-6">
                    <!-- 안내문 -->
                    <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-4 border-l-4 border-[var(--ui-secondary)]">
                        <h3 class="font-semibold text-[var(--ui-text)] mb-2 flex items-center gap-2">
                            <Icon icon="material-symbols:info" width="18" height="18" class="text-[var(--ui-secondary)]" />
                            AI 위키 생성 안내
                        </h3>
                        <p class="text-sm text-[var(--ui-text-secondary)] leading-relaxed">
                            AI가 당신의 지시사항을 바탕으로 위키 페이지를 자동으로 생성합니다. 
                            명확하고 구체적인 지시사항을 작성할수록 더 정확한 위키가 생성됩니다.
                        </p>
                    </div>

                    <!-- 예시 -->
                    <div class="space-y-3">
                        <h4 class="font-medium text-[var(--ui-text)] flex items-center gap-2">
                            <Icon icon="material-symbols:lightbulb" width="18" height="18" class="text-[var(--ui-accent)]" />
                            예시
                        </h4>
                        <div class="grid gap-2">
                            <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-3 text-sm">
                                <span class="text-[var(--ui-text-secondary)]">• "Vue.js의 Composition API에 대한 상세한 가이드를 작성해주세요"</span>
                            </div>
                            <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-3 text-sm">
                                <span class="text-[var(--ui-text-secondary)]">• "TypeScript 기초부터 고급 기능까지 단계별로 설명하는 문서"</span>
                            </div>
                            <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-3 text-sm">
                                <span class="text-[var(--ui-text-secondary)]">• "React Hook 사용법과 커스텀 Hook 만들기 튜토리얼"</span>
                            </div>
                        </div>
                    </div>

                    <!-- Instruction 입력 -->
                    <div class="space-y-3">
                        <label for="instruction" class="block font-medium text-[var(--ui-text)]">
                            생성할 위키에 대한 지시사항
                            <span class="text-[var(--ui-danger)] ml-1">*</span>
                        </label>
                        <textarea 
                            id="instruction" 
                            v-model="instruction"
                            placeholder="어떤 위키를 생성하고 싶은지 자세히 설명해주세요..."
                            rows="6"
                            :disabled="isGenerating"
                            class="w-full p-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] 
                                   text-[var(--ui-text)] placeholder-[var(--ui-text-secondary)]
                                   focus:outline-none focus:ring-2 focus:ring-[var(--ui-secondary)] focus:border-transparent
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   resize-none transition-all" />
                        <div class="text-xs text-[var(--ui-text-secondary)] text-right">
                            {{ instruction.length }}/1000자
                        </div>
                    </div>
                </div>

                <!-- 푸터 -->
                <div class="flex items-center justify-between p-6 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] rounded-b-xl">
                    <div class="text-xs text-[var(--ui-text-secondary)]">
                        생성된 위키는 검토 후 수정할 수 있습니다.
                    </div>
                    <div class="flex items-center gap-3">
                        <button 
                            @click="closeModal"
                            :disabled="isGenerating"
                            class="px-4 py-2 text-sm font-medium text-[var(--ui-text-secondary)] 
                                   hover:text-[var(--ui-text)] transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                            취소
                        </button>
                        <button 
                            @click="generateWiki"
                            :disabled="!instruction.trim() || isGenerating"
                            class="px-6 py-2 bg-[var(--ui-secondary)] hover:bg-[var(--ui-secondary-elevated)] 
                                   text-white font-medium rounded-lg transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   flex items-center gap-2">
                            <Icon 
                                v-if="isGenerating" 
                                icon="material-symbols:autorenew" 
                                width="16" height="16" 
                                class="animate-spin" />
                            <Icon 
                                v-else 
                                icon="jam:magic" 
                                width="16" height="16" />
                            {{ isGenerating ? '생성 중...' : '위키 생성' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
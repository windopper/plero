<script setup lang="ts">
import { Icon } from '@iconify/vue'
import ContentHeader from '~/components/common/ContentHeader.vue'
import ContentBody from '~/components/common/ContentBody.vue'
import NavigationTitle from '~/components/common/NavigationTitle.vue'
// 에이전트 설정 상태
const instruction = ref('')
const reasoningEffort = ref(2) // 1-3 범위
const allowMultiLayerDocs = ref(false)
const isLoading = ref(false)

const runAgent = () => {
    if (!instruction.value.trim()) {
        alert('지시사항을 입력해주세요.')
        return
    }

    isLoading.value = true
}
</script>

<template>
    <div class="min-h-screen bg-[var(--ui-bg)]">
        <!-- 상단 헤더 -->
        <ContentHeader>
            <NavigationTitle title="위키 에이전트 설정" backButton />
            
            <!-- 실행 버튼 -->
            <button 
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                @click="runAgent"
            >
                <Icon 
                    icon="material-symbols:play-arrow" 
                    width="16" 
                    height="16" 
                />
                <span class="text-sm font-medium">
                    실행
                </span>
            </button>
        </ContentHeader>

        <!-- 메인 컨텐츠 -->
        <ContentBody>
            <div v-if="isLoading" class="text-center py-12">
                <Icon icon="line-md:loading-loop" width="32" height="32" class="mx-auto text-[var(--ui-text-muted)] mb-4" />
                <p class="text-[var(--ui-text-muted)]">설정을 불러오는 중...</p>
            </div>

            <div v-else class="max-w-4xl mx-auto space-y-8">
                <!-- 페이지 설명 -->
                <div class="bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] rounded-xl p-6">
                    <div class="flex items-start gap-4">
                        <Icon icon="material-symbols:smart-toy-outline" width="24" height="24" class="text-[var(--ui-primary)] mt-1" />
                        <div>
                            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-2">위키 에이전트란?</h2>
                            <p class="text-[var(--ui-text)] leading-relaxed">
                                위키 에이전트는 AI를 활용하여 자동으로 위키 문서를 생성하고 관리하는 시스템입니다. 
                                아래 설정을 통해 에이전트의 동작 방식을 커스터마이징할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 설정 폼 -->
                <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm">
                    <div class="p-6 space-y-8">
                        <!-- 지시사항 섹션 -->
                        <div>
                            <label class="block text-sm font-medium text-[var(--ui-text-highlighted)] mb-3">
                                <Icon icon="material-symbols:description-outline" width="18" height="18" class="inline mr-2" />
                                에이전트 지시사항
                            </label>
                            <textarea 
                                v-model="instruction"
                                placeholder="위키 에이전트가 따라야 할 지시사항을 입력하세요. 예: '기술 문서는 항상 예제 코드를 포함하고, 초보자도 이해할 수 있도록 자세히 설명해주세요.'"
                                rows="6"
                                class="w-full px-4 py-3 border border-[var(--ui-border)] rounded-lg text-[var(--ui-text)] bg-[var(--ui-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent resize-vertical min-h-[120px]"
                            />
                            <p class="text-xs text-[var(--ui-text-muted)] mt-2">
                                에이전트가 위키를 생성할 때 참고할 기본 지침을 설정합니다. 문서 스타일, 톤 앤 매너, 포함할 내용 등을 지정할 수 있습니다.
                            </p>
                        </div>

                        <!-- Reasoning Effort 섹션 -->
                        <div>
                            <label class="block text-sm font-medium text-[var(--ui-text-highlighted)] mb-3">
                                <Icon icon="material-symbols:psychology-outline" width="18" height="18" class="inline mr-2" />
                                추론 강도 (Reasoning Effort)
                            </label>
                            <div class="space-y-4">
                                <!-- 슬라이더 -->
                                <div class="relative">
                                    <input 
                                        v-model="reasoningEffort"
                                        type="range" 
                                        min="1" 
                                        max="3" 
                                        step="1"
                                        class="w-full h-2 bg-[var(--ui-bg-elevated)] rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <!-- 슬라이더 값 표시 -->
                                    <div class="flex justify-between text-xs text-[var(--ui-text-muted)] mt-2">
                                        <span>1 (빠름)</span>
                                        <span>2 (균형)</span>
                                        <span>3 (정확함)</span>
                                    </div>
                                </div>
                                
                                <!-- 현재 값 표시 -->
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center justify-center w-12 h-8 bg-[var(--ui-primary)] text-white rounded-lg text-sm font-medium">
                                        {{ reasoningEffort }}
                                    </div>
                                    <span class="text-sm text-[var(--ui-text)]">
                                        {{ reasoningEffort <= 1 ? '빠른 응답' : reasoningEffort <= 2 ? '균형잡힌 품질' : '높은 품질' }}
                                    </span>
                                </div>
                            </div>
                            <p class="text-xs text-[var(--ui-text-muted)] mt-2">
                                높은 값일수록 더 정확하고 자세한 위키를 생성하지만, 처리 시간이 오래 걸릴 수 있습니다.
                            </p>
                        </div>

                        <!-- 다층 문서 허용 섹션 -->
                        <div>
                            <label class="block text-sm font-medium text-[var(--ui-text-highlighted)] mb-3">
                                <Icon icon="material-symbols:layers-outline" width="18" height="18" class="inline mr-2" />
                                다층 문서 허용
                            </label>
                            <div class="flex items-start gap-4">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        v-model="allowMultiLayerDocs"
                                        type="checkbox" 
                                        class="sr-only peer"
                                    />
                                    <div class="relative w-11 h-6 bg-[var(--ui-bg-elevated)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--ui-primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ui-primary)]"></div>
                                </label>
                                <div class="flex-1">
                                    <span class="text-sm font-medium text-[var(--ui-text)]">
                                        {{ allowMultiLayerDocs ? '활성화됨' : '비활성화됨' }}
                                    </span>
                                    <p class="text-xs text-[var(--ui-text-muted)] mt-1">
                                        활성화하면 에이전트가 하위 문서나 참조 문서를 자동으로 생성할 수 있습니다. 
                                        복잡한 주제에 대해 체계적인 문서 구조를 만들 때 유용합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ContentBody>
    </div>
</template>

<style scoped>
/* 슬라이더 커스텀 스타일 */
.slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--ui-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--ui-primary);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* kbd 태그 스타일 */
kbd {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
</style>
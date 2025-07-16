<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
const instruction = ref('')
const markdown = ref('')

const editTools = [
    { id: 'improve', label: '개선', icon: 'solar:magic-stick-3-bold', description: '텍스트를 더 명확하고 읽기 쉽게 개선합니다' },
    { id: 'summarize', label: '요약', icon: 'solar:text-circle-bold', description: '내용을 간결하게 요약합니다' },
    { id: 'expand', label: '확장', icon: 'solar:add-circle-bold', description: '내용을 더 자세히 설명합니다' },
    { id: 'translate', label: '번역', icon: 'solar:translation-bold', description: '다른 언어로 번역합니다' },
    { id: 'custom', label: '지정', icon: 'solar:settings-bold', description: '직접 지시사항을 입력합니다' }
]

</script>

<template>
    <div class="relative h-140
    ">
        <!-- 편집 도구 -->
        <div class="absolute top-10 right-0 z-10">
            <div class="absolute -top-12 -right-10 flex gap-1 bg-[var(--ui-bg-muted)] rounded-md p-1 shadow-xl">
                <button v-for="tool in editTools" :key="tool.id" :title="tool.description"
                    class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-md 
                            text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer min-w-[44px]">
                    <Icon :icon="tool.icon" class="w-4 h-4 text-[var(--ui-primary)]" />
                    <span class="text-xs">{{ tool.label }}</span>
                </button>
            </div>
            <div class="w-64 h-32 bg-[var(--ui-bg)] rounded-md p-4 border-[1px] border-[var(--ui-border)] select-none shadow-xl">
                Lorem ipsum dolor sit <span class="text-[var(--ui-primary)] bg-[var(--ui-primary-elevated)]"> amet
                    consectetur adipisicing elit.</span> Quisquam, quos.
            </div>
        </div>

        <div class="absolute top-120 left-10 z-10">
            <div class="absolute -top-72 right-0 flex gap-1 rounded-md p-1 shadow-xl">
                <div
                    class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border-accented)] rounded-lg shadow-lg p-2.5 w-[350px]">
                    <div class="text-xs text-[var(--ui-text-muted)] mb-1.5">편집 지시사항</div>
                    <div class="space-y-3">
                        <textarea v-model="instruction"
                            class="instruction-input w-full h-14 px-2.5 py-1.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md text-sm text-[var(--ui-text)] resize-none outline-none focus:border-[var(--ui-primary)] transition-colors"
                            placeholder="편집 지시사항을 입력하세요"></textarea>

                        <!-- 파일 업로드 영역 -->
                        <div class="space-y-2">
                            <div class="text-xs text-[var(--ui-text-muted)]">첨부파일 (선택사항)</div>
                            <!-- 파일 드롭 영역 -->
                            <div
                                class="border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-all border-[var(--ui-border)] hover:border-[var(--ui-primary)]/50">
                                <Icon icon="material-symbols:attach-file" width="16" height="16"
                                    class="mx-auto mb-1 text-[var(--ui-text-secondary)]" />
                                <p class="text-xs text-[var(--ui-text)]">
                                    파일 드래그 또는 <span class="text-[var(--ui-primary)] font-medium">클릭</span>
                                </p>
                                <p class="text-xs text-[var(--ui-text-secondary)] mt-0.5">
                                    이미지, PDF, 문서 • 최대 10MB
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-1.5">
                            <button
                                class="px-2.5 py-1.5 bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-md text-sm hover:bg-[var(--ui-bg-elevated)] transition-colors disabled:opacity-50">
                                취소
                            </button>
                            <button
                                class="flex-1 px-2.5 py-1.5 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ui-primary-elevated)] transition-colors">
                                편집
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="w-80 h-32 bg-[var(--ui-bg)] rounded-md p-4 border-[1px] border-[var(--ui-border)] select-none overflow-hidden shadow-xl">
                Etiam id vulputate tortor, <span class="text-[var(--ui-primary)] bg-[var(--ui-primary-elevated)]">eu aliquam tellus. Sed sed porta tellus. Cras accumsan, diam semper posuere
                accumsan, enim enim scelerisque lorem</span>, in semper nulla ante ac tortor. Vivamus nulla arcu, sodales in
                luctus a, bibendum ut nulla.
            </div>
        </div>

        <!-- 생성 도구 -->
        <div class="absolute top-0 left-50 w-[70%] space-y-4 h-fit rounded-md border-[1px] border-[var(--ui-border)] shadow-2xl 
        flex flex-col items-center justify-center p-8">
            <div class="space-y-3 w-full ">
                <label for="instruction" class="block font-medium text-[var(--ui-text)]">
                    생성할 위키에 대한 지시사항
                    <span class="text-[var(--ui-danger)] ml-1">*</span>
                </label>
                <textarea id="instruction" v-model="instruction" placeholder="어떤 위키를 생성하고 싶은지 자세히 설명해주세요..." rows="6"
                    class="w-full p-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] 
                                       text-[var(--ui-text)] placeholder-[var(--ui-text-secondary)]
                                       focus:outline-none focus:ring-2 focus:ring-[var(--ui-secondary)] focus:border-transparent
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       resize-none transition-all" />
                <div class="text-xs text-[var(--ui-text-secondary)] text-right">
                    {{ instruction.length }}/1000자
                </div>
            </div>

            <!-- 파일 업로드 -->
            <div class="space-y-3">
                <label class="block font-medium text-[var(--ui-text)]">
                    첨부파일
                    <span class="text-xs font-normal text-[var(--ui-text-secondary)] ml-2">
                        (선택사항 - 이미지, PDF, 문서 등)
                    </span>
                </label>

                <!-- 파일 드롭 영역 -->
                <div
                    class="border-2 border-dashed border-[var(--ui-border)] hover:border-[var(--ui-secondary)]/50 rounded-lg p-6 text-center cursor-pointer transition-all">
                    <Icon icon="material-symbols:cloud-upload" width="32" height="32"
                        class="mx-auto mb-2 text-[var(--ui-text-secondary)]" />
                    <p class="text-sm text-[var(--ui-text)]">
                        파일을 드래그하여 업로드하거나 <span class="text-[var(--ui-secondary)] font-medium">클릭</span>하여 선택
                    </p>
                    <p class="text-xs text-[var(--ui-text-secondary)] mt-1">
                        이미지 (JPG, PNG, GIF, WebP), PDF, 문서 (DOCX, TXT, MD) 지원 • 최대 10MB
                    </p>
                </div>
            </div>

            <div class="flex justify-end">

                <button class="px-6 py-2 bg-[var(--ui-secondary)] hover:bg-[var(--ui-secondary-elevated)] 
                                       text-white font-medium rounded-lg transition-colors
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       flex items-center gap-2">
                    <Icon icon="jam:magic" width="16" height="16" />
                    위키 생성
                </button>
            </div>
        </div>
    </div>
</template>
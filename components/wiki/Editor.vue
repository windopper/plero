<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ref, nextTick, onMounted, onUnmounted, useTemplateRef } from 'vue'
import Tags from './Tags.vue'
import AIEditTooltip from './AIEditTooltip.vue'

const props = defineProps<{
    contentValue: string
    titleValue: string
    tags: string[]
}>()

const emit = defineEmits<{
    'update:contentValue': [value: string]
    'update:titleValue': [value: string]
    'update:tags': [value: string[]]
}>()

const newTag = ref('')

// AI 편집 관련 상태
const showAITooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const selectedText = ref('')
const selectionRange = ref<Range | null>(null)
const mdEditorRef = useTemplateRef('mdEditorRef')
const aiEditTooltipRef = useTemplateRef('aiEditTooltipRef')

const updateContentValue = (value: string) => {
    emit('update:contentValue', value)
}

const updateTitleValue = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:titleValue', target.value)
}

const updateTags = (value: string[]) => {
    emit('update:tags', value)
}

const removeTag = (tag: string) => {
    emit('update:tags', props.tags.filter(t => t !== tag))
}

const addTag = () => {
    const trimmedTag = newTag.value.trim()
    if (trimmedTag && !props.tags.includes(trimmedTag)) {
        emit('update:tags', [...props.tags, trimmedTag])
        newTag.value = ''
    }
}

const handleTagInput = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        event.preventDefault()
        addTag()
    }
}

const isPleroTag = (tag: string) => {
    return tag.startsWith('plero:')
}

// 텍스트 선택 처리
const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
        hideAITooltip()
        return
    }

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    
    // 선택된 텍스트가 있고, md-editor 영역 내부인 경우
    if (text.length > 0 && range.commonAncestorContainer) {
        const editorElement = document.querySelector('.md-editor')
        if (editorElement && editorElement.contains(range.commonAncestorContainer)) {
            selectedText.value = text
            selectionRange.value = range.cloneRange()
            
            // 툴팁 위치 계산
            const editorElementRect = editorElement.getBoundingClientRect()
            const rect = range.getBoundingClientRect()

            if (rect.top < 160) {
                if (editorElementRect.bottom < rect.bottom) {
                    tooltipPosition.value = {
                        x: rect.left + (rect.width / 2),
                        y: editorElementRect.bottom + 100
                    }
                } else {
                    tooltipPosition.value = {
                        x: rect.left + (rect.width / 2),
                        y: rect.bottom + 100
                    }
                }
            } else {
                if (editorElementRect.top < rect.top) {
                    tooltipPosition.value = {
                        x: rect.left + (rect.width / 2),    
                        y: rect.top
                    }
                } else {
                    tooltipPosition.value = {
                        x: rect.left + (rect.width / 2),    
                        y: editorElementRect.top
                    }
                }
            }

            showAITooltip.value = true
        }
    }
}

// AI 툴팁 숨기기
const hideAITooltip = () => {
    showAITooltip.value = false
    selectedText.value = ''
    selectionRange.value = null
}

// AI 편집 완료 처리
const handleEditComplete = (editedText: string) => {
    if (!selectionRange.value) return
    
    // 현재 선택된 텍스트를 편집된 텍스트로 교체
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(selectionRange.value)
    
    // 선택된 텍스트를 편집된 텍스트로 교체
    const range = selectionRange.value
    range.deleteContents()
    range.insertNode(document.createTextNode(editedText))
    
    // 에디터 내용 업데이트
    nextTick(() => {
        const editorTextarea = document.querySelector('.md-editor .w-md-editor-text-textarea') as HTMLTextAreaElement
        if (editorTextarea && editorTextarea.value) {
            // md-editor의 내용을 직접 업데이트
            const currentContent = props.contentValue
            const newContent = currentContent.replace(selectedText.value, editedText)
            updateContentValue(newContent)
        }
    })
    
    hideAITooltip()
}

// 문서 클릭 시 툴팁 숨기기
const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    
    // aiEditTooltipRef 내부 클릭이면 무시
    if (aiEditTooltipRef.value && aiEditTooltipRef.value.$el && aiEditTooltipRef.value.$el.contains(target)) {
        return
    }

    // 그 외의 경우 툴팁 숨기기
    if (showAITooltip.value) {
        hideAITooltip()
    }
}

// 이벤트 리스너 등록/해제
onMounted(() => {
    // document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('scroll', handleTextSelection)
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('selectionchange', handleTextSelection)
})

onUnmounted(() => {
    // document.removeEventListener('mouseup', handleTextSelection)
    document.removeEventListener('scroll', handleTextSelection)
    document.removeEventListener('mousedown', handleDocumentClick)
    document.removeEventListener('selectionchange', handleTextSelection)
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <input 
            type="text" 
            :value="titleValue" 
            @input="updateTitleValue"
            placeholder="제목을 입력해주세요"
            class="text-[var(--ui-text)] bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md px-4 py-3 outline-none focus:border-[var(--ui-primary)] transition-colors" />

        <!-- 태그 섹션 -->
        <div class="space-y-3">
            <div class="text-sm font-medium text-[var(--ui-text)] ">태그</div>

            <!-- 기존 태그들 -->
            <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
                <Tags v-for="tag in tags" :key="tag" :tag="tag" @remove="removeTag" />
            </div>

            <!-- 새 태그 입력 -->
            <div class="flex gap-2">
                <input v-model="newTag" type="text" placeholder="태그를 입력하고 Enter를 누르세요 (예: frontend, plero:official)"
                    @keydown="handleTagInput"
                    class="flex-1 text-[var(--ui-text)] bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--ui-primary)] transition-colors" />
                <button @click="addTag" :disabled="!newTag.trim()"
                    class="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ui-primary-elevated)] transition-colors">
                    추가
                </button>
            </div>

            <!-- 태그 설명 -->
            <div class="text-xs text-[var(--ui-text-muted)] space-y-1">
                <p>• 일반 태그: 사용자가 생성한 페이지에 대해 분류됩니다</p>
                <p>• plero: 태그: 전체 페이지에 대해 분류됩니다 (예: plero:official, plero:guide)</p>
            </div>
        </div>

        <MdEditor 
            ref="mdEditorRef"
            :model-value="contentValue" 
            @update:model-value="updateContentValue"
            language="ko" />

        <!-- AI 편집 툴팁 -->
        <AIEditTooltip 
            ref="aiEditTooltipRef"
            :visible="showAITooltip"
            :position="tooltipPosition"
            :selected-text="selectedText"
            @close="hideAITooltip"
            @edit-complete="handleEditComplete" />
    </div>
</template>

<style>
.md-editor {
    --md-color: var(--ui-text);
    --md-hover-color: var(--ui-text-highlighted);
    --md-bk-color: var(--ui-bg);
    --md-bk-color-outstand: var(--ui-bg-muted);
    --md-bk-hover-color: var(--ui-bg-elevated);
    --md-border-color: var(--ui-border);
    --md-border-hover-color: var(--ui-border-accented);
    --md-border-active-color: var(--ui-text-toned);
    --md-modal-mask: #00000073;
    --md-scrollbar-bg-color: var(--ui-bg);
    --md-scrollbar-thumb-color: var(--ui-border);
    --md-scrollbar-thumb-hover-color: var(--ui-border-accented);
    --md-scrollbar-thumb-active-color: var(--ui-border-accented);
}
</style>
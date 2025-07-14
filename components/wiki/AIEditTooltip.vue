<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, useTemplateRef } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    position: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    },
    selectedText: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['close', 'edit-complete'])

// 상태 관리
const instruction = ref('')
const isEditing = ref(false)
const showInstructionInput = ref(false)
const editedText = ref('')
const currentSessionId = ref('')
const aiEditTooltipRef = useTemplateRef<HTMLDivElement>('aiEditTooltipRef')
const isError = ref(true)
const errorTimer = ref<NodeJS.Timeout | null>(null)

// 파일 업로드 관련 상태
const uploadedFiles = ref<File[]>([])
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const isDragOver = ref(false)
const uploadProgress = ref<{ [key: string]: number }>({})
const isUploading = ref(false)

defineExpose({
    $el: aiEditTooltipRef
})

// 툴팁 위치 계산
const tooltipStyle = computed(() => ({
    position: 'fixed' as const,
    left: `${props.position.x}px`,
    top: `${props.position.y - 10}px`,
    zIndex: 1000,
    transform: 'translateY(-100%)'
}))

// AI 편집 도구들
const editTools = [
    { id: 'improve', label: '개선', icon: 'solar:magic-stick-3-bold', description: '텍스트를 더 명확하고 읽기 쉽게 개선합니다' },
    { id: 'summarize', label: '요약', icon: 'solar:text-circle-bold', description: '내용을 간결하게 요약합니다' },
    { id: 'expand', label: '확장', icon: 'solar:add-circle-bold', description: '내용을 더 자세히 설명합니다' },
    { id: 'translate', label: '번역', icon: 'solar:translation-bold', description: '다른 언어로 번역합니다' },
    { id: 'custom', label: '지정', icon: 'solar:settings-bold', description: '직접 지시사항을 입력합니다' }
]

// 파일 업로드 관련 함수들
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files) {
        addFiles(Array.from(target.files))
    }
}

const addFiles = (files: File[]) => {
    const supportedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ]

    const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB 제한
            alert(`파일 "${file.name}"이 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다.`)
            return false
        }
        if (!supportedTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv)$/i)) {
            alert(`파일 "${file.name}"은 지원하지 않는 형식입니다.`)
            return false
        }
        return true
    })

    // 중복 파일 체크
    const newFiles = validFiles.filter(file =>
        !uploadedFiles.value.some(existing =>
            existing.name === file.name && existing.size === file.size
        )
    )

    uploadedFiles.value.push(...newFiles)
}

const removeFile = (index: number) => {
    const fileName = uploadedFiles.value[index]?.name
    uploadedFiles.value.splice(index, 1)
    // 해당 파일의 업로드 진행률도 제거
    if (fileName && uploadProgress.value[fileName]) {
        delete uploadProgress.value[fileName]
    }
}

const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = false

    if (event.dataTransfer?.files) {
        addFiles(Array.from(event.dataTransfer.files))
    }
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return 'material-symbols:image'
    if (file.type === 'application/pdf') return 'material-symbols:picture-as-pdf'
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'material-symbols:description'
    if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) return 'material-symbols:table-chart'
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'material-symbols:text-snippet'
    if (file.name.endsWith('.md')) return 'material-symbols:code'
    return 'material-symbols:attach-file'
}

const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return '이미지'
    if (file.type === 'application/pdf') return 'PDF'
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'Word 문서'
    if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) return 'Excel 시트'
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return '텍스트'
    if (file.name.endsWith('.md')) return 'Markdown'
    return '문서'
}

const getFilePreviewUrl = (file: File) => {
    if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
    }
    return ''
}

const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    if (target) {
        target.style.display = 'none'
    }
}

// 도구 클릭 처리
const handleToolClick = (toolId: string) => {
    if (toolId === 'custom') {
        showInstructionInput.value = true
        nextTick(() => {
            const input = document.querySelector('.instruction-input') as HTMLTextAreaElement
            if (input) input.focus()
        })
    } else {
        const presets = {
            improve: '이 텍스트를 더 명확하고 읽기 쉽게 개선해주세요.',
            summarize: '이 텍스트를 핵심 내용만 포함하여 간결하게 요약해주세요.',
            expand: '이 텍스트를 더 자세하고 구체적으로 확장해주세요.',
            translate: '이 텍스트를 영어로 번역해주세요.'
        }

        instruction.value = presets[toolId as keyof typeof presets]
        startEdit()
    }
}

// 편집 시작
const startEdit = async () => {
    if (!instruction.value.trim()) return

    isEditing.value = true
    editedText.value = ''
    showInstructionInput.value = false
    isUploading.value = uploadedFiles.value.length > 0

    try {
        let response

        // 파일이 있는 경우 FormData 사용, 없는 경우 JSON 사용
        if (uploadedFiles.value.length > 0) {
            const formData = new FormData()
            formData.append('originalText', props.selectedText)
            formData.append('instruction', instruction.value)
            formData.append('stream', 'true')

            // 파일들 추가
            uploadedFiles.value.forEach((file) => {
                formData.append('files', file)
            })

            response = await fetch('/api/ai/edit', {
                method: 'POST',
                body: formData,
            })
        } else {
            // 기존 JSON 방식
            response = await fetch('/api/ai/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalText: props.selectedText,
                    instruction: instruction.value,
                    stream: true
                }),
            })
        }

        if (!response.ok) {
            throw new Error('편집 요청에 실패했습니다.')
        }

        const reader = response.body?.getReader() as ReadableStreamDefaultReader<Uint8Array>
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6))

                        if (data.type === 'session') {
                            currentSessionId.value = data.sessionId
                        } else if (data.type === 'chunk') {
                            editedText.value += data.data
                        } else if (data.type === 'complete') {
                            isEditing.value = false
                        } else if (data.type === 'error') {
                            setError()
                            isEditing.value = false
                        } else if (data.type === 'aborted') {
                            isEditing.value = false
                        }
                    } catch (e) {
                        // JSON 파싱 오류 무시
                    }
                }
            }
        }
    } catch (error) {
        console.error('편집 중 오류:', error)
        setError()
        isEditing.value = false
    } finally {
        isUploading.value = false
    }
}

// 편집 취소
const cancelEdit = async () => {
    if (currentSessionId.value) {
        try {
            await $fetch('/api/ai/cancel', {
                method: 'POST',
                body: {
                    sessionId: currentSessionId.value
                }
            })
        } catch (error) {
            console.error('취소 요청 실패:', error)
        }
    }

    isEditing.value = false
    editedText.value = ''
    currentSessionId.value = ''
}

// 편집 적용
const applyEdit = () => {
    emit('edit-complete', editedText.value)
    closeTooltip()
}

// 편집 거부
const rejectEdit = () => {
    editedText.value = ''
    isEditing.value = false
    showInstructionInput.value = false
}

// 오류 상태 관리
const resetError = () => {
    isError.value = false
    if (errorTimer.value) {
        clearTimeout(errorTimer.value)
        errorTimer.value = null
    }
}

const setError = () => {
    isError.value = true
    resetError() // 기존 타이머가 있다면 정리
    errorTimer.value = setTimeout(() => {
        isError.value = false
        errorTimer.value = null
    }, 3000) // 3초 후 자동으로 오류 상태 해제
}

// 툴팁 닫기
const closeTooltip = () => {
    instruction.value = ''
    editedText.value = ''
    isEditing.value = false
    showInstructionInput.value = false
    currentSessionId.value = ''
    resetError() // 오류 상태 초기화
    // 파일 관련 상태 초기화
    uploadedFiles.value = []
    uploadProgress.value = {}
    isUploading.value = false
    isDragOver.value = false
    emit('close')
}

// ESC 키로 닫기
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        if (isEditing.value) {
            cancelEdit()
        } else {
            closeTooltip()
        }
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    resetError() // 컴포넌트 언마운트 시 타이머 정리
    if (currentSessionId.value) {
        cancelEdit()
    }
})

// visible 변경 시 상태 초기화
watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        instruction.value = ''
        editedText.value = ''
        isEditing.value = false
        showInstructionInput.value = false
        currentSessionId.value = ''
        resetError() // 오류 상태 초기화
        // 파일 관련 상태 초기화
        uploadedFiles.value = []
        uploadProgress.value = {}
        isUploading.value = false
        isDragOver.value = false
    }
})
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" :style="tooltipStyle" class="ai-edit-tooltip" ref="aiEditTooltipRef">
            <!-- 오류 상태 -->
            <div v-if="isError"
                class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-warning)] rounded-lg shadow-lg p-2.5 w-[320px]">
                <div class="flex items-center gap-2 mb-2">
                    <Icon icon="fe:warning" class="w-4 h-4 text-[var(--ui-warning)]" />
                    <div class="text-sm font-medium text-[var(--ui-warning)]">편집 중 오류가 발생했습니다</div>
                </div>
                <div class="text-xs text-[var(--ui-text-muted)] mb-3">
                    잠시 후 다시 시도해주세요. 문제가 지속되면 페이지를 새로고침해주세요.
                </div>
                <div class="flex gap-1.5">
                    <button @click="resetError"
                        class="flex-1 px-2.5 py-1.5 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium hover:bg-[var(--ui-primary-elevated)] transition-colors">
                        다시 시도
                    </button>
                    <button @click="closeTooltip"
                        class="px-2.5 py-1.5 bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-md text-sm hover:bg-[var(--ui-bg-elevated)] transition-colors">
                        닫기
                    </button>
                </div>
            </div>

            <!-- 기본 툴팁 -->
            <div v-else-if="!showInstructionInput && !isEditing && !editedText"
                class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border-accented)] rounded-lg shadow-lg p-2">
                <div class="flex flex-row justify-between mb-2">
                    <div class="text-xs text-[var(--ui-text-muted)] text-center">AI 편집</div>
                    <button @click="closeTooltip"
                        class="text-xs text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors">
                        닫기 (ESC)
                    </button>
                </div>
                <div class="flex gap-1">
                    <button v-for="tool in editTools" :key="tool.id" @click="handleToolClick(tool.id)"
                        :title="tool.description"
                        class="flex flex-col items-center gap-1 px-2 py-1.5 rounded-md 
                            text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer min-w-[44px]">
                        <Icon :icon="tool.icon" class="w-4 h-4 text-[var(--ui-primary)]" />
                        <span class="text-xs">{{ tool.label }}</span>
                    </button>
                </div>
            </div>

            <!-- 지시사항 입력 -->
            <div v-else-if="showInstructionInput"
                class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border-accented)] rounded-lg shadow-lg p-2.5 w-[400px]">
                <div class="text-xs text-[var(--ui-text-muted)] mb-1.5">편집 지시사항</div>
                <div class="space-y-3">
                    <textarea v-model="instruction"
                        class="instruction-input w-full h-14 px-2.5 py-1.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md text-sm text-[var(--ui-text)] resize-none outline-none focus:border-[var(--ui-primary)] transition-colors"
                        placeholder="편집 지시사항을 입력하세요"></textarea>

                    <!-- 파일 업로드 영역 -->
                    <div class="space-y-2">
                        <div class="text-xs text-[var(--ui-text-muted)]">첨부파일 (선택사항)</div>

                        <!-- 파일 드롭 영역 -->
                        <div @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
                            @click="fileInputRef?.click()" :class="[
                                'border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-all',
                                isDragOver
                                    ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                                    : 'border-[var(--ui-border)] hover:border-[var(--ui-primary)]/50',
                                isEditing ? 'opacity-50 cursor-not-allowed' : ''
                            ]">
                            <Icon icon="material-symbols:attach-file" width="16" height="16"
                                class="mx-auto mb-1 text-[var(--ui-text-secondary)]" />
                            <p class="text-xs text-[var(--ui-text)]">
                                파일 드래그 또는 <span class="text-[var(--ui-primary)] font-medium">클릭</span>
                            </p>
                            <p class="text-xs text-[var(--ui-text-secondary)] mt-0.5">
                                이미지, PDF, 문서 • 최대 10MB
                            </p>
                        </div>

                        <!-- 숨겨진 파일 입력 -->
                        <input ref="fileInputRef" type="file" multiple accept="image/*,.pdf,.txt,.md,.docx,.xlsx,.csv"
                            @change="handleFileSelect" class="hidden" :disabled="isEditing" />

                        <!-- 업로드된 파일 목록 -->
                        <div v-if="uploadedFiles.length > 0" class="space-y-1 max-h-24 overflow-y-auto">
                            <div v-for="(file, index) in uploadedFiles" :key="`${file.name}-${file.size}`"
                                class="flex items-center gap-2 p-2 bg-[var(--ui-bg)] rounded border border-[var(--ui-border)]">

                                <!-- 파일 아이콘 -->
                                <div class="flex-shrink-0">
                                    <!-- 이미지 미리보기 -->
                                    <div v-if="file.type.startsWith('image/')"
                                        class="w-6 h-6 rounded overflow-hidden bg-[var(--ui-border)]">
                                        <img :src="getFilePreviewUrl(file)" :alt="file.name"
                                            class="w-full h-full object-cover" @error="handleImageError" />
                                    </div>
                                    <!-- 다른 파일 타입 아이콘 -->
                                    <div v-else
                                        class="w-6 h-6 rounded bg-[var(--ui-primary)]/10 flex items-center justify-center">
                                        <Icon :icon="getFileIcon(file)" width="12" height="12"
                                            class="text-[var(--ui-primary)]" />
                                    </div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div class="text-xs font-medium text-[var(--ui-text)] truncate">
                                        {{ file.name }}
                                    </div>
                                    <div class="text-xs text-[var(--ui-text-secondary)]">
                                        {{ formatFileSize(file.size) }} • {{ getFileTypeLabel(file) }}
                                    </div>
                                </div>

                                <button @click="removeFile(index)" :disabled="isEditing"
                                    class="p-0.5 rounded hover:bg-[var(--ui-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Icon icon="material-symbols:close" width="12" height="12"
                                        class="text-[var(--ui-text-secondary)]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-1.5">
                        <button @click="startEdit" :disabled="!instruction.trim() || isEditing"
                            class="flex-1 px-2.5 py-1.5 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ui-primary-elevated)] transition-colors">
                            {{ isEditing ? '편집 중...' : '편집' }}
                        </button>
                        <button @click="showInstructionInput = false" :disabled="isEditing"
                            class="px-2.5 py-1.5 bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-md text-sm hover:bg-[var(--ui-bg-elevated)] transition-colors disabled:opacity-50">
                            취소
                        </button>
                    </div>
                </div>
            </div>

            <!-- 편집 진행 중 -->
            <div v-else-if="isEditing"
                class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border-accented)] rounded-lg shadow-lg p-2.5 w-[320px]">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="text-xs text-[var(--ui-text-muted)]">편집 중...</div>
                    <button @click="cancelEdit"
                        class="px-1.5 py-0.5 text-xs text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors">
                        취소
                    </button>
                </div>
                <div
                    class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md p-2 min-h-[60px] max-h-[120px] overflow-y-auto">
                    <div class="text-sm text-[var(--ui-text)] whitespace-pre-wrap">{{ editedText }}</div>
                    <div v-if="!editedText" class="flex items-center gap-1.5 text-sm text-[var(--ui-text-muted)]">
                        <Icon icon="solar:refresh-bold" class="w-3.5 h-3.5 animate-spin" />
                        편집 중...

                        <div class="rounded-md bg-[var(--ui-bg-elevated)] animate-pulse p-1 flex flex-row gap-1">
                            <span class="text-xs text-[var(--ui-text-muted)]" v-for="file in uploadedFiles.slice(0, 4)"
                                :key="file.name">
                                <Icon v-if="file.type.startsWith('image/')" icon="material-symbols:image"
                                    class="w-3.5 h-3.5" />
                                <Icon v-else-if="file.type === 'application/pdf'" icon="material-symbols:picture-as-pdf"
                                    class="w-3.5 h-3.5" />
                                <Icon v-else-if="file.type.includes('word') || file.name.endsWith('.docx')"
                                    icon="material-symbols:description" class="w-3.5 h-3.5" />
                                <Icon v-else-if="file.type.includes('sheet') || file.name.endsWith('.xlsx')"
                                    icon="material-symbols:table-chart" class="w-3.5 h-3.5" />
                                <Icon v-else-if="file.type === 'text/plain' || file.name.endsWith('.txt')"
                                    icon="material-symbols:text-snippet" class="w-3.5 h-3.5" />
                                <Icon v-else-if="file.name.endsWith('.md')" icon="material-symbols:code"
                                    class="w-3.5 h-3.5" />
                                <Icon v-else icon="material-symbols:attach-file" class="w-3.5 h-3.5" />
                            </span>
                            <span v-if="uploadedFiles.length > 4" class="text-xs text-[var(--ui-text-muted)]">
                                +{{ uploadedFiles.length - 4 }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 편집 완료 -->
            <div v-else-if="editedText"
                class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border-accented)] rounded-lg shadow-lg p-2.5 w-[320px]">
                <div class="text-xs text-[var(--ui-text-muted)] mb-1.5">편집 결과</div>
                <div
                    class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md p-2 mb-2 max-h-[120px] overflow-y-auto">
                    <div class="text-sm text-[var(--ui-text)] whitespace-pre-wrap">{{ editedText }}</div>
                </div>
                <div class="flex gap-1">
                    <button @click="applyEdit"
                        class="flex-1 px-2 py-1.5 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium hover:bg-[var(--ui-primary-elevated)] transition-colors">
                        적용
                    </button>
                    <button @click="rejectEdit"
                        class="px-2 py-1.5 bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-md text-sm hover:bg-[var(--ui-bg-elevated)] transition-colors">
                        재시도
                    </button>
                    <button @click="closeTooltip"
                        class="px-2 py-1.5 bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-md text-sm hover:bg-[var(--ui-bg-elevated)] transition-colors">
                        취소
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.ai-edit-tooltip {
    font-family: inherit;
}

.instruction-input::placeholder {
    color: var(--ui-text-muted);
}

/* 스크롤바 스타일링 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: var(--ui-bg-muted);
}

::-webkit-scrollbar-thumb {
    background: var(--ui-border-accented);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--ui-text-muted);
}
</style>
<script setup lang="ts">
import { Icon } from '@iconify/vue';

const emit = defineEmits(['apply-parsed-wiki']);
const openModal = ref(false);
const instruction = ref('');
const isGenerating = ref(false);
const streamOutput = ref('');
const fullStreamContent = ref('');
const parsedWikiData = ref<{ title?: string, content?: string, tags?: string[] } | null>(null);

// 파일 업로드 관련 상태
const uploadedFiles = ref<File[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const uploadProgress = ref<{ [key: string]: number }>({});
const isUploading = ref(false);

// 세션 관리를 위한 변수들
const currentSessionId = ref<string | null>(null);
const isStreamCancelled = ref(false);
const cancelMessage = ref('');
let abortController: AbortController | null = null;
let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

// 스크롤 컨테이너 참조
const streamContainer = ref<HTMLElement | null>(null);

// 자동 스크롤 함수
const scrollToBottom = async () => {
    await nextTick();
    if (streamContainer.value) {
        streamContainer.value.scrollTop = streamContainer.value.scrollHeight;
    }
};

const generateWiki = async () => {
    if (!instruction.value.trim()) return;

    // 초기 상태로 리셋 후 생성 시작
    isGenerating.value = true;
    isUploading.value = uploadedFiles.value.length > 0;

    // 새로운 AbortController 생성 (HTTP 요청 중단용)
    abortController = new AbortController();

    try {
        let response: Response;

        // 파일이 있는 경우 FormData 사용, 없는 경우 JSON 사용
        if (uploadedFiles.value.length > 0) {
            const formData = new FormData();
            formData.append('instruction', instruction.value);
            formData.append('stream', 'true');

            // 파일들 추가
            uploadedFiles.value.forEach((file, index) => {
                formData.append(`files`, file);
            });

            response = await fetch('/api/ai/wiki', {
                method: 'POST',
                body: formData,
                signal: abortController.signal
            });
        } else {
            // 기존 JSON 방식
            response = await fetch('/api/ai/wiki', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instruction: instruction.value,
                    stream: true
                }),
                signal: abortController.signal
            });
        }

        if (!response.ok) {
            throw new Error('스트림 요청 실패');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('스트림 리더를 생성할 수 없습니다');
        }

        streamReader = reader; // reader 참조 저장

        while (true) {
            // abort가 호출되었는지 먼저 확인
            if (abortController.signal.aborted) {
                console.log('클라이언트에서 스트림 중단 감지');
                break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                // 각 라인 처리 전에도 중단 확인
                if (abortController.signal.aborted) {
                    console.log('라인 처리 중 중단 감지');
                    return;
                }

                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === 'session') {
                            // 세션 ID 저장
                            currentSessionId.value = data.sessionId;
                            console.log('세션 ID 받음:', data.sessionId);
                        } else if (data.type === 'chunk') {
                            streamOutput.value += data.data;
                            fullStreamContent.value += data.data;
                            // 새로운 텍스트가 추가될 때마다 스크롤
                            scrollToBottom();
                        } else if (data.type === 'complete') {
                            // 스트림 완료시 XML 파싱 시도
                            parseWikiContent(fullStreamContent.value);
                        } else if (data.type === 'aborted') {
                            console.log('서버에서 중단 신호 받음:', data.data);
                            // 서버에서 중단 신호를 받으면 클라이언트도 중단 상태로 변경
                            if (!isStreamCancelled.value) {
                                isStreamCancelled.value = true;
                                cancelMessage.value = data.data || '서버에서 스트림이 중단되었습니다.';
                                isGenerating.value = false;

                                // 3초 후 초기 화면으로 자동 복귀
                                setTimeout(() => {
                                    resetToInitialState();
                                }, 3000);
                            }
                            break;
                        } else if (data.type === 'error') {
                            console.error('스트림 에러:', data.data);
                            throw new Error(data.data);
                        }
                    } catch (parseError) {
                        console.warn('JSON 파싱 실패:', line);
                    }
                }
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('스트림이 사용자에 의해 중단되었습니다');
        } else {
            console.error('Failed to generate wiki:', error);
            alert('위키 생성에 실패했습니다: ' + String(error));
        }
    } finally {
        isGenerating.value = false;
        cleanupStream();
    }
};

const cleanupStream = () => {
    // AbortController 정리 (HTTP 요청 중단용)
    if (abortController && !abortController.signal.aborted) {
        abortController.abort();
    }
    abortController = null;

    // Reader 정리
    if (streamReader) {
        streamReader.releaseLock();
        streamReader = null;
    }

    // 세션 정리
    currentSessionId.value = null;
};

// 초기 상태로 완전 복귀
const resetToInitialState = () => {
    streamOutput.value = '';
    fullStreamContent.value = '';
    parsedWikiData.value = null;
    currentSessionId.value = null;
    isStreamCancelled.value = false;
    cancelMessage.value = '';
    isGenerating.value = false;
    // 파일 관련 상태도 초기화
    uploadedFiles.value = [];
    uploadProgress.value = {};
    isUploading.value = false;
    isDragOver.value = false;
};

// 파일 업로드 관련 함수들
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        addFiles(Array.from(target.files));
    }
};

const addFiles = (files: File[]) => {
    const supportedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB 제한
            alert(`파일 "${file.name}"이 너무 큽니다. 10MB 이하의 파일만 업로드할 수 있습니다.`);
            return false;
        }
        if (!supportedTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv)$/i)) {
            alert(`파일 "${file.name}"은 지원하지 않는 형식입니다.`);
            return false;
        }
        return true;
    });

    // 중복 파일 체크
    const newFiles = validFiles.filter(file =>
        !uploadedFiles.value.some(existing =>
            existing.name === file.name && existing.size === file.size
        )
    );

    uploadedFiles.value.push(...newFiles);
};

const removeFile = (index: number) => {
    uploadedFiles.value.splice(index, 1);
    // 해당 파일의 업로드 진행률도 제거
    const fileName = uploadedFiles.value[index]?.name;
    if (fileName && uploadProgress.value[fileName]) {
        delete uploadProgress.value[fileName];
    }
};

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;

    if (event.dataTransfer?.files) {
        addFiles(Array.from(event.dataTransfer.files));
    }
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return 'material-symbols:image';
    if (file.type === 'application/pdf') return 'material-symbols:picture-as-pdf';
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'material-symbols:description';
    if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) return 'material-symbols:table-chart';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'material-symbols:text-snippet';
    if (file.name.endsWith('.md')) return 'material-symbols:code';
    return 'material-symbols:attach-file';
};

const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return '이미지';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'Word 문서';
    if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) return 'Excel 시트';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return '텍스트';
    if (file.name.endsWith('.md')) return 'Markdown';
    return '문서';
};

const getFilePreviewUrl = (file: File) => {
    if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
    }
    return '';
};

const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement | null;
    if (target) {
        target.style.display = 'none';
    }
};

const parseWikiContent = (content: string) => {
    try {
        // XML 태그 파싱 시도
        const titleMatch = content.match(/<title>(.*?)<\/title>/s);
        const contentMatch = content.match(/<content>(.*?)<\/content>/s);

        if (titleMatch || contentMatch) {
            parsedWikiData.value = {
                title: titleMatch?.[1]?.trim(),
                content: contentMatch?.[1]?.trim(),
            };
        }
    } catch (error) {
        console.error('위키 콘텐츠 파싱 실패:', error);
    }
};

const closeModal = async () => {
    if (isGenerating.value && !isStreamCancelled.value) {
        // 생성 중이고 아직 취소되지 않았을 때만 확인
        if (confirm('위키 생성이 진행 중입니다. 정말로 취소하시겠습니까?')) {
            await stopGeneration();
            openModal.value = false;
            instruction.value = '';
            resetToInitialState();
        }
        return;
    }

    // 일반적인 모달 닫기
    openModal.value = false;
    instruction.value = '';
    resetToInitialState();
};

const applyParsedWiki = () => {
    if (!parsedWikiData.value) return;
    emit('apply-parsed-wiki', parsedWikiData.value);
    closeModal();
};

// 생성 중단 함수 추가
const stopGeneration = async () => {
    // 중단 상태 표시
    isStreamCancelled.value = true;
    cancelMessage.value = '위키 생성을 취소하고 있습니다...';

    // 세션 ID가 있으면 서버에 취소 요청
    if (currentSessionId.value) {
        try {
            const response = await fetch('/api/ai/wiki/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: currentSessionId.value
                })
            });
            const result = await response.json();
            if (result.success) {
                cancelMessage.value = '위키 생성이 성공적으로 취소되었습니다.';
            } else {
                cancelMessage.value = '취소 요청 중 문제가 발생했지만 로컬에서 중단되었습니다.';
            }
        } catch (error) {
            cancelMessage.value = '네트워크 오류로 인해 로컬에서만 중단되었습니다.';
        }
    } else {
        cancelMessage.value = '위키 생성이 취소되었습니다.';
    }

    // 클라이언트 측 정리
    cleanupStream();
    isGenerating.value = false;

    // 3초 후 초기 화면으로 자동 복귀
    setTimeout(() => {
        resetToInitialState();
    }, 3000);
};

// 브라우저 종료 시 스트림 정리
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isGenerating.value) {
        cleanupStream();
        event.preventDefault();
        event.returnValue = '위키 생성이 진행 중입니다. 페이지를 떠나시겠습니까?';
    }
};

// 컴포넌트 생성 시 이벤트 리스너 등록
onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
});

// 컴포넌트 제거 시 정리
onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    cleanupStream();
});

// 모달이 닫힐 때도 스트림 정리 (watch로 감시)
watch(openModal, (newValue) => {
    if (!newValue) {
        if (isGenerating.value && !isStreamCancelled.value) {
            // 생성 중이지만 취소되지 않은 상태에서 모달이 닫히면 강제 정리
            cleanupStream();
        }
        // 모달이 닫히면 모든 상태 초기화
        resetToInitialState();
    }
});
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
            <div class="bg-[var(--ui-bg)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <!-- 헤더 -->
                <div class="flex items-center justify-between p-6 border-b border-[var(--ui-border)]">
                    <div class="flex items-center gap-3">
                        <Icon icon="jam:magic" width="24" height="24" class="text-[var(--ui-secondary)]" />
                        <h2 class="text-2xl font-bold text-[var(--ui-text)]">AI 위키 생성</h2>
                    </div>
                    <button @click="closeModal" :disabled="isGenerating"
                        class="p-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Icon icon="material-symbols:close" width="20" height="20"
                            class="text-[var(--ui-text-secondary)]" />
                    </button>
                </div>

                <!-- 콘텐츠 -->
                <div class="p-6 space-y-6 overflow-y-auto">
                    <!-- 생성 진행 중이 아닐 때만 입력 폼 표시 -->
                    <div v-if="!isGenerating && !streamOutput" class="space-y-6">
                        <!-- 안내문 -->
                        <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-4 border-l-4 border-[var(--ui-secondary)]">
                            <h3 class="font-semibold text-[var(--ui-text)] mb-2 flex items-center gap-2">
                                <Icon icon="material-symbols:info" width="18" height="18"
                                    class="text-[var(--ui-secondary)]" />
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
                                <Icon icon="material-symbols:lightbulb" width="18" height="18"
                                    class="text-[var(--ui-accent)]" />
                                예시
                            </h4>
                            <div class="grid gap-2">
                                <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-3 text-sm">
                                    <span class="text-[var(--ui-text-secondary)]">• "가상 인물에 대한 위키 문서"</span>
                                </div>
                            </div>
                        </div>

                        <!-- Instruction 입력 -->
                        <div class="space-y-3">
                            <label for="instruction" class="block font-medium text-[var(--ui-text)]">
                                생성할 위키에 대한 지시사항
                                <span class="text-[var(--ui-danger)] ml-1">*</span>
                            </label>
                            <textarea id="instruction" v-model="instruction" placeholder="어떤 위키를 생성하고 싶은지 자세히 설명해주세요..."
                                rows="6" :disabled="isGenerating" class="w-full p-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] 
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
                            <div @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
                                @click="fileInputRef?.click()" :class="[
                                    'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
                                    isDragOver
                                        ? 'border-[var(--ui-secondary)] bg-[var(--ui-secondary)]/5'
                                        : 'border-[var(--ui-border)] hover:border-[var(--ui-secondary)]/50',
                                    isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                                ]">
                                <Icon icon="material-symbols:cloud-upload" width="32" height="32"
                                    class="mx-auto mb-2 text-[var(--ui-text-secondary)]" />
                                <p class="text-sm text-[var(--ui-text)]">
                                    파일을 드래그하여 업로드하거나 <span class="text-[var(--ui-secondary)] font-medium">클릭</span>하여 선택
                                </p>
                                <p class="text-xs text-[var(--ui-text-secondary)] mt-1">
                                    이미지 (JPG, PNG, GIF, WebP), PDF, 문서 (DOCX, TXT, MD) 지원 • 최대 10MB
                                </p>
                            </div>

                            <!-- 숨겨진 파일 입력 -->
                            <input ref="fileInputRef" type="file" multiple
                                accept="image/*,.pdf,.txt,.md,.docx,.xlsx,.csv" @change="handleFileSelect"
                                class="hidden" :disabled="isGenerating" />
                        </div>

                        <!-- 업로드된 파일 목록 -->
                        <div v-if="uploadedFiles.length > 0" class="space-y-3">
                            <h4 class="font-medium text-[var(--ui-text)] flex items-center gap-2">
                                <Icon icon="material-symbols:attach-file" width="18" height="18" />
                                첨부된 파일 ({{ uploadedFiles.length }}개)
                            </h4>
                            <div class="space-y-2 max-h-40 overflow-y-auto">
                                <div v-for="(file, index) in uploadedFiles" :key="`${file.name}-${file.size}`"
                                    class="flex items-start gap-3 p-3 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)]">

                                    <!-- 파일 미리보기/아이콘 -->
                                    <div class="flex-shrink-0">
                                        <!-- 이미지 미리보기 -->
                                        <div v-if="file.type.startsWith('image/')"
                                            class="w-12 h-12 rounded-lg overflow-hidden bg-[var(--ui-border)]">
                                            <img :src="getFilePreviewUrl(file)" :alt="file.name"
                                                class="w-full h-full object-cover" @error="handleImageError" />
                                        </div>
                                        <!-- 다른 파일 타입 아이콘 -->
                                        <div v-else
                                            class="w-12 h-12 rounded-lg bg-[var(--ui-secondary)]/10 flex items-center justify-center">
                                            <Icon :icon="getFileIcon(file)" width="20" height="20"
                                                class="text-[var(--ui-secondary)]" />
                                        </div>
                                    </div>

                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-medium text-[var(--ui-text)] truncate">
                                            {{ file.name }}
                                        </div>
                                        <div class="text-xs text-[var(--ui-text-secondary)] mt-1">
                                            {{ formatFileSize(file.size) }} • {{ getFileTypeLabel(file) }}
                                        </div>

                                        <!-- 이미지 파일의 경우 추가 정보 -->
                                        <div v-if="file.type.startsWith('image/')"
                                            class="text-xs text-[var(--ui-text-secondary)] mt-1">
                                            이미지가 AI 분석에 활용됩니다
                                        </div>

                                        <!-- 업로드 진행률 표시 (업로드 중일 때) -->
                                        <div v-if="uploadProgress[file.name] !== undefined" class="mt-2">
                                            <div class="flex items-center gap-2">
                                                <div class="flex-1 bg-[var(--ui-border)] rounded-full h-1">
                                                    <div class="bg-[var(--ui-secondary)] h-1 rounded-full transition-all"
                                                        :style="{ width: `${uploadProgress[file.name]}%` }">
                                                    </div>
                                                </div>
                                                <span class="text-xs text-[var(--ui-text-secondary)]">
                                                    {{ uploadProgress[file.name] }}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button @click="removeFile(index)" :disabled="isGenerating"
                                        class="p-1 rounded hover:bg-[var(--ui-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Icon icon="material-symbols:close" width="16" height="16"
                                            class="text-[var(--ui-text-secondary)]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 스트림 출력 영역 -->
                    <div v-if="isGenerating || streamOutput || isStreamCancelled" class="space-y-4">
                        <!-- 중단 상태 표시 -->
                        <div v-if="isStreamCancelled" class="space-y-4">
                            <div class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                <Icon icon="material-symbols:cancel" width="20" height="20" />
                                <span class="font-medium">위키 생성이 취소되었습니다</span>
                            </div>
                        </div>

                        <!-- 일반 상태 표시 -->
                        <div v-else-if="isGenerating || streamOutput" class="space-y-4">
                            <div class="flex items-center gap-2 text-[var(--ui-secondary)]">
                                <Icon icon="material-symbols:autorenew" width="20" height="20" class="animate-spin"
                                    v-if="isGenerating && !isStreamCancelled" />
                                <Icon icon="material-symbols:check-circle" width="20" height="20" v-else />
                                <span class="font-medium">
                                    {{ isGenerating && !isStreamCancelled ? 'AI가 위키를 생성하고 있습니다...' : '위키 생성 완료!' }}
                                </span>
                            </div>

                            <!-- 스트림 출력 -->
                            <div
                                class="bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)] overflow-hidden">
                                <!-- 헤더 -->
                                <div
                                    class="flex items-center gap-2 px-4 py-3 border-b border-[var(--ui-border)] bg-[var(--ui-bg)]">
                                    <Icon icon="ph:brain" width="18" height="18" class="text-[var(--ui-secondary)]" />
                                    <!-- <span class="text-sm font-medium text-[var(--ui-text)]">AI 생각 과정</span> -->
                                    <div v-if="isGenerating && !isStreamCancelled"
                                        class="ml-auto flex items-center gap-1">
                                        <div class="w-1.5 h-1.5 bg-[var(--ui-secondary)] rounded-full animate-pulse">
                                        </div>
                                        <div class="w-1.5 h-1.5 bg-[var(--ui-secondary)] rounded-full animate-pulse"
                                            style="animation-delay: 0.2s"></div>
                                        <div class="w-1.5 h-1.5 bg-[var(--ui-secondary)] rounded-full animate-pulse"
                                            style="animation-delay: 0.4s"></div>
                                    </div>
                                </div>

                                <!-- 콘텐츠 -->
                                <div ref="streamContainer" class="p-4 max-h-64 overflow-y-auto scroll-smooth">
                                    <!-- 로딩 상태 (스트림 시작 전) -->
                                    <div v-if="isGenerating && !streamOutput" class="space-y-3">
                                        <div class="flex items-start gap-3">
                                            <div
                                                class="w-2 h-2 bg-[var(--ui-secondary)] rounded-full mt-2 animate-pulse">
                                            </div>
                                            <div class="flex-1">
                                                <div class="text-sm text-[var(--ui-text-secondary)] italic">
                                                    AI가 생각하고 있습니다...
                                                </div>
                                                <div class="mt-1 space-y-1">
                                                    <div class="h-2 bg-[var(--ui-border)] rounded animate-pulse w-3/4">
                                                    </div>
                                                    <div class="h-2 bg-[var(--ui-border)] rounded animate-pulse w-1/2">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 스트림 출력 -->
                                    <div v-if="streamOutput" class="space-y-2">
                                        <div class="flex items-start gap-3">
                                            <div
                                                class="w-2 h-2 bg-[var(--ui-secondary)] rounded-full mt-2 flex-shrink-0">
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="text-xs text-[var(--ui-text-secondary)] mb-1">AI 응답</div>
                                                <div class="relative">
                                                    <pre
                                                        class="whitespace-pre-wrap text-sm text-[var(--ui-text-muted)] italic leading-relaxed break-words">{{ streamOutput }}</pre>
                                                    <!-- 타이핑 커서 (생성 중일 때만) -->
                                                    <span v-if="isGenerating && !isStreamCancelled"
                                                        class="typing-cursor">|</span>
                                                </div>
                                                <div v-if="isGenerating && !isStreamCancelled"
                                                    class="mt-2 flex items-center gap-1">
                                                    <div class="w-1 h-4 bg-[var(--ui-secondary)] animate-pulse"></div>
                                                    <span class="text-xs text-[var(--ui-text-secondary)]">생성 중...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 빈 상태 (모달 열렸지만 아직 생성 시작 안됨) -->
                                    <div v-if="!isGenerating && !streamOutput"
                                        class="flex items-center justify-center py-8">
                                        <div class="text-center text-[var(--ui-text-secondary)]">
                                            <Icon icon="ph:brain" width="32" height="32"
                                                class="mx-auto mb-2 opacity-50" />
                                            <p class="text-sm">AI가 대기 중입니다</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 파싱된 데이터 표시 -->
                        <div v-if="parsedWikiData"
                            class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <h4 class="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                                <Icon icon="material-symbols:check-circle" width="18" height="18" />
                                파싱된 위키 데이터
                            </h4>
                            <div class="space-y-2 text-sm">
                                <div v-if="parsedWikiData.title">
                                    <span class="font-medium text-green-700 dark:text-green-300">제목:</span>
                                    <span class="ml-2 text-green-800 dark:text-green-200">{{ parsedWikiData.title
                                    }}</span>
                                </div>
                                <div v-if="parsedWikiData.content">
                                    <span class="font-medium text-green-700 dark:text-green-300">내용 길이:</span>
                                    <span class="ml-2 text-green-800 dark:text-green-200">{{
                                        parsedWikiData.content.length }}자</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 푸터 -->
                <div class="flex items-center justify-between p-6 border-t border-[var(--ui-border)]
                     bg-[var(--ui-bg-elevated)] rounded-b-xl text-nowrap">
                    <!-- 중단된 상태일 때 -->
                    <template v-if="isStreamCancelled">
                        <div class="text-xs text-orange-600 dark:text-orange-400">
                            위키 생성이 취소되었습니다. 다시 시도하려면 새로 시작하세요.
                        </div>
                        <div class="flex items-center gap-3">
                            <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-[var(--ui-text-secondary)] 
                                       hover:text-[var(--ui-text)] transition-colors">
                                닫기
                            </button>
                            <button @click="resetToInitialState" class="px-6 py-2 bg-[var(--ui-secondary)] hover:bg-[var(--ui-secondary-elevated)] 
                                       text-white font-medium rounded-lg transition-colors
                                       flex items-center gap-2">
                                <Icon icon="material-symbols:refresh" width="16" height="16" />
                                처음으로
                            </button>
                        </div>
                    </template>

                    <!-- 일반 상태일 때 -->
                    <template v-else>
                        <div class="text-xs text-[var(--ui-text-secondary)] text-wrap">
                            {{ isGenerating ? '생성 중에는 창을 닫을 수 없습니다.' : '생성된 위키는 검토 후 수정할 수 있습니다.' }}
                        </div>
                        <div class="flex items-center gap-3">
                            <button @click="closeModal" :disabled="isGenerating && !isStreamCancelled" class="px-4 py-2 text-sm font-medium text-[var(--ui-text-secondary)] 
                                       hover:text-[var(--ui-text)] transition-colors
                                       disabled:opacity-50 disabled:cursor-not-allowed">
                                {{ parsedWikiData ? '나중에' : '취소' }}
                            </button>

                            <!-- 파싱된 데이터가 있을 때 적용 버튼 표시 -->
                            <button v-if="parsedWikiData" @click="applyParsedWiki" class="px-6 py-2 bg-green-600 hover:bg-green-700 
                                       text-white font-medium rounded-lg transition-colors
                                       flex items-center gap-2">
                                <Icon icon="material-symbols:check" width="16" height="16" />
                                위키 적용하기
                            </button>

                            <!-- 일반 생성 버튼 -->
                            <button v-else @click="generateWiki" :disabled="!instruction.trim() || isGenerating" class="px-6 py-2 bg-[var(--ui-secondary)] hover:bg-[var(--ui-secondary-elevated)] 
                                       text-white font-medium rounded-lg transition-colors
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       flex items-center gap-2">
                                <Icon v-if="isGenerating && !isStreamCancelled" icon="material-symbols:autorenew"
                                    width="16" height="16" class="animate-spin" />
                                <Icon v-else icon="jam:magic" width="16" height="16" />
                                {{ isGenerating && !isStreamCancelled ? '생성 중...' : '위키 생성' }}
                            </button>

                            <!-- 생성 중단 버튼 -->
                            <button v-if="isGenerating && !isStreamCancelled" @click="stopGeneration" class="px-4 py-2 bg-[var(--ui-danger)] hover:bg-red-700 
                                       text-white font-medium rounded-lg transition-colors
                                       flex items-center gap-2">
                                <Icon icon="material-symbols:stop" width="16" height="16" />
                                중단
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </Teleport>
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

/* 타이핑 커서 애니메이션 */
.typing-cursor {
    display: inline-block;
    color: var(--ui-secondary);
    font-weight: bold;
    animation: blink 1s infinite;
    margin-left: 1px;
    font-size: 1em;
    line-height: 1;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}

/* 부드러운 스크롤 */
.scroll-smooth {
    scroll-behavior: smooth;
}
</style>
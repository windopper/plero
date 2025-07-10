<script setup lang="ts">
import Container from '~/components/wiki/Container.vue';
import ProfileBadge from '~/components/common/ProfileBadge.vue';
// @ts-ignore
import { MdPreview } from 'md-editor-v3';
import { Icon } from '@iconify/vue';

const route = useRoute()
const id = route.params.id
const historyId = route.params.historyId

const { data: response } = await useFetch(`/api/wiki/${id}/history/${historyId}`)

// 변경 유형별 색상 및 아이콘 매핑
const getChangeTypeStyle = (changeType: string) => {
  const styles: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
    create: { 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'material-symbols:add-circle-outline',
      label: '생성'
    },
    edit: { 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'material-symbols:edit-outline',
      label: '편집'
    },
    revert: { 
      color: 'text-orange-600 dark:text-orange-400', 
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'material-symbols:undo',
      label: '되돌리기'
    },
    merge: { 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'material-symbols:merge',
      label: '병합'
    },
    delete: { 
      color: 'text-red-600 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'material-symbols:delete-outline',
      label: '삭제'
    },
    restore: { 
      color: 'text-teal-600 dark:text-teal-400', 
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      border: 'border-teal-200 dark:border-teal-800',
      icon: 'material-symbols:restore',
      label: '복원'
    }
  }
  return styles[changeType] || styles.edit
}

// 파일 크기를 읽기 쉬운 형식으로 변환
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 변경량 계산
const getChangeAmount = (added: number, removed: number) => {
  const net = added - removed
  return {
    net,
    isPositive: net > 0,
    isNeutral: net === 0
  }
}

// 상대 시간 포맷
const getRelativeTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return new Date(timestamp).toLocaleDateString('ko-KR')
}

// 이 버전으로 되돌리기
const revertToVersion = async () => {
    const result = await $fetch(`/api/wiki/${id}/history/${historyId}/revert`, {
        method: 'POST' as any
    });

    if (result.success) {
        navigateTo(`/wiki/${id}`)
    }
}

// 차이점 보기
const navigateToVersionDiff = () => {
    navigateTo(`/wiki/${id}/history/${historyId}/diff`)
}

// 현재 페이지로 이동
const navigateToCurrentPage = () => {
    navigateTo(`/wiki/${id}`)
}

// 히스토리 목록으로 이동
const navigateToHistoryList = () => {
    navigateTo(`/wiki/${id}/history`)
}

// 편집 페이지로 이동 (현재 버전 기준)
const navigateToEdit = () => {
    navigateTo(`/wiki/${id}/edit`)
}

const historyData = computed(() => response.value?.data)
</script>

<template>
    <div class="min-h-screen bg-[var(--ui-bg)]">
        <!-- 상단 헤더 -->
        <div class="sticky top-0 z-10 bg-[var(--ui-bg)] border-b-[1px] border-[var(--ui-border)]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4 flex-wrap gap-4">
                    <!-- 왼쪽: 브레드크럼 -->
                    <div class="flex items-center gap-2 text-sm">
                        <button 
                            @click="navigateToCurrentPage" 
                            class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group"
                        >
                            <Icon icon="material-symbols:arrow-back" width="20" height="20" class="group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium">위키</span>
                        </button>
                        <Icon icon="material-symbols:chevron-right" width="16" height="16" class="text-[var(--ui-border-accented)]" />
                        <button 
                            @click="navigateToHistoryList" 
                            class="text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 font-medium"
                        >
                            변경 기록
                        </button>
                        <Icon icon="material-symbols:chevron-right" width="16" height="16" class="text-[var(--ui-border-accented)]" />
                        <span class="text-[var(--ui-text)] font-semibold">
                            v{{ historyData?.version }} 보기
                        </span>
                    </div>
                    
                    <!-- 오른쪽: 액션 버튼들 -->
                    <div class="flex items-center gap-3">
                        <button 
                            @click="navigateToVersionDiff"
                            class="flex items-center gap-2 px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-muted)] transition-all duration-200"
                        >
                            <Icon icon="material-symbols:compare-arrows" width="16" height="16" />
                            <span class="text-sm font-medium">차이점 보기</span>
                        </button>
                        <button 
                            @click="revertToVersion"
                            class="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-200"
                        >
                            <Icon icon="ic:round-restore" width="16" height="16" />
                            <span class="text-sm font-medium">되돌리기</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <!-- 버전 정보 카드 -->
            <div v-if="historyData" class="mb-6">
                <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6">
                        <!-- 제목과 변경 유형 -->
                        <div class="flex items-start gap-4 mb-4">
                            <!-- 변경 유형 아이콘 -->
                            <div :class="[
                                'flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0',
                                getChangeTypeStyle(historyData.changeType).bg,
                                getChangeTypeStyle(historyData.changeType).border,
                                'border'
                            ]">
                                <Icon 
                                    :icon="getChangeTypeStyle(historyData.changeType).icon" 
                                    :class="getChangeTypeStyle(historyData.changeType).color"
                                    width="24" 
                                    height="24"
                                />
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-[var(--ui-text-highlighted)] mb-2">
                                    {{ historyData.title }}
                                </h1>
                                <div class="flex flex-wrap items-center gap-2 mb-3">
                                    <span :class="[
                                        'inline-flex items-center px-3 py-1 text-sm font-medium rounded-full',
                                        getChangeTypeStyle(historyData.changeType).bg,
                                        getChangeTypeStyle(historyData.changeType).color
                                    ]">
                                        {{ getChangeTypeStyle(historyData.changeType).label }}
                                    </span>
                                    <span class="inline-flex items-center px-3 py-1 text-sm bg-[var(--ui-bg-muted)] text-[var(--ui-text)] rounded-full">
                                        버전 {{ historyData.version }}
                                    </span>
                                    <!-- 마이너 수정 표시 -->
                                    <span v-if="historyData.isMinor" class="inline-flex items-center px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                                        사소한 수정
                                    </span>
                                </div>
                                
                                <!-- 변경 메시지 -->
                                <div v-if="historyData.changeMessage" class="mb-4">
                                    <div class="p-4 bg-[var(--ui-bg-muted)] rounded-lg border-l-4 border-[var(--ui-primary)]">
                                        <p class="text-sm text-[var(--ui-text)] leading-relaxed">{{ historyData.changeMessage }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 메타데이터 그리드 -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[var(--ui-bg-muted)] rounded-lg">
                            <!-- 작성자 정보 -->
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:person-outline" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <div class="min-w-0">
                                    <div class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">작성자</div>
                                    <div class="flex items-center gap-2">
                                        <ProfileBadge :id="historyData.changedBy" class="w-4 h-4" />
                                        <span class="text-sm font-medium text-[var(--ui-text)] truncate">{{ historyData.changedByName }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 변경 시간 -->
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:schedule-outline" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <div class="min-w-0">
                                    <div class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">시간</div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">{{ getRelativeTime(historyData.changedAt) }}</div>
                                </div>
                            </div>
                            
                            <!-- 변경량 -->
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:trending-up" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <div class="min-w-0">
                                    <div class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">변경량</div>
                                    <div class="flex items-center gap-1">
                                        <span :class="[
                                            'text-sm font-mono font-medium',
                                            getChangeAmount(historyData.addedCharacters, historyData.removedCharacters).isPositive 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : getChangeAmount(historyData.addedCharacters, historyData.removedCharacters).isNeutral
                                                ? 'text-[var(--ui-text-muted)]'
                                                : 'text-red-600 dark:text-red-400'
                                        ]">
                                            {{ getChangeAmount(historyData.addedCharacters, historyData.removedCharacters).net >= 0 ? '+' : '' }}{{ getChangeAmount(historyData.addedCharacters, historyData.removedCharacters).net }}
                                        </span>
                                        <span class="text-xs text-[var(--ui-text-muted)]">문자</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 파일 크기 -->
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:description-outline" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <div class="min-w-0">
                                    <div class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">크기</div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">{{ formatFileSize(historyData.contentSize) }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- 추가 정보 -->
                        <div class="mt-4 space-y-3">
                            <!-- 태그 -->
                            <div v-if="historyData.tags && historyData.tags.length > 0" class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:tag" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <div class="flex gap-2 flex-wrap">
                                    <span 
                                        v-for="tag in historyData.tags" 
                                        :key="tag"
                                        class="inline-flex items-center px-3 py-1 text-sm bg-[var(--ui-primary)] text-white rounded-full"
                                    >
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>

                            <!-- 이전 버전 정보 -->
                            <div v-if="historyData.previousVersion" class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:arrow-back" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <span class="text-sm text-[var(--ui-text-muted)]">이전 버전: v{{ historyData.previousVersion }}</span>
                            </div>

                            <!-- 해시 정보 -->
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-[var(--ui-primary)]/10 rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:fingerprint" class="text-[var(--ui-primary)]" width="16" height="16" />
                                </div>
                                <span class="text-sm font-mono text-[var(--ui-text-muted)] break-all">{{ historyData.contentHash }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 컨텐츠 영역 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div v-if="historyData" class="p-6">
                    <!-- 버전 표시 배너 -->
                    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                <Icon icon="material-symbols:history" class="text-blue-600 dark:text-blue-500" width="20" height="20" />
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-blue-700 dark:text-blue-600">
                                    히스토리 버전 {{ historyData.version }}
                                </p>
                                <p class="text-xs text-blue-600 dark:text-blue-400">
                                    {{ new Date(historyData.changedAt).toLocaleString('ko-KR') }}에 저장됨
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button 
                                @click="navigateToCurrentPage"
                                class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                            >
                                <Icon icon="material-symbols:visibility" width="16" height="16" />
                                최신 버전 보기
                            </button>
                            <button 
                                @click="navigateToEdit"
                                class="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--ui-bg)] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200"
                            >
                                <Icon icon="material-symbols:edit" width="16" height="16" />
                                편집하기
                            </button>
                        </div>
                    </div>

                    <!-- 마크다운 컨텐츠 -->
                    <div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                        <MdPreview :modelValue="historyData.content" class="break-words max-w-none" />
                    </div>
                </div>
                
                <!-- 로딩 상태 -->
                <div v-else class="p-6">
                    <div class="animate-pulse space-y-4">
                        <div class="h-8 bg-[var(--ui-bg-muted)] rounded w-3/4"></div>
                        <div class="h-4 bg-[var(--ui-bg-muted)] rounded"></div>
                        <div class="h-4 bg-[var(--ui-bg-muted)] rounded w-5/6"></div>
                        <div class="h-4 bg-[var(--ui-bg-muted)] rounded w-4/6"></div>
                        <div class="grid grid-cols-4 gap-4 mt-6">
                            <div class="h-16 bg-[var(--ui-bg-muted)] rounded"></div>
                            <div class="h-16 bg-[var(--ui-bg-muted)] rounded"></div>
                            <div class="h-16 bg-[var(--ui-bg-muted)] rounded"></div>
                            <div class="h-16 bg-[var(--ui-bg-muted)] rounded"></div>
                        </div>
                    </div>
                </div>
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
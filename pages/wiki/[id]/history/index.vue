<script setup lang="ts">
import ProfileBadge from '~/components/common/ProfileBadge.vue';
import RevertModal from '~/components/wiki/RevertModal.vue';
import { Icon } from '@iconify/vue';

const route = useRoute()
const id = route.params.id
const { data: response } = await useFetch(`/api/wiki/${id}/history`)

// 모달 상태 관리
const isRevertModalVisible = ref(false)
const selectedVersionForRevert = ref<any>(null)

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

// 이 버전에서 페이지 보기
const navigateToVersion = (historyId: string) => {
    navigateTo(`/wiki/${id}/history/${historyId}`)
}

// 버전 차이 보기
const navigateToVersionDiff = (historyId: string) => {
    navigateTo(`/wiki/${id}/history/${historyId}/diff`)
}

// 이 버전으로 되돌리기 (모달 표시)
const showRevertModal = (history: any) => {
    selectedVersionForRevert.value = history
    isRevertModalVisible.value = true
}

// 모달 닫기
const closeRevertModal = () => {
    isRevertModalVisible.value = false
    selectedVersionForRevert.value = null
}

// 되돌리기 확인
const confirmRevert = async () => {
    if (!selectedVersionForRevert.value) return
    
    try {
        const result = await $fetch(`/api/wiki/${id}/history/${selectedVersionForRevert.value.id}/revert`, {
            method: 'POST'
        });

        if (result.success) {
            closeRevertModal()
            navigateTo(`/wiki/${id}`)
        }
    } catch (error) {
        console.error('되돌리기 실패:', error)
        // 에러 처리 로직 추가 가능
    }
}

// 현재 위키로 돌아가기
const navigateToWiki = () => {
    navigateTo(`/wiki/${id}`)
}

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
                            @click="navigateToWiki" 
                            class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group"
                        >
                            <Icon icon="material-symbols:arrow-back" width="20" height="20" class="group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium">위키로 돌아가기</span>
                        </button>
                        <div class="ml-2 h-6 w-px bg-[var(--ui-border)]"></div>
                        <h1 class="ml-2 text-lg font-semibold text-[var(--ui-text)]">변경 기록</h1>
                    </div>
                    
                    <!-- 오른쪽: 통계 정보 -->
                    <div class="flex items-center gap-4 text-sm text-[var(--ui-text-muted)]">
                        <div class="flex items-center gap-2">
                            <Icon icon="material-symbols:history" width="16" height="16" />
                            <span>총 {{ response?.data?.length || 0 }}개 버전</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 메인 컨텐츠 -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <!-- 히스토리 목록 카드 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <!-- 히스토리 목록 -->
                <div v-if="response?.data && response.data.length > 0" class="divide-y divide-[var(--ui-border)]">
                    <div 
                        v-for="(history, index) in response.data" 
                        :key="history.id"
                        class="group hover:bg-[var(--ui-bg-muted)] transition-all duration-200"
                    >
                        <div class="p-4 sm:p-6">
                            <div class="flex items-start gap-4">
                                <!-- 변경 유형 아이콘 -->
                                <div :class="[
                                    'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                                    getChangeTypeStyle(history.changeType).bg,
                                    getChangeTypeStyle(history.changeType).border,
                                    'border'
                                ]">
                                    <Icon 
                                        :icon="getChangeTypeStyle(history.changeType).icon" 
                                        :class="getChangeTypeStyle(history.changeType).color"
                                        width="20" 
                                        height="20"
                                    />
                                </div>

                                <!-- 메인 내용 -->
                                <div class="flex-1 min-w-0">
                                    <!-- 상단: 제목과 버전 정보 -->
                                    <div class="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 class="font-semibold text-[var(--ui-text)] text-base truncate">
                                            {{ history.title }}
                                        </h3>
                                        <span :class="[
                                            'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                                            getChangeTypeStyle(history.changeType).bg,
                                            getChangeTypeStyle(history.changeType).color
                                        ]">
                                            {{ getChangeTypeStyle(history.changeType).label }}
                                        </span>
                                        <span class="inline-flex items-center px-2 py-1 text-xs bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] rounded-full">
                                            v{{ history.version }}
                                        </span>
                                        <!-- 마이너 수정 표시 -->
                                        <span v-if="history.isMinor" class="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                                            사소한 수정
                                        </span>
                                    </div>

                                    <!-- 변경 메시지 -->
                                    <div v-if="history.changeMessage" class="mb-3">
                                        <p class="text-sm text-[var(--ui-text-muted)] leading-relaxed">
                                            {{ history.changeMessage }}
                                        </p>
                                    </div>
                                    
                                    <!-- 메타데이터 -->
                                    <div class="flex flex-wrap items-center gap-4 text-sm text-[var(--ui-text-muted)]">
                                        <!-- 작성자 -->
                                        <div class="flex items-center gap-2">
                                            <ProfileBadge :id="history.changedBy" class="w-4 h-4" />
                                            <span>{{ history.changedByName }}</span>
                                        </div>
                                        
                                        <!-- 시간 -->
                                        <div class="flex items-center gap-1">
                                            <Icon icon="material-symbols:schedule-outline" width="14" height="14" />
                                            <span>{{ getRelativeTime(history.changedAt) }}</span>
                                        </div>
                                        
                                        <!-- 변경량 -->
                                        <div class="flex items-center gap-1">
                                            <Icon icon="material-symbols:trending-up" width="14" height="14" />
                                            <span :class="[
                                                'font-mono text-xs',
                                                getChangeAmount(history.addedCharacters, history.removedCharacters).isPositive 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : getChangeAmount(history.addedCharacters, history.removedCharacters).isNeutral
                                                    ? 'text-[var(--ui-text-muted)]'
                                                    : 'text-red-600 dark:text-red-400'
                                            ]">
                                                {{ getChangeAmount(history.addedCharacters, history.removedCharacters).net >= 0 ? '+' : '' }}{{ getChangeAmount(history.addedCharacters, history.removedCharacters).net }}
                                            </span>
                                            <span class="text-xs">문자</span>
                                        </div>

                                        <!-- 파일 크기 -->
                                        <div class="flex items-center gap-1">
                                            <Icon icon="material-symbols:description-outline" width="14" height="14" />
                                            <span class="text-xs">{{ formatFileSize(history.contentSize) }}</span>
                                        </div>

                                        <!-- 이전 버전 -->
                                        <div v-if="history.previousVersion" class="flex items-center gap-1">
                                            <Icon icon="material-symbols:arrow-back" width="14" height="14" />
                                            <span class="text-xs">v{{ history.previousVersion }}</span>
                                        </div>
                                    </div>

                                    <!-- 태그 -->
                                    <div v-if="history.tags && history.tags.length > 0" class="mt-3 flex items-center gap-2 flex-wrap">
                                        <Icon icon="material-symbols:tag" width="14" height="14" class="text-[var(--ui-text-muted)]" />
                                        <div class="flex gap-1 flex-wrap">
                                            <span 
                                                v-for="tag in history.tags.slice(0, 3)" 
                                                :key="tag"
                                                class="inline-flex items-center px-2 py-1 text-xs bg-[var(--ui-primary)] text-white rounded"
                                            >
                                                {{ tag }}
                                            </span>
                                            <span v-if="history.tags.length > 3" class="inline-flex items-center px-2 py-1 text-xs bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] rounded">
                                                +{{ history.tags.length - 3 }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 액션 버튼들 -->
                                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                                    <div class="flex items-center gap-1">
                                        <!-- 이 버전 보기 -->
                                        <button 
                                            @click="navigateToVersion(history.id)"
                                            class="p-2 hover:bg-[var(--ui-bg-elevated)] rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all duration-200 group"
                                            title="이 버전 보기"
                                        >
                                            <Icon icon="material-symbols:visibility-outline" width="16" height="16" class="group-hover:scale-110 transition-transform duration-200" />
                                        </button>
                                        
                                        <!-- 차이점 보기 -->
                                        <button 
                                            @click="navigateToVersionDiff(history.id)"
                                            class="p-2 hover:bg-[var(--ui-bg-elevated)] rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all duration-200 group"
                                            title="이전 버전과 차이점 보기"
                                        >
                                            <Icon icon="material-symbols:compare-arrows" width="16" height="16" class="group-hover:scale-110 transition-transform duration-200" />
                                        </button>
                                        
                                        <!-- 이 버전으로 되돌리기 -->
                                        <button 
                                            @click="showRevertModal(history)"
                                            class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[var(--ui-text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                                            title="이 버전으로 되돌리기"
                                        >
                                            <Icon icon="ic:round-restore" width="16" height="16" class="group-hover:scale-110 transition-transform duration-200" />
                                        </button>
                                    </div>

                                    <!-- 해시 정보 (데스크톱만) -->
                                    <div class="hidden lg:block">
                                        <span class="text-xs font-mono text-[var(--ui-text-toned)] bg-[var(--ui-bg-muted)] px-2 py-1 rounded">
                                            {{ history.contentHash.slice(0, 8) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 로딩 상태 -->
                <div v-else-if="!response?.data" class="p-6">
                    <div class="space-y-4">
                        <div v-for="i in 5" :key="i" class="flex items-start gap-4 animate-pulse">
                            <div class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-5 bg-[var(--ui-bg-muted)] rounded w-3/4"></div>
                                <div class="h-4 bg-[var(--ui-bg-muted)] rounded w-1/2"></div>
                                <div class="flex gap-4">
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-20"></div>
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-16"></div>
                                    <div class="h-3 bg-[var(--ui-bg-muted)] rounded w-24"></div>
                                </div>
                            </div>
                            <div class="flex gap-1">
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                                <div class="w-8 h-8 bg-[var(--ui-bg-muted)] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 빈 상태 -->
                <div v-else class="p-12 text-center">
                    <div class="w-16 h-16 bg-[var(--ui-bg-muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="material-symbols:history" class="text-[var(--ui-text-muted)]" width="32" height="32" />
                    </div>
                    <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">변경 기록이 없습니다</h3>
                    <p class="text-sm text-[var(--ui-text-muted)] max-w-md mx-auto">
                        아직 이 문서에 대한 변경 기록이 없습니다. 문서를 편집하면 변경 기록이 생성됩니다.
                    </p>
                </div>
            </div>
        </div>

        <!-- 되돌리기 확인 모달 -->
        <RevertModal 
            :is-visible="isRevertModalVisible"
            :version-info="selectedVersionForRevert"
            @close="closeRevertModal"
            @confirm="confirmRevert"
        />
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
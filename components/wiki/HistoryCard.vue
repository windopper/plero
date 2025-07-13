<script setup lang="ts">
import ProfileBadge from '~/components/common/ProfileBadge.vue';
import { Icon } from '@iconify/vue';
import type { WikiHistory } from '~/server/db/schema';

interface Props {
  history: WikiHistory;
  wikiId: string | string[];
  hideActionButtons?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'view-version': [historyId: string];
  'view-diff': [historyId: string];
  'revert': [history: WikiHistory];
  'click': [history: WikiHistory];
}>();

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

// 이벤트 핸들러
const handleViewVersion = () => {
  emit('view-version', props.history.id)
}

const handleViewDiff = () => {
  emit('view-diff', props.history.id)
}

const handleRevert = () => {
  emit('revert', props.history)
}

const handleClick = () => {
  emit('click', props.history)
}
</script>

<template>
  <div @click="handleClick" class="group hover:bg-[var(--ui-bg-muted)] transition-all duration-200">
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

          <!-- 태그 변경 사항 -->
          <div v-if="(history.addedTags && history.addedTags.length > 0) || (history.removedTags && history.removedTags.length > 0)" class="mt-3 space-y-2">
            <!-- 추가된 태그 -->
            <div v-if="history.addedTags && history.addedTags.length > 0" class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-1">
                <Icon icon="material-symbols:add-circle-outline" width="14" height="14" class="text-green-600 dark:text-green-400" />
                <span class="text-xs text-green-600 dark:text-green-400 font-medium">추가된 태그:</span>
              </div>
              <div class="flex gap-1 flex-wrap">
                <span 
                  v-for="tag in history.addedTags.slice(0, 3)" 
                  :key="tag"
                  class="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800"
                >
                  {{ tag }}
                </span>
                <span v-if="history.addedTags.length > 3" class="inline-flex items-center px-2 py-1 text-xs bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-500 rounded">
                  +{{ history.addedTags.length - 3 }}
                </span>
              </div>
            </div>

            <!-- 제거된 태그 -->
            <div v-if="history.removedTags && history.removedTags.length > 0" class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-1">
                <Icon icon="clarity:remove-solid" width="14" height="14" class="text-red-600 dark:text-red-400" />
                <span class="text-xs text-red-600 dark:text-red-400 font-medium">제거된 태그:</span>
              </div>
              <div class="flex gap-1 flex-wrap">
                <span 
                  v-for="tag in history.removedTags.slice(0, 3)" 
                  :key="tag"
                  class="inline-flex items-center px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-800 line-through"
                >
                  {{ tag }}
                </span>
                <span v-if="history.removedTags.length > 3" class="inline-flex items-center px-2 py-1 text-xs bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-500 rounded">
                  +{{ history.removedTags.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 액션 버튼들 -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
          <div v-if="!hideActionButtons" class="flex items-center gap-1">
            <!-- 이 버전 보기 -->
            <button 
              @click="handleViewVersion"
              class="p-2 hover:bg-[var(--ui-bg-elevated)] rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all duration-200 group"
              title="이 버전 보기"
            >
              <Icon icon="material-symbols:visibility-outline" width="16" height="16" class="group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            <!-- 차이점 보기 -->
            <button 
              @click="handleViewDiff"
              class="p-2 hover:bg-[var(--ui-bg-elevated)] rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all duration-200 group"
              title="이전 버전과 차이점 보기"
            >
              <Icon icon="material-symbols:compare-arrows" width="16" height="16" class="group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            <!-- 이 버전으로 되돌리기 -->
            <button 
              @click="handleRevert"
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
</template>

<style scoped>
/* 포커스 상태 개선 */
button:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
</style> 
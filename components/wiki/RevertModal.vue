<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface RevertModalProps {
  isVisible: boolean;
  versionInfo: {
    version: number;
    title: string;
    changedBy: string;
    changedByName: string;
    changedAt: number;
    changeMessage?: string;
  } | null;
}

interface RevertModalEmits {
  (e: 'close'): void;
  (e: 'confirm'): void;
}

const props = defineProps<RevertModalProps>();
const emit = defineEmits<RevertModalEmits>();

// 모달 닫기
const closeModal = () => {
  emit('close');
};

// 되돌리기 확인
const confirmRevert = () => {
  emit('confirm');
};

// ESC 키로 모달 닫기
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

// 모달이 보일 때 키보드 이벤트 리스너 추가
watch(() => props.isVisible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleKeydown);
    // 스크롤 방지
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  }
});

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <!-- 모달 오버레이 -->
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isVisible" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- 배경 오버레이 -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- 모달 컨텐츠 -->
        <Transition
          enter-active-class="duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div 
            v-if="isVisible"
            class="relative bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-2xl max-w-md w-full mx-auto"
          >
            <!-- 헤더 -->
            <div class="flex items-center justify-between p-6 border-b border-[var(--ui-border)]">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <Icon 
                    icon="ic:round-restore" 
                    class="text-orange-600 dark:text-orange-400" 
                    width="20" 
                    height="20" 
                  />
                </div>
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">
                  버전 되돌리기
                </h3>
              </div>
              <button 
                @click="closeModal"
                class="p-1 hover:bg-[var(--ui-bg-muted)] rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200"
              >
                <Icon icon="material-symbols:close" width="20" height="20" />
              </button>
            </div>

            <!-- 컨텐츠 -->
            <div class="p-6">
              <div v-if="versionInfo" class="space-y-4">
                <!-- 버전 정보 -->
                <div class="bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] rounded-lg p-4">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-[var(--ui-text)]">{{ versionInfo.title }}</h4>
                      <span class="inline-flex items-center px-2 py-1 text-xs bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] rounded-full">
                        v{{ versionInfo.version }}
                      </span>
                    </div>
                    
                    <div class="text-sm text-[var(--ui-text-muted)] space-y-1">
                      <div class="flex items-center gap-2">
                        <Icon icon="material-symbols:person-outline" width="14" height="14" />
                        <span>{{ versionInfo.changedByName }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Icon icon="material-symbols:schedule-outline" width="14" height="14" />
                        <span>{{ getRelativeTime(versionInfo.changedAt) }}</span>
                      </div>
                    </div>
                    
                    <div v-if="versionInfo.changeMessage" class="mt-3 pt-3 border-t border-[var(--ui-border)]">
                      <p class="text-sm text-[var(--ui-text-muted)] italic">
                        "{{ versionInfo.changeMessage }}"
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 경고 메시지 -->
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <Icon 
                      icon="material-symbols:warning-outline" 
                      class="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" 
                      width="18" 
                      height="18" 
                    />
                    <div class="space-y-2">
                      <h5 class="font-medium text-yellow-800 dark:text-yellow-200">
                        주의사항
                      </h5>
                      <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• 현재 버전의 모든 변경사항이 되돌려집니다</li>
                        <li>• 이 작업은 새로운 버전을 생성합니다</li>
                        <li>• 되돌린 후에도 기존 버전들은 히스토리에 남아있습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- 확인 메시지 -->
                <div class="text-center">
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    정말로 이 버전으로 되돌리시겠습니까?
                  </p>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
              <button 
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] bg-transparent hover:bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg transition-all duration-200"
              >
                취소
              </button>
              <button 
                @click="confirmRevert"
                class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Icon icon="ic:round-restore" width="16" height="16" />
                되돌리기
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 추가적인 스타일링은 필요시 여기에 작성 */
</style>

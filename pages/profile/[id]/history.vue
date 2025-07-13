<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';
import type { WikiHistory } from '~/server/db/schema';
import HistoryCard from '~/components/wiki/HistoryCard.vue';

const route = useRoute();

// 반응형 상태
const limit = ref(30)
const isLoading = ref(false)
const exclusiveStartKey = ref<string | undefined>(undefined)
const allHistories = ref<WikiHistory[]>([])

// API 데이터 가져오기 (초기 로드)
const { data: historyListResponse, pending, refresh } = await useFetch(`/api/user/${route.params.id}/history`, {
  query: computed(() => ({
    exclusiveStartKey: undefined, // 초기 로드는 항상 처음부터
    limit: limit.value,
  }))
})

// 데이터 변경 감지하여 누적
watch(historyListResponse, (newResponse) => {
  if (newResponse?.data) {
    // 새로운 로드인 경우 교체
    allHistories.value = newResponse.data
    // 페이지네이션 정보 업데이트
    if (newResponse.pagination?.lastEvaluatedKey) {
      exclusiveStartKey.value = newResponse.pagination.lastEvaluatedKey
    }
  }
}, { immediate: true })

// 계산된 속성들
const history = computed(() => {
  return allHistories.value
})

const totalCount = computed(() => {
  return allHistories.value.length
})

const pagination = computed(() => {
  return historyListResponse.value?.pagination || {
    limit: 30,
    hasMore: false,
    lastEvaluatedKey: undefined
  }
})

// 더 보기 함수 (별도 $fetch 사용)
const loadMore = async () => {
  if (!pagination.value.hasMore || !exclusiveStartKey.value || isLoading.value) return
  
  isLoading.value = true
  try {
    const response = await $fetch(`/api/user/${route.params.id}/history`, {
      query: {
        exclusiveStartKey: exclusiveStartKey.value,
        limit: limit.value,
      }
    })
    
    if (response?.data) {
      // 기존 결과에 추가
      allHistories.value.push(...response.data)
      
      // 페이지네이션 정보 업데이트
      if (response.pagination?.lastEvaluatedKey) {
        exclusiveStartKey.value = response.pagination.lastEvaluatedKey
      } else {
        exclusiveStartKey.value = undefined
      }
    }
  } catch (error) {
    console.error('더 보기 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <ContentHeader>
    <NavigationTitle title="히스토리" backButton :navigatePath="`/profile/${route.params.id}`" />
  </ContentHeader>

  <ContentBody>
    <!-- 헤더 -->
    <div class="mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold text-[var(--ui-text)] mb-1">사용자 히스토리</h2>
          <p class="text-sm text-[var(--ui-text-muted)]">
            총 {{ totalCount }}개의 히스토리{{ pagination.hasMore ? ' (더 많은 결과가 있습니다)' : '' }}
          </p>
        </div>
        <button @click="refresh()"
          class="p-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors"
          :disabled="pending">
          <Icon icon="tabler:refresh" class="w-5 h-5" :class="{ 'animate-spin': pending }" />
        </button>
      </div>
    </div>

    <!-- 로딩 스켈레톤 -->
    <div v-if="pending" class="space-y-4">
      <div v-for="n in 5" :key="n" class="animate-pulse">
        <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-4">
          <div class="h-5 bg-[var(--ui-bg-accented)] rounded mb-2"></div>
          <div class="h-4 bg-[var(--ui-bg-accented)] rounded mb-2 w-3/4"></div>
          <div class="h-3 bg-[var(--ui-bg-accented)] rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- 히스토리 없음 -->
    <div v-else-if="history.length === 0" class="text-center py-12">
      <Icon icon="tabler:history" class="w-16 h-16 text-[var(--ui-text-muted)] mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">히스토리가 없습니다</h3>
      <p class="text-[var(--ui-text-muted)]">아직 이 사용자의 편집 히스토리가 없습니다.</p>
    </div>

    <!-- 히스토리 목록 -->
    <div v-else class="space-y-4">
      <HistoryCard v-for="h in history" :key="h.id" :history="h" :wikiId="h.wikiId" hideActionButtons
        @click="navigateTo(`/wiki/${h.wikiId}`)" />
    </div>

    <!-- 더 보기 버튼 -->
    <div v-if="history.length > 0 && pagination.hasMore" class="mt-8 flex justify-center">
      <button @click="loadMore" :disabled="isLoading || pending"
        class="px-6 py-3 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <Icon v-if="isLoading" icon="tabler:loader-2" class="w-4 h-4 inline mr-2 animate-spin" />
        <Icon v-else icon="tabler:chevron-down" class="w-4 h-4 inline mr-2" />
        {{ isLoading ? '로딩 중...' : '더 보기' }}
      </button>
    </div>
  </ContentBody>
</template>
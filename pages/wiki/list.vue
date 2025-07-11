<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'

// 페이지 메타 설정
definePageMeta({
  title: '위키 목록'
})

// 반응형 상태
const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(12)
const isLoading = ref(false)

// 디바운싱을 위한 타이머
let debounceTimer: NodeJS.Timeout | null = null
const debouncedSearch = ref('')

// 검색어 디바운싱
watch(searchQuery, (newVal) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
    currentPage.value = 1 // 검색 시 첫 페이지로 리셋
  }, 300)
})

// API 데이터 가져오기
const { data: wikiListResponse, pending, refresh } = await useFetch('/api/wiki/list', {
  query: computed(() => ({
    query: debouncedSearch.value,
    page: currentPage.value,
    limit: limit.value,
  })),
  watch: [debouncedSearch, currentPage, limit]
})

// 계산된 속성들
const wikis = computed(() => {
  return wikiListResponse.value?.data?.wikis || []
})

const pagination = computed(() => {
  return wikiListResponse.value?.pagination || {
    currentPage: 1,
    limit: 12,
    totalCount: 0,
    hasMore: false,
    totalPages: 1
  }
})

// 페이지네이션 함수들
const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (pagination.value.hasMore) {
    currentPage.value += 1
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

// 날짜 포맷팅
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 페이지 번호 배열 생성 (5개씩)
const pageNumbers = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.currentPage
  const pages = []
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  // 앞쪽에 공간이 있으면 뒤로 확장
  if (end - start < 4 && total > 5) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else if (end === total) {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- 헤더 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-[var(--ui-text)] mb-2">위키 목록</h1>
      <p class="text-[var(--ui-text-muted)]">모든 위키 문서를 탐색해보세요</p>
    </div>

    <!-- 검색 및 필터 -->
    <div class="mb-6">
      <div class="flex gap-4 items-center">
        <div class="relative flex-1 max-w-md">
          <Icon icon="tabler:search" class="absolute left-3 top-3 text-[var(--ui-text-muted)] w-5 h-5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="위키 검색..."
            class="w-full pl-10 pr-4 py-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:outline-none focus:border-[var(--ui-primary)] transition-colors"
          />
        </div>
        <button
          @click="refresh()"
          class="p-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors"
          :disabled="pending"
        >
          <Icon icon="tabler:refresh" class="w-5 h-5" :class="{ 'animate-spin': pending }" />
        </button>
      </div>
    </div>

    <!-- 결과 개수 -->
    <div class="mb-4 text-sm text-[var(--ui-text-muted)]">
      <span v-if="debouncedSearch">
        "{{ debouncedSearch }}"에 대한 검색 결과: {{ pagination.totalCount }}개
      </span>
      <span v-else>
        총 {{ pagination.totalCount }}개의 위키
      </span>
    </div>

    <!-- 위키 그리드 -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 로딩 스켈레톤 -->
      <div v-for="n in 6" :key="n" class="animate-pulse">
        <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
          <div class="h-6 bg-[var(--ui-bg-accented)] rounded mb-2"></div>
          <div class="h-4 bg-[var(--ui-bg-accented)] rounded mb-4 w-3/4"></div>
          <div class="h-3 bg-[var(--ui-bg-accented)] rounded mb-1"></div>
          <div class="h-3 bg-[var(--ui-bg-accented)] rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="wikis.length === 0" class="text-center py-12">
      <Icon icon="tabler:file-search" class="w-16 h-16 text-[var(--ui-text-muted)] mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">
        {{ debouncedSearch ? '검색 결과가 없습니다' : '아직 위키가 없습니다' }}
      </h3>
      <p class="text-[var(--ui-text-muted)] mb-6">
        {{ debouncedSearch ? '다른 검색어를 시도해보세요' : '첫 번째 위키를 만들어보세요' }}
      </p>
      <button
        @click="navigateTo('/wiki/create')"
        class="bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] px-6 py-2 rounded-lg hover:bg-[var(--ui-primary-dark)] transition-colors"
      >
        <Icon icon="tabler:plus" class="w-4 h-4 inline mr-2" />
        새 위키 만들기
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="wiki in wikis"
        :key="wiki.id"
        class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6 hover:border-[var(--ui-border-accented)] hover:shadow-sm transition-all cursor-pointer"
        @click="navigateTo(`/wiki/${wiki.id}`)"
      >
        <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2 line-clamp-2">
          {{ wiki.title }}
        </h3>
        <p class="text-sm text-[var(--ui-text-muted)] mb-4 line-clamp-3">
          {{ wiki.content.replace(/[#*`]/g, '').substring(0, 100) }}{{ wiki.content.length > 100 ? '...' : '' }}
        </p>
        <div class="flex justify-between items-center text-xs text-[var(--ui-text-muted)]">
          <div class="flex flex-col">
            <span>작성자: {{ wiki.authorName }}</span>
            <span>{{ formatDate(wiki.createdAt) }}</span>
          </div>
          <div class="flex flex-col text-right">
            <span>v{{ wiki.version }}</span>
            <span>{{ formatDate(wiki.updatedAt) }}</span>
          </div>
        </div>
        <!-- 태그들 -->
        <div v-if="wiki.tags.length > 0" class="flex flex-wrap gap-1 mt-3">
          <span
            v-for="tag in wiki.tags.slice(0, 3)"
            :key="tag"
            class="px-2 py-1 text-xs bg-[var(--ui-primary-muted)] text-[var(--ui-primary)] rounded"
          >
            {{ tag }}
          </span>
          <span v-if="wiki.tags.length > 3" class="px-2 py-1 text-xs text-[var(--ui-text-muted)]">
            +{{ wiki.tags.length - 3 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="wikis.length > 0 && pagination.totalPages > 1" class="mt-8 flex justify-center">
      <nav class="flex items-center gap-2">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="p-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="tabler:chevron-left" class="w-4 h-4" />
        </button>
        
        <div v-if="pageNumbers[0] > 1" class="flex items-center gap-2">
          <button
            @click="goToPage(1)"
            class="px-3 py-1 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors"
          >
            1
          </button>
          <span v-if="pageNumbers[0] > 2" class="text-[var(--ui-text-muted)]">...</span>
        </div>
        
        <button
          v-for="page in pageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-1 border rounded-lg transition-colors',
            page === currentPage
              ? 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] border-[var(--ui-primary)]'
              : 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)]'
          ]"
        >
          {{ page }}
        </button>
        
        <div v-if="pageNumbers[pageNumbers.length - 1] < pagination.totalPages" class="flex items-center gap-2">
          <span v-if="pageNumbers[pageNumbers.length - 1] < pagination.totalPages - 1" class="text-[var(--ui-text-muted)]">...</span>
          <button
            @click="goToPage(pagination.totalPages)"
            class="px-3 py-1 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] transition-colors"
          >
            {{ pagination.totalPages }}
          </button>
        </div>
        
        <button
          @click="nextPage"
          :disabled="!pagination.hasMore"
          class="p-2 border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-accented)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="tabler:chevron-right" class="w-4 h-4" />
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 
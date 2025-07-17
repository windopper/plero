<script setup>
import TablerSearch from '../icon/TablerSearch.vue';
import { Icon } from '@iconify/vue';

const isOpen = ref(false);
const search = ref('');
const debouncedSearch = ref('');
const wikiList = ref([]);
const userList = ref([]);
const isLoading = ref(false);
const searchInput = ref(null);
const selectedIndex = ref(-1);

// 디바운싱을 위한 타이머
let debounceTimer = null;

// 키보드 단축키 (Ctrl+K 또는 Cmd+K)
const handleKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen.value = true;
        nextTick(() => {
            searchInput.value?.focus();
        });
    }
    if (e.key === 'Escape') {
        isOpen.value = false;
    }
};

// 검색 결과 탐색을 위한 키보드 이벤트
const handleSearchKeydown = (e) => {
    const totalItems = wikiList.value.length + userList.value.length + (wikiList.value.length === 0 ? 1 : 0); // 새 문서 생성 버튼 포함
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
    } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
        e.preventDefault();
        handleEnterSelection();
    }
};

const handleEnterSelection = () => {
    const wikiCount = wikiList.value.length;
    const createButtonIndex = wikiCount === 0 ? 0 : -1;
    
    if (selectedIndex.value < wikiCount) {
        // 위키 선택
        const wiki = wikiList.value[selectedIndex.value];
        navigateTo(`/wiki/${wiki.id}`);
        isOpen.value = false;
    } else if (createButtonIndex >= 0 && selectedIndex.value === createButtonIndex) {
        // 새 문서 생성
        createWiki();
    } else {
        // 사용자 선택
        const userIndex = selectedIndex.value - wikiCount - (createButtonIndex >= 0 ? 1 : 0);
        const user = userList.value[userIndex];
        if (user) {
            navigateTo(`/profile/${user.id}`);
            isOpen.value = false;
        }
    }
};

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});

// search 값이 변경될 때마다 디바운싱 적용
watch(search, (newVal) => {
    console.log(newVal)
    selectedIndex.value = -1; // 검색어가 바뀌면 선택 인덱스 초기화
    
    // 기존 타이머가 있다면 클리어
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    if (!newVal.trim()) {
        wikiList.value = [];
        userList.value = [];
        isLoading.value = false;
        return;
    }
    
    isLoading.value = true;
    
    // 500ms 후에 debouncedSearch 업데이트
    debounceTimer = setTimeout(() => {
        debouncedSearch.value = newVal;
        handleSearch();
    }, 300);
});

// 검색 모달이 열릴 때 포커스
watch(isOpen, (newVal) => {
    if (newVal) {
        nextTick(() => {
            searchInput.value?.focus();
        });
    } else {
        search.value = '';
        selectedIndex.value = -1;
    }
});

const handleSearch = async () => {
    if (!debouncedSearch.value.trim()) {
        isLoading.value = false;
        return;
    }
    
    try {
        const [{ data: wikiListResponse }, { data: userListResponse }] = await Promise.all([
            $fetch('/api/wiki/list', {
                query: {
                    query: debouncedSearch.value,
                    limit: 5,
                }
            }),
            $fetch('/api/user/list', {
                query: {
                    query: debouncedSearch.value,
                    limit: 3,
                }
            })
        ]);
        console.log(wikiListResponse, userListResponse)
        wikiList.value = wikiListResponse || [];
        userList.value = userListResponse || [];
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        wikiList.value = [];
        userList.value = [];
    } finally {
        isLoading.value = false;
    }
};

const createWiki = () => {
    navigateTo(`/wiki/create`);
    isOpen.value = false;
};

const getItemClasses = (index) => {
    const isSelected = selectedIndex.value === index;
    return [
        'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150',
        isSelected 
            ? 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]' 
            : 'hover:bg-[var(--ui-bg-accented)]'
    ];
};
</script>

<template>
    <!-- 검색 버튼 -->
    <button 
        @click="isOpen = !isOpen" 
        class="group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[var(--ui-bg-accented)] border border-[var(--ui-border)] cursor-pointer"
        title="검색 (Ctrl+K)"
    >
        <TablerSearch class="text-[var(--ui-text-muted)] w-4 h-4" />
        <span class="text-[var(--ui-text-muted)] text-sm hidden sm:block">검색...</span>
        <kbd class="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded">
            <span>⌘</span>
            <span>K</span>
        </kbd>
    </button>

    <!-- 검색 모달 -->
    <teleport to="body">
        <transition 
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div 
                v-if="isOpen"
                @click="isOpen = false" 
                class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]"
            >
                <div 
                    @click.stop 
                    class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
                >
                    <!-- 검색 입력 -->
                    <div class="flex items-center gap-3 p-4 border-b border-[var(--ui-border)]">
                        <TablerSearch class="text-[var(--ui-text-muted)] w-5 h-5 flex-shrink-0" />
                        <input 
                            ref="searchInput"
                            v-bind:value="search"
                            @input="(event) => (search = event.target.value)" 
                            @keydown="handleSearchKeydown"
                            type="text" 
                            placeholder="위키나 사용자를 검색하세요..." 
                            class="flex-1 text-[var(--ui-text)] bg-transparent outline-none placeholder-[var(--ui-text-muted)]"
                        />
                        <kbd class="px-2 py-1 text-xs bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded text-[var(--ui-text-muted)]">
                            ESC
                        </kbd>
                    </div>

                    <!-- 검색 결과 -->
                    <div class="max-h-96 overflow-y-auto">
                        <!-- 로딩 상태 -->
                        <div v-if="isLoading" class="flex items-center justify-center p-8">
                            <Icon icon="line-md:loading-loop" class="w-6 h-6 text-[var(--ui-primary)]" />
                            <span class="ml-2 text-[var(--ui-text-muted)]">검색 중...</span>
                        </div>

                        <!-- 검색어가 없을 때 -->
                        <div v-else-if="!search.trim()" class="p-8 text-center">
                            <Icon icon="solar:magnifer-linear" class="w-12 h-12 text-[var(--ui-text-muted)] mx-auto mb-3" />
                            <p class="text-[var(--ui-text-muted)]">검색어를 입력해주세요</p>
                            <p class="text-sm text-[var(--ui-text-dimmed)] mt-1">위키 문서나 사용자를 찾을 수 있습니다</p>
                        </div>

                        <!-- 검색 결과가 있을 때 -->
                        <div v-else-if="wikiList.length > 0 || userList.length > 0" class="p-2">
                            <!-- 위키 문서 결과 -->
                            <div v-if="wikiList.length > 0" class="mb-2">
                                <div class="px-3 py-2 text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">
                                    위키 문서
                                </div>
                                <div 
                                    v-for="(item, index) in wikiList" 
                                    :key="`wiki-${item.id}`"
                                    @click="navigateTo(`/wiki/${item.id}`); isOpen = false"
                                    :class="getItemClasses(index)"
                                >
                                    <Icon icon="solar:document-bold-duotone" class="w-5 h-5 text-[var(--ui-primary)] group-hover:scale-110 transition-transform" />
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium truncate">{{ item.title }}</div>
                                        <div v-if="item.description" class="text-sm opacity-75 truncate">{{ item.description }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 사용자 결과 -->
                            <div v-if="userList.length > 0">
                                <div class="px-3 py-2 text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wide">
                                    사용자
                                </div>
                                <div 
                                    v-for="(item, index) in userList" 
                                    :key="`user-${item.id}`"
                                    @click="navigateTo(`/profile/${item.id}`); isOpen = false"
                                    :class="getItemClasses(wikiList.length + index)"
                                >
                                    <Icon icon="solar:user-bold-duotone" class="w-5 h-5 text-[var(--ui-secondary)] group-hover:scale-110 transition-transform" />
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium truncate">{{ item.name }}</div>
                                        <div v-if="item.email" class="text-sm opacity-75 truncate">{{ item.email }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 검색 결과가 없을 때 -->
                        <div v-else class="p-2">
                            <div class="text-center py-6">
                                <Icon icon="solar:magnifer-broken" class="w-12 h-12 text-[var(--ui-text-muted)] mx-auto mb-3" />
                                <p class="text-[var(--ui-text-muted)] mb-4">
                                    "<span class="font-medium">{{ search }}</span>"에 대한 검색 결과가 없습니다
                                </p>
                                <button 
                                    @click="createWiki"
                                    :class="getItemClasses(0)"
                                    class="mx-auto"
                                >
                                    <Icon icon="solar:document-add-bold-duotone" class="w-5 h-5 text-[var(--ui-primary)] group-hover:scale-110 transition-transform" />
                                    <span class="font-medium">새 위키 문서 생성</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 하단 힌트 -->
                    <div class="border-t border-[var(--ui-border)] p-3 bg-[var(--ui-bg-muted)]">
                        <div class="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                            <div class="flex items-center gap-4">
                                <span class="flex items-center gap-1">
                                    <kbd class="px-1.5 py-0.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded">↑↓</kbd>
                                    탐색
                                </span>
                                <span class="flex items-center gap-1">
                                    <kbd class="px-1.5 py-0.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded">Enter</kbd>
                                    선택
                                </span>
                            </div>
                            <span>{{ wikiList.length + userList.length }}개 결과</span>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<style scoped>
/* 커스텀 스크롤바 */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: var(--ui-bg-muted);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--ui-border-accented);
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: var(--ui-text-muted);
}
</style>
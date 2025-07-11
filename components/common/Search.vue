<script setup>
import TablerSearch from '../icon/TablerSearch.vue';
import { Icon } from '@iconify/vue';
const isOpen = ref(false);
const search = ref('');
const debouncedSearch = ref('');

// 디바운싱을 위한 타이머
let debounceTimer = null;

// search 값이 변경될 때마다 디바운싱 적용
watch(search, (newVal) => {
    // 기존 타이머가 있다면 클리어
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // 500ms 후에 debouncedSearch 업데이트
    debounceTimer = setTimeout(() => {
        debouncedSearch.value = newVal;
    }, 500);
});

const { data: wikiListResponse } = await useFetch('/api/wiki/list', {
    query: {
        query: debouncedSearch,
        page: 1,
        limit: 10,
    }
})

const wikiList = computed(() => {
    return wikiListResponse.value?.data?.wikis || []
})

const createWiki = () => {
    navigateTo(`/wiki/${search.value}/edit`)
    isOpen.value = false
}
</script>

<template>
    <button @click="isOpen = !isOpen" class="p-2 cursor-pointer rounded-md hover:bg-[var(--ui-bg-accented)]">
        <TablerSearch class="text-[var(--ui-text)] w-5 h-5" />
    </button>
    <teleport to="body">
        <transition name="fade">
            <div @click="isOpen = false" v-if="isOpen"
                class="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex justify-center items-center">
                <div @click.stop class="bg-[var(--ui-bg)] rounded-md p-4 max-w-4xl w-full space-y-4">
                    <div class="flex items-center gap-2">
                        <TablerSearch class="text-[var(--ui-text)]" />
                        <input v-model="search" type="text" placeholder="Search" class="outline-none">
                    </div>
                    <div class="relative flex flex-col gap-2">
                        <div v-if="wikiList.length > 0" v-for="item in wikiList" :key="item.id"
                            @click="isOpen = false" class="hover:bg-[var(--ui-bg-accented)] rounded-md cursor-pointer">
                            <NuxtLink :to="`/wiki/${item.id}`" class="text-[var(--ui-text)] w-full block p-2">{{ item.title }}
                            </NuxtLink>
                        </div>
                        <div v-else class="flex flex-col gap-2">
                            <div class="text-[var(--ui-text-muted)] w-full block p-2">
                                검색 결과가 없습니다.
                            </div>
                            <button @click="createWiki"
                                class="text-[var(--ui-text)] bg-[var(--ui-primary-muted)] hover:bg-[var(--ui-primary)] cursor-pointer rounded-md w-full
                                 p-2 flex flex-row gap-2 items-center justify-center">
                                <Icon icon="fluent:tab-new-24-filled" width="24" height="24" />
                                <span>새 문서 생성</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<style>
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}
</style>
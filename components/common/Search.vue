<script setup>
import TablerSearch from '../icon/TablerSearch.vue';
import { Icon } from '@iconify/vue';
const isOpen = ref(false);
const search = ref('');
const { data: wikiList } = await useFetch('/api/wiki/list')
const computedList = computed(() => {
    return wikiList.value.filter(item => item.toLowerCase().includes(search.value.toLowerCase()));
});

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
                        <div v-if="computedList.length > 0" v-for="item in computedList" :key="item.id"
                            @click="isOpen = false" class="hover:bg-[var(--ui-bg-accented)] rounded-md cursor-pointer">
                            <NuxtLink :to="`/wiki/${item}`" class="text-[var(--ui-text)] w-full block p-2">{{ item }}
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
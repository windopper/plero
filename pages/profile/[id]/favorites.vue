<script setup lang="ts">
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';
import { Icon } from '@iconify/vue';
import { type FavoritesItem, type FavoritesList, type Wiki } from '~/server/db/schema';

const route = useRoute();
const selectedList = ref<FavoritesList | null>(null);
const isDropdownOpen = ref(false);
const isPendingFetchItems = ref(true);
const { data: favoritesList } = await useFetch(`/api/favorites/lists`);

const items = ref<{ wiki: { id: string, title: string, tags: string[], updatedAt: number }, list: FavoritesItem }[]>([]);

const fetchItems = async (listId: string) => {
    isPendingFetchItems.value = true;
    const favoriteItem = await $fetch(`/api/favorites/lists/${listId}`);
    const response = await Promise.all(favoriteItem.data.map(async (item: FavoritesItem) => {
        const wiki = await fetchWiki(item.wikiId);
        return { wiki: wiki, list: item };
    }));

    items.value = response;
    isPendingFetchItems.value = false;
};

const fetchWiki = async (wikiId: string) => {
    const response = await $fetch<any>(`/api/wiki/${wikiId}?compact=true`);
    return response.data as { id: string, title: string, tags: string[], updatedAt: number };
};

const handleSelectList = async (list: FavoritesList) => {
    selectedList.value = list;
    isDropdownOpen.value = false;
    await fetchItems(list.id);
};

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// 외부 클릭 시 드롭다운 닫기
onMounted(() => {
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
            isDropdownOpen.value = false;
        }
    });
});
</script>

<template>
    <ContentHeader>
        <NavigationTitle title="즐겨찾기" backButton :navigatePath="`/profile/${route.params.id}`" />
    </ContentHeader>

    <ContentBody>
        <div class="flex flex-col gap-6">
            <!-- 즐겨찾기 목록 선택 드롭다운 -->
            <div class="flex flex-col gap-2">
                <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">즐겨찾기 목록</h2>
                
                <div class="relative dropdown-container max-w-md">
                    <button 
                        @click="toggleDropdown"
                        class="w-full flex items-center justify-between p-3 bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-accented)] transition-colors duration-200"
                        :class="{ 'ring-2 ring-[var(--ui-primary)] ring-opacity-50': isDropdownOpen }"
                    >
                        <div class="flex items-center gap-2">
                            <Icon 
                                icon="mdi:format-list-bulleted" 
                                class="w-5 h-5 text-[var(--ui-text-muted)]"
                            />
                            <span class="text-[var(--ui-text)] truncate">
                                {{ selectedList ? selectedList.name : '즐겨찾기 목록을 선택하세요' }}
                            </span>
                        </div>
                        <Icon 
                            :icon="isDropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
                            class="w-5 h-5 text-[var(--ui-text-muted)] transition-transform duration-200 flex-shrink-0"
                        />
                    </button>

                    <!-- 드롭다운 메뉴 -->
                    <div 
                        v-if="isDropdownOpen && favoritesList"
                        class="absolute top-full left-0 right-0 mt-2 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                    >
                        <div v-if="favoritesList.data.length === 0" class="p-4 text-[var(--ui-text-muted)] text-center">
                            즐겨찾기 목록이 없습니다
                        </div>
                        <button
                            v-for="list in favoritesList.data"
                            :key="list.id"
                            @click="handleSelectList(list)"
                            class="w-full p-4 text-left hover:bg-[var(--ui-bg-elevated)] transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                            :class="{ 'bg-[var(--ui-bg-elevated)]': selectedList?.id === list.id }"
                        >
                            <div class="flex flex-col gap-1">
                                <span class="font-medium text-[var(--ui-text)]">{{ list.name }}</span>
                                <span class="text-sm text-[var(--ui-text-muted)]">
                                    {{ formatDate(list.createdAt) }}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 선택된 목록의 위키 아이템들 -->
            <div v-if="selectedList && items.length > 0" class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                        {{ selectedList.name }} ({{ items.length }}개)
                    </h3>
                </div>

                <div class="grid gap-4">
                    <NuxtLink
                        v-if="!isPendingFetchItems"
                        v-for="item in items"
                        :key="item.list.id"
                        :to="`/wiki/${item.wiki.id}`"
                        class="block p-4 bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg hover:bg-[var(--ui-bg-accented)] hover:border-[var(--ui-border-accented)] transition-all duration-200 group"
                    >
                        <div class="flex flex-col gap-3">
                            <div class="flex items-start justify-between">
                                <h4 class="font-semibold text-[var(--ui-text-highlighted)] group-hover:text-[var(--ui-primary)] transition-colors duration-200">
                                    {{ item.wiki.title }}
                                </h4>
                                <Icon 
                                    icon="mdi:star" 
                                    class="w-5 h-5 text-[var(--ui-primary)] flex-shrink-0 mt-0.5"
                                />
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-[var(--ui-text-muted)]">
                                    {{ formatDate(item.wiki.updatedAt) }}
                                </span>
                                <span class="text-sm text-[var(--ui-text-dimmed)]">•</span>
                                <span class="text-sm text-[var(--ui-text-muted)]">
                                    즐겨찾기 추가: {{ formatDate(item.list.createdAt) }}
                                </span>
                            </div>

                            <!-- 태그 -->
                            <div v-if="item.wiki.tags && item.wiki.tags.length > 0" class="flex flex-wrap gap-2">
                                <span
                                    v-for="tag in item.wiki.tags"
                                    :key="tag"
                                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--ui-bg-accented)] text-[var(--ui-text-toned)] border border-[var(--ui-border-muted)]"
                                >
                                    {{ tag }}
                                </span>
                            </div>
                        </div>
                    </NuxtLink>
                    <div v-else class="flex items-center justify-center p-4">
                        <Icon icon="mdi:loading" class="w-5 h-5 animate-spin" />
                    </div>
                </div>
            </div>

            <!-- 선택된 목록이 있지만 아이템이 없는 경우 -->
            <div v-else-if="selectedList && items.length === 0" class="text-center py-8">
                <Icon icon="mdi:star-outline" class="w-12 h-12 text-[var(--ui-text-muted)] mx-auto mb-4" />
                <p class="text-[var(--ui-text-muted)]">이 목록에는 아직 즐겨찾기한 위키가 없습니다.</p>
            </div>

            <!-- 목록이 선택되지 않은 경우 -->
            <div v-else-if="!selectedList" class="text-center py-8">
                <Icon icon="mdi:format-list-bulleted" class="w-12 h-12 text-[var(--ui-text-muted)] mx-auto mb-4" />
                <p class="text-[var(--ui-text-muted)]">위에서 즐겨찾기 목록을 선택해주세요.</p>
            </div>
        </div>
    </ContentBody>
</template>
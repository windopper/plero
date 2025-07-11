<script setup lang="ts">
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import { Icon } from '@iconify/vue';

const route = useRoute()
const tag = route.params.tag

const navigateToHome = () => {
    navigateTo('/')
}

const { data: response } = await useFetch(`/api/tags/${tag}`);

// 위키를 가나다...abc...순으로 정렬
const sortedWikis = computed(() => {
    if (!response.value?.success || !response.value?.data?.wikis) {
        return [];
    }
    
    return response.value.data.wikis.sort((a: any, b: any) => {
        return a.title.localeCompare(b.title, 'ko-KR', {
            numeric: true,
            sensitivity: 'base'
        });
    });
});

// 첫 글자별로 그룹화
const groupedWikis = computed(() => {
    const groups: { [key: string]: any[] } = {};
    
    sortedWikis.value.forEach((wiki: any) => {
        const firstChar = wiki.title.charAt(0).toUpperCase();
        if (!groups[firstChar]) {
            groups[firstChar] = [];
        }
        groups[firstChar].push(wiki);
    });
    
    // 그룹 키를 정렬 (한글 -> 영문 -> 숫자 -> 기타)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        const aIsKorean = /[가-힣]/.test(a);
        const bIsKorean = /[가-힣]/.test(b);
        const aIsEnglish = /[A-Z]/.test(a);
        const bIsEnglish = /[A-Z]/.test(b);
        const aIsNumber = /[0-9]/.test(a);
        const bIsNumber = /[0-9]/.test(b);
        
        // 한글이 먼저
        if (aIsKorean && !bIsKorean) return -1;
        if (!aIsKorean && bIsKorean) return 1;
        
        // 영문이 두 번째
        if (aIsEnglish && !bIsEnglish && !bIsKorean) return -1;
        if (!aIsEnglish && bIsEnglish && !aIsKorean) return 1;
        
        // 숫자가 세 번째
        if (aIsNumber && !bIsNumber && !bIsKorean && !bIsEnglish) return -1;
        if (!aIsNumber && bIsNumber && !aIsKorean && !aIsEnglish) return 1;
        
        // 같은 카테고리 내에서는 사전순
        return a.localeCompare(b, 'ko-KR');
    });
    
    return sortedKeys.map(key => ({
        letter: key,
        wikis: groups[key]
    }));
});
</script>
<template>
    <ContentHeader>
        <div class="flex items-center gap-2 text-sm">
            <button @click="navigateToHome"
                class="flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group">
                <Icon icon="material-symbols:home-outline" width="20" height="20"
                    class="group-hover:scale-110 transition-transform duration-200" />
                <span class="font-medium">홈</span>
            </button>
            <div class="ml-2 h-6 w-px bg-[var(--ui-border)]"></div>
            <h1 class="ml-2 text-lg font-semibold text-[var(--ui-text)] truncate">태그:{{ tag }}</h1>
        </div>
    </ContentHeader>
    <ContentBody>
        <div v-if="response?.success" class="space-y-8">
            <div v-if="groupedWikis.length === 0" class="text-center py-12">
                <div class="text-[var(--ui-text-muted)] text-lg">
                    <Icon icon="material-symbols:search-off" width="48" height="48" class="mx-auto mb-4 opacity-50" />
                    <p>이 태그가 붙은 위키가 없습니다.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                <div v-for="group in groupedWikis" :key="group.letter" class="space-y-4">
                    <!-- 첫 글자 헤더 -->
                    <div class="border-b border-[var(--ui-border)] pb-2">
                        <h2 class="text-xl font-bold text-[var(--ui-text)] flex items-center gap-2">
                            <span
                                class="w-8 h-8 bg-[var(--ui-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {{ group.letter }}
                            </span>
                            <span>{{ group.letter }}</span>
                            <span class="text-sm text-[var(--ui-text-muted)] font-normal">({{ group.wikis.length
                                }}개)</span>
                        </h2>
                    </div>

                    <!-- 위키 목록 -->
                    <div class="grid gap-3 pl-4">
                        <div v-for="wiki in group.wikis" :key="wiki.id"
                            class="group p-4 rounded-lg border border-[var(--ui-border)] hover:border-[var(--ui-primary)] hover:shadow-md transition-all duration-200 bg-[var(--ui-bg)]">
                            <NuxtLink :to="`/wiki/${wiki.id}`" class="block">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1 min-w-0">
                                        <h3
                                            class="text-lg font-semibold text-[var(--ui-text)] group-hover:text-[var(--ui-primary)] transition-colors duration-200 truncate">
                                            {{ wiki.title }}
                                        </h3>
                                        <p v-if="wiki.content"
                                            class="text-sm text-[var(--ui-text-muted)] mt-1 line-clamp-2">
                                            {{ wiki.content.substring(0, 100) }}{{ wiki.content.length > 100 ? '...' :
                                            '' }}
                                        </p>
                                        <div class="flex items-center gap-4 mt-2 text-xs text-[var(--ui-text-muted)]">
                                            <span v-if="wiki.lastEditedBy">
                                                <Icon icon="material-symbols:person-outline" width="14" height="14"
                                                    class="inline mr-1" />
                                                {{ wiki.lastEditedBy }}
                                            </span>
                                            <span v-if="wiki.updatedAt">
                                                <Icon icon="material-symbols:schedule-outline" width="14" height="14"
                                                    class="inline mr-1" />
                                                {{ new Date(wiki.updatedAt).toLocaleDateString('ko-KR') }}
                                            </span>
                                        </div>
                                    </div>
                                    <Icon icon="material-symbols:arrow-outward" width="20" height="20"
                                        class="text-[var(--ui-text-muted)] group-hover:text-[var(--ui-primary)] transition-colors duration-200 ml-4 flex-shrink-0" />
                                </div>
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-12">
            <div class="text-[var(--ui-text-muted)] text-lg">
                <Icon icon="material-symbols:error-outline" width="48" height="48" class="mx-auto mb-4 text-red-500" />
                <h1 class="text-xl font-semibold text-[var(--ui-text)] mb-2">조회 실패</h1>
                <p>태그 정보를 불러올 수 없습니다.</p>
            </div>
        </div>
    </ContentBody>
</template>
<script setup lang="ts">
import ContentBody from '~/components/common/ContentBody.vue';
import ContentHeader from '~/components/common/ContentHeader.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';
import WikiCard from '~/components/wiki/WikiCard.vue';
import { Icon } from '@iconify/vue';

const route = useRoute();
const sort = ref<'asc' | 'desc'>('desc');
const { data, error } = await useFetch(`/api/user/${route.params.id}/wiki`, {
    query: {
        sort,
    },
});

if (error.value) {
    throw createError({
        statusCode: error.value.statusCode,
        statusMessage: error.value.statusMessage,
    })
}
</script>

<template>
    <ContentHeader>
        <NavigationTitle title="나의 위키" backButton :navigatePath="`/profile/${route.params.id}`" />
    </ContentHeader>
    <ContentBody>
        <div class="flex flex-col gap-4">
            <div class="flex flex-row justify-between gap-2">
                <div class="flex flex-row gap-2">
                    <button @click="sort = 'desc'"
                        class="action-button bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-accent)] font-bold"
                        :class="{ 'bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-elevated)]': sort === 'desc' }">최신순</button>
                    <button @click="sort = 'asc'"
                        class="action-button bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-accent)] font-bold"
                        :class="{ 'bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-elevated)]': sort === 'asc' }">오래된순</button>
                </div>
                <div>
                    <button class="action-button bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-elevated)] font-bold"
                        @click="navigateTo('/wiki/create')">
                        <Icon icon="material-symbols:add" width="16" height="16" />
                        위키 생성
                    </button>
                </div>
            </div>
            <div v-if="data?.success" v-for="wiki in data.data.wikis" :key="wiki.id">
                <WikiCard :wiki="wiki" />
            </div>
        </div>
    </ContentBody>
</template>
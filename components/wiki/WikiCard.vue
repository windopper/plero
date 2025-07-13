<script setup lang="ts">
import type { Wiki } from '~/server/db/schema';

const props = defineProps<{
    wiki: Wiki;
}>();

const date = getRelativeTime(props.wiki.updatedAt);
</script>

<template>
    <div class="flex flex-col gap-2 border-b border-[var(--ui-border)] pb-4">
        <div class="flex flex-row items-center gap-2">
            <NuxtLink :to="`/wiki/${props.wiki.id}`" class="text-3xl font-bold hover:underline">{{ props.wiki.title }}
            </NuxtLink>
            <!-- published badge -->
            <span v-if="props.wiki.isPublished"
                class="text-xs text-green-500 border-[1px] border-green-500 rounded-full px-2 py-0.5 flex items-center">
                Published
            </span>
            <span v-else
                class="text-xs text-red-500 border-[1px] border-red-500 rounded-full px-2 py-0.5 flex items-center">
                Unpublished
            </span>
        </div>
        <span class="text-sm text-gray-500">최근 업데이트: {{ date }}</span>
        <div class="flex flex-row gap-2">
            <span v-for="tag in props.wiki.tags" :key="tag" @click="navigateTo(`/tags/${tag}`)"
                class="text-xs text-[var(--ui-text-accented)] border-[1px] border-[var(--ui-border)]
                 rounded-full px-2 py-0.5 flex items-center cursor-pointer">
                {{ tag }}
            </span>
        </div>
    </div>
</template>
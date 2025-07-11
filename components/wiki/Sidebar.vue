<script setup>
import { Icon } from '@iconify/vue';
import Contributors from './Contributors.vue';
import StarButton from './StarButton.vue';

const route = useRoute()
const id = route.params.id
const { data: response } = await useFetch(`/api/wiki/${id}`)
const latestUpdate = new Date(response.value.data.updatedAt).toLocaleString({
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})

const { data: contributors } = await useFetch(`/api/wiki/${id}/contributors`)
</script>

<template>
    <div class="sticky top-4 flex flex-col gap-4 p-2">
        <div class="flex gap-2 justify-between">
            <div class="flex flex-col gap-1">
                <div class="text-sm text-[var(--ui-text-muted)]">
                    최근 업데이트
                </div>
                <div class="text-sm text-[var(--ui-text-dimmed)]">{{ latestUpdate }}</div>
            </div>
            <div class="flex flex-col gap-2">
                <div class="flex gap-2 items-center">
                    <button
                        class="bg-[var(--ui-bg-elevated)] rounded-md px-2 py-1 flex 
                        flex-row items-center gap-2 cursor-pointer text-nowrap"
                        @click="navigateTo(`/wiki/${id}/edit`)">
                        <Icon icon="mdi:pencil-outline" width="20" height="20" />
                        편집
                    </button>
                    <button
                        class="bg-[var(--ui-bg-elevated)] rounded-md px-2 py-1 flex flex-row items-center gap-2 cursor-pointer text-nowrap"
                        @click="navigateTo(`/wiki/${id}/history`)">
                        <Icon icon="mdi:history" width="20" height="20" />
                        역사
                    </button>
                </div>
                <StarButton :wiki-id="id" />
            </div>
        </div>
        <Contributors :contributors="contributors.data" />
    </div>
</template>
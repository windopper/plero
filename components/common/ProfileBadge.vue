<script setup lang="ts">
const props = defineProps<{
    id: string
}>()

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const { data: user } = await useAsyncData<{ data: { avatar: string } }>(`/api/user/${props.id}`, async () => {
    if (!uuidRegex.test(props.id)) {
        return {
            data: {
                avatar: ''
            }
        }
    }
    const response = await $fetch<{ data: { avatar: string } }>(`/api/user/${props.id}`);
    return {
        data: {
            avatar: response.data.avatar
        }
    }
})

const emit = defineEmits(['mouseover', 'mouseleave'])
</script>

<template>
    <img v-if="user?.data?.avatar" :src="user.data.avatar" class="rounded-full" @mouseover="emit('mouseover')"
        @mouseleave="emit('mouseleave')" />
    <div v-else class="rounded-full bg-[var(--ui-bg-muted)] w-8 h-8"></div>
</template>
<script setup lang="ts">
const props = defineProps<{
    id: string
}>()

const { data: user } = await useFetch<{data: {avatar: string}}>(`/api/user/${props.id}`)

const emit = defineEmits(['mouseover', 'mouseleave'])
</script>

<template>
    <img :src="user?.data?.avatar" class="rounded-full" @mouseover="emit('mouseover')"
        @mouseleave="emit('mouseleave')" />
</template>
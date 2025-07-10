<script setup lang="ts">
const props = defineProps<{
    id: string
}>()

const { data: user } = await useFetch(`/api/user/${props.id}`)
</script>

<template>
    <img :src="user?.data?.avatar" class="rounded-full" />
</template>
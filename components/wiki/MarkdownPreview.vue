<template>
    <MdPreview class="break-words max-w-none prose md:prose-base prose-sm prose-zinc dark:prose-invert"
        :modelValue="content" language="en" />
</template>

<script setup>
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const props = defineProps({
    content: {
        type: String,
        required: true
    }
})
</script>

<style scoped>
@import '~/assets/css/main.css';
</style>
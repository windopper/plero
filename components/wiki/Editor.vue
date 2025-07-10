<script setup>
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
defineProps({
    contentValue: {
        type: String,
        required: true
    },
    titleValue: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['update:contentValue', 'update:titleValue'])

const updateContentValue = (value) => {
    emit('update:contentValue', value)
}

const updateTitleValue = (value) => {
    emit('update:titleValue', value)
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <input type="text" :value="titleValue" @input="updateTitleValue($event.target.value)"
             placeholder="제목을 입력해주세요"
            class="text-[var(--ui-text)] bg-[var(--ui-bg)] border-[var(--ui-border)] rounded-md px-4 py-3 outline-none" />
        <MdEditor :model-value="contentValue" @update:model-value="updateContentValue" language="ko"  />
    </div>
</template>

<style>
.md-editor {
    --md-color: var(--ui-text);
    --md-hover-color: var(--ui-text-highlighted);
    --md-bk-color: var(--ui-bg);
    --md-bk-color-outstand: var(--ui-bg-muted);
    --md-bk-hover-color: var(--ui-bg-elevated);
    --md-border-color: var(--ui-border);
    --md-border-hover-color: var(--ui-border-accented);
    --md-border-active-color: var(--ui-text-toned);
    --md-modal-mask: #00000073;
    --md-scrollbar-bg-color: var(--ui-bg);
    --md-scrollbar-thumb-color: var(--ui-border);
    --md-scrollbar-thumb-hover-color: var(--ui-border-accented);
    --md-scrollbar-thumb-active-color: var(--ui-border-accented);
}
</style>
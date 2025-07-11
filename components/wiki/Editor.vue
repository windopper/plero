<script setup>
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ref } from 'vue'
import Tags from './Tags.vue'

const props = defineProps({
    contentValue: {
        type: String,
        required: true
    },
    titleValue: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['update:contentValue', 'update:titleValue', 'update:tags'])

const newTag = ref('')

const updateContentValue = (value) => {
    emit('update:contentValue', value)
}

const updateTitleValue = (value) => {
    emit('update:titleValue', value)
}

const updateTags = (value) => {
    emit('update:tags', value)
}

const removeTag = (tag) => {
    emit('update:tags', props.tags.filter(t => t !== tag))
}

const addTag = () => {
    const trimmedTag = newTag.value.trim()
    if (trimmedTag && !props.tags.includes(trimmedTag)) {
        emit('update:tags', [...props.tags, trimmedTag])
        newTag.value = ''
    }
}

const handleTagInput = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault()
        addTag()
    }
}

const isPleroTag = (tag) => {
    return tag.startsWith('plero:')
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <input type="text" :value="titleValue" @input="updateTitleValue($event.target.value)" placeholder="제목을 입력해주세요"
            class="text-[var(--ui-text)] bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md px-4 py-3 outline-none focus:border-[var(--ui-primary)] transition-colors" />

        <!-- 태그 섹션 -->
        <div class="space-y-3">
            <div class="text-sm font-medium text-[var(--ui-text)] ">태그</div>

            <!-- 기존 태그들 -->
            <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
                <Tags v-for="tag in tags" :key="tag" :tag="tag" @remove="removeTag" />
            </div>

            <!-- 새 태그 입력 -->
            <div class="flex gap-2">
                <input v-model="newTag" type="text" placeholder="태그를 입력하고 Enter를 누르세요 (예: frontend, plero:official)"
                    @keydown="handleTagInput"
                    class="flex-1 text-[var(--ui-text)] bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--ui-primary)] transition-colors" />
                <button @click="addTag" :disabled="!newTag.trim()"
                    class="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ui-primary-elevated)] transition-colors">
                    추가
                </button>
            </div>

            <!-- 태그 설명 -->
            <div class="text-xs text-[var(--ui-text-muted)] space-y-1">
                <p>• 일반 태그: 사용자가 생성한 페이지에 대해 분류됩니다</p>
                <p>• plero: 태그: 전체 페이지에 대해 분류됩니다 (예: plero:official, plero:guide)</p>
            </div>
        </div>

        <MdEditor :model-value="contentValue" @update:model-value="updateContentValue" language="ko" />
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
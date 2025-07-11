<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
    tag: {
        type: String,
        required: true
    },
    removeable: {
        type: Boolean,
        default: true
    },
    enableTagLink: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['remove'])

const isPleroTag = (tag) => {
    return tag.startsWith('plero:')
}

const navigateToTag = () => {
    if (props.enableTagLink) {
        navigateTo(`/tags/${props.tag}`)
    }
}

</script>

<template>
    <div :class="[
        'rounded-full px-3 py-1 text-sm flex items-center gap-2 transition-colors',
        isPleroTag(props.tag)
            ? 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]'
            : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] border border-[var(--ui-border)]'
    ]" @click="navigateToTag">
        <span v-if="isPleroTag(props.tag)" class="text-xs opacity-80">
            <Icon icon="mdi:tags" width="24" height="24" />
        </span>
        <span v-else class="text-xs opacity-80">
            <Icon icon="mdi:tags" width="24" height="24" />
        </span>
        {{ props.tag }}
        <button v-if="props.removeable" @click="emit('remove', props.tag)" :class="[
            'hover:opacity-70 transition-opacity cursor-pointer',
            isPleroTag(props.tag) ? 'text-[var(--ui-text-inverted)]' : 'text-[var(--ui-text-muted)]'
        ]">
            <Icon icon="mdi:close" width="24" height="24" />
        </button>
    </div>
</template>
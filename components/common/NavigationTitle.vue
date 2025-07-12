<script setup lang="ts">
import { Icon } from '@iconify/vue';

const props = defineProps<{
    title: string;
    navigatePath?: string;
    backButton?: boolean;
    backButtonText?: string;
    backButtonIcon?: string;
    backButtonClasses?: string;
}>();

</script>

<template>
    <div class="flex items-center">
        <button v-if="props.backButton" @click="navigateTo(props.navigatePath || '/')"
            :class="props.backButtonClasses || 'flex items-center gap-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 group'">
            <Icon :icon="props.backButtonIcon || 'material-symbols:arrow-back'" width="20" height="20"
                class="group-hover:scale-110 transition-transform duration-200" />
            <span class="font-medium">{{ props.backButtonText || '뒤로가기' }}</span>
        </button>
        <div v-if="props.backButton" class="ml-4 h-6 w-px bg-[var(--ui-border)]"></div>
        <h1 class="ml-4 text-lg font-semibold text-[var(--ui-text)]">{{ props.title }}</h1>
    </div>
</template>
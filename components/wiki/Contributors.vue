<script setup>
const props = defineProps({
    contributors: {
        type: Array,
        default: () => ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test8", "test9", "test10"]
    }
})

const firstLetters = computed(() => {
    return props.contributors.slice(0, 5).map(contributor => contributor.charAt(0).toUpperCase());
})
const remaining = computed(() => {
    return props.contributors.length - firstLetters.value.length;
})
</script>

<template>
    <div class="flex flex-col gap-2">
        <div class="flex flex-row gap-2 items-center">
            <div class="text-sm text-[var(--ui-text-muted)]">
                기여자
            </div>
            <div class="text-sm text-[var(--ui-text-muted)] bg-[var(--ui-bg-muted)] rounded-md px-2 py-1">
                {{ props.contributors.length }}
            </div>
        </div>
        <div class="relative flex flex-row gap-2 flex-wrap h-12">
            <div v-for="(letter, index) in firstLetters" :key="letter"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-12 h-12 flex 
                items-center justify-center text-lg text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)]" :style="{ left: `${index * 24}px` }">
                {{ letter }}
            </div>
            <div v-if="remaining > 0"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-12 h-12 flex 
                items-center justify-center text-lg text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)]"
                :style="{ left: `${firstLetters.length * 24}px` }">
                +{{ remaining }}
            </div>
        </div>
    </div>
</template>
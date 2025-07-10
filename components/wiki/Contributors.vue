<script setup>
import ProfileBadge from '~/components/common/ProfileBadge.vue'

const props = defineProps({
    contributors: {
        type: Array,
    }
})

const firstLetters = computed(() => {
    return props.contributors.slice(0, 5).map(contributor => contributor.contributorName.charAt(0).toUpperCase());
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
            <div v-for="(contributor, index) in contributors" :key="contributor.id"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-10 h-10 flex 
                items-center justify-center text-lg text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)]" :style="{ left: `${index * 24}px` }">
                <ProfileBadge :id="contributor.contributorId" />
            </div>
            <div v-if="remaining > 0"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-10 h-10 flex 
                items-center justify-center text-lg text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)]"
                :style="{ left: `${firstLetters.length * 24}px` }">
                +{{ remaining }}
            </div>
        </div>
    </div>
</template>
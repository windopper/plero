<script setup lang="ts">
import type { PropType } from 'vue';
import ProfileBadge from '~/components/common/ProfileBadge.vue'
import type { WikiContributor } from '~/server/db/schema';

const props = defineProps({
    contributors: {
        type: Array as PropType<WikiContributor[]>,
    }
})

const firstLetters = computed(() => {
    if (!props.contributors) {
        return []
    }
    return props.contributors.slice(0, 5).map(contributor => contributor.contributorName.charAt(0).toUpperCase());
})
const remaining = computed(() => {
    if (!props.contributors) {
        return 0
    }
    return props.contributors.length - firstLetters.value.length;
})  

const hoveredContributor = ref<WikiContributor | null>(null)
const showTooltip = ref(false)

const handleMouseOver = (contributor: WikiContributor) => {
    hoveredContributor.value = contributor
    showTooltip.value = true
}

const handleMouseLeave = () => {
    hoveredContributor.value = null
    showTooltip.value = false
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div class="flex flex-row gap-2 items-center">
            <div class="text-sm text-[var(--ui-text-muted)]">
                기여자
            </div>
            <div class="text-sm text-[var(--ui-text-muted)] bg-[var(--ui-bg-muted)] rounded-md px-2 py-1">
                {{ props.contributors?.length }}
            </div>
        </div>
        <div class="relative flex flex-row gap-2 flex-wrap h-12">
            <div v-for="(contributor, index) in contributors" :key="contributor.id"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-10 h-10 flex 
                items-center justify-center text-lg text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)] 
                hover:border-[var(--ui-primary)] transition-all duration-200 cursor-pointer" 
                :style="{ left: `${index * 24}px` }"
                @mouseover="handleMouseOver(contributor)"
                @mouseleave="handleMouseLeave">
                <ProfileBadge :id="contributor.contributorId" />

                <!-- 기여자 통계 표시 툴팁 -->
                <div v-if="showTooltip && hoveredContributor?.id === contributor.id"
                    class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+8px)] 
                    bg-[var(--ui-bg-elevated)] shadow-lg border border-[var(--ui-border-muted)] 
                    rounded-lg px-3 py-2 text-sm min-w-max z-10 backdrop-blur-sm">
                    
                    <!-- 툴팁 화살표 -->
                    <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 
                        border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--ui-border-muted)]"></div>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 
                        border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--ui-bg-elevated)]"></div>
                    
                    <!-- 기여자 이름 -->
                    <div class="font-medium text-[var(--ui-text-primary)] mb-1">
                        {{ contributor.contributorName }}
                    </div>
                    
                    <!-- 기여 통계 -->
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <span class="text-green-500 text-xs">+{{ contributor.linesAdded }}</span>
                            <span class="text-red-500 text-xs">-{{ contributor.linesRemoved }}</span>
                        </div>
                        <div class="text-xs text-[var(--ui-text-muted)] pt-1 border-t border-[var(--ui-border-muted)]">
                            첫 기여: {{ new Date(contributor.firstContributedAt).toLocaleDateString('ko-KR') }}
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="remaining > 0"
                class="absolute top-0 bg-[var(--ui-bg-muted)] rounded-full w-10 h-10 flex 
                items-center justify-center text-sm text-[var(--ui-text-muted)] border-[1px] border-[var(--ui-border-muted)]"
                :style="{ left: `${firstLetters.length * 24}px` }">
                +{{ remaining }}
            </div>
        </div>
    </div>
</template>
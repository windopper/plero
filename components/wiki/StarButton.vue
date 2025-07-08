<script setup lang="ts">
import { Icon } from '@iconify/vue';

const star = ref(false)
const starCount = ref(0)
const showStarList = ref(false)
const selectedStarList = ref<string[]>([])
const starList = ref(["1", "2", "3", "4", "5"])

const updateStar = () => {
    star.value = !star.value
    if (star.value) {
        starCount.value += 1
    } else {
        starCount.value -= 1
        selectedStarList.value = []
    }
}

const starCountView = computed(() => {
    return starCount.value > 999 ? '999+' : starCount.value
})

const updateStarWithList = (item: string) => {
    if (selectedStarList.value.includes(item)) {
        selectedStarList.value = selectedStarList.value.filter((i) => i !== item)
    } else {
        selectedStarList.value = [...selectedStarList.value, item]
    }

    if (!star.value) {
        star.value = true
        starCount.value += 1
    }
}

watch(selectedStarList, (newVal) => {
    console.log(newVal)
})

const starListRef = useTemplateRef('starListRef')
const starListButtonRef = useTemplateRef('starListButtonRef')

onMounted(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (starListRef.value && !starListRef.value.contains(event.target as Node) && 
            starListButtonRef.value && !starListButtonRef.value.contains(event.target as Node)) {
            showStarList.value = false
        }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <div class="relative flex flex-row">
        <button class="bg-[var(--ui-bg-elevated)] px-2 py-1 flex flex-row items-center gap-2 cursor-pointer
                        border-r-[1px] border-[var(--ui-border-muted)] rounded-l-md
                        " @click="updateStar">
            <Icon v-if="star" icon="mdi:star" width="20" height="20" />
            <Icon v-else icon="mdi:star-outline" width="20" height="20" />
            <span class="text-sm">즐겨찾기</span>
            <span class="text-xs text-[var(--ui-text-dimmed)]">{{ starCountView }}</span>
        </button>
        <button class="bg-[var(--ui-bg-elevated)] px-2 py-1 flex flex-row items-center gap-2 cursor-pointer
                        rounded-r-md
                        " @click="showStarList = !showStarList" ref="starListButtonRef">
            <Icon icon="mingcute:down-fill" width="24" height="24" />
        </button>

        <!-- star list popover -->
        <div v-if="showStarList" class="absolute top-10 right-0 w-64 h-full z-50" ref="starListRef" @click.stop>
            <div class="bg-[var(--ui-bg-muted)] rounded-md flex flex-col overflow-hidden">
                <div class="text-sm border-b-[1px] border-[var(--ui-border-muted)] pb-2 px-3 py-2">리스트</div>
                <div v-for="star in starList" :key="star" class="text-sm px-3 py-2 flex items-center gap-2">
                    <input type="checkbox" :id="star" :value="star" :checked="selectedStarList.includes(star)"
                        class="w-4 h-4 accent-[var(--ui-primary)] bg-[var(--ui-bg-muted)]"
                        @change="updateStarWithList(star)" />
                    <label :for="star">{{ star }}</label>
                </div>
                <div class="flex flex-row gap-2 border-t-[1px] border-[var(--ui-border-muted)]
                ">
                    <button class="bg-[var(--ui-bg-elevated)] flex flex-row items-center gap-2 cursor-pointer
                        hover:bg-[var(--ui-bg-accented)] px-3 py-2 w-full">
                        <Icon icon="mdi:plus" width="16" height="16" />
                        <span class="text-sm">추가</span>
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>
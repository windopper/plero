<script setup lang="ts">
import { Icon } from '@iconify/vue';

const star = ref(false)
const starCount = ref(128)
const showStarList = ref(false)
const selectedStarList = ref<string[]>([])
const starList = ref(["즐겨찾기 목록 1", "즐겨찾기 목록 2", "개발 자료", "참고 문서", "중요한 페이지"])

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
    return starCount.value > 999 ? '999+' : starCount.value.toLocaleString()
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
    <div class="relative flex">
        <!-- 메인 즐겨찾기 버튼 -->
        <button 
            @click="updateStar"
            class="flex items-center gap-2 px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] 
                   border border-[var(--ui-border)] rounded-l-lg hover:bg-[var(--ui-bg-muted)] 
                   transition-all duration-200 border-r-0"
            :class="{ 'text-yellow-500 hover:text-yellow-600': star }"
        >
            <Icon 
                v-if="star" 
                icon="material-symbols:star" 
                width="16" 
                height="16" 
                class="text-yellow-500"
            />
            <Icon 
                v-else 
                icon="material-symbols:star-outline" 
                width="16" 
                height="16"
            />
            <span class="text-sm font-medium">{{ starCountView }}</span>
        </button>
        
        <!-- 드롭다운 버튼 -->
        <button 
            @click="showStarList = !showStarList" 
            ref="starListButtonRef"
            class="flex items-center justify-center px-2 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] 
                   border border-[var(--ui-border)] rounded-r-lg hover:bg-[var(--ui-bg-muted)] 
                   transition-all duration-200"
            :class="{ 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)]': showStarList }"
        >
            <Icon 
                icon="material-symbols:keyboard-arrow-down" 
                width="16" 
                height="16" 
                class="transition-transform duration-200"
                :class="{ 'rotate-180': showStarList }"
            />
        </button>

        <!-- 드롭다운 메뉴 -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
            <div 
                v-if="showStarList" 
                class="absolute top-full mt-2 right-0 w-72 z-50" 
                ref="starListRef" 
                @click.stop
            >
                <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                    <!-- 헤더 -->
                    <div class="px-4 py-3 border-b border-[var(--ui-border)]">
                        <h3 class="text-sm font-semibold text-[var(--ui-text)]">즐겨찾기 목록</h3>
                        <p class="text-xs text-[var(--ui-text-muted)] mt-1">즐겨찾기할 목록을 선택하세요</p>
                    </div>
                    
                    <!-- 목록 -->
                    <div class="max-h-48 overflow-y-auto">
                        <div v-for="(starItem, index) in starList" :key="starItem">
                            <label 
                                :for="`star-${index}`"
                                class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--ui-bg-muted)] transition-colors duration-200"
                            >
                                <!-- 체크박스 -->
                                <input 
                                    type="checkbox" 
                                    :id="`star-${index}`" 
                                    :value="starItem" 
                                    :checked="selectedStarList.includes(starItem)"
                                    @change="updateStarWithList(starItem)"
                                    class="w-4 h-4 text-[var(--ui-primary)] bg-[var(--ui-bg)] border-2 border-[var(--ui-border)] 
                                           rounded-md focus:ring-[var(--ui-primary)] focus:ring-2"
                                />
                                
                                <!-- 목록 이름 -->
                                <span class="text-sm text-[var(--ui-text)] flex-1">{{ starItem }}</span>
                                
                                <!-- 선택된 아이템 표시 -->
                                <Icon 
                                    v-if="selectedStarList.includes(starItem)"
                                    icon="material-symbols:star" 
                                    width="16" 
                                    height="16" 
                                    class="text-yellow-500"
                                />
                            </label>
                        </div>
                    </div>
                    
                    <!-- 푸터 -->
                    <div class="border-t border-[var(--ui-border)] p-3">
                        <button class="w-full flex items-center justify-center gap-2 px-3 py-2
                                      bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-muted)]
                                      text-white rounded-lg font-medium text-sm
                                      transition-colors duration-200">
                            <Icon icon="material-symbols:add" width="16" height="16" />
                            <span>새 목록 만들기</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* 커스텀 스크롤바 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: var(--ui-bg-muted);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: var(--ui-border-accented);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--ui-text-muted);
}

/* 체크박스 스타일 */
input[type="checkbox"]:checked {
    background-color: var(--ui-primary);
    border-color: var(--ui-primary);
}
</style>
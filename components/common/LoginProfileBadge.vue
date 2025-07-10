<script setup lang="ts">
import { Icon } from '@iconify/vue';
const { session, loggedIn, clear } = useUserSession();
const colorMode = useColorMode();
const menuOpen = ref(false);
const containerTemplateRef = useTemplateRef('containerTemplateRef');
const menuTemplateRef = useTemplateRef('menuTemplateRef');

const handleClickOutside = (event: MouseEvent) => {
    if (containerTemplateRef.value && !containerTemplateRef.value.contains(event.target as Node) &&
        menuTemplateRef.value && !menuTemplateRef.value.contains(event.target as Node)) {
        menuOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

const loggedInMenuList = [
    {
        name: '로그아웃',
        icon: 'material-symbols:logout',
        onClick: () => {
            clear();
        }
    },
    {
        name: '설정',
        icon: 'material-symbols:settings',
        onClick: () => {
            navigateTo('/settings');
        }
    },
    {
        name: '다크모드 토글',
        icon: 'material-symbols:dark-mode',
        onClick: () => {
            colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
        }
    }
]
</script>

<template>
    <div ref="containerTemplateRef" class="relative" @click="menuOpen = !menuOpen">
        <div class="rounded-full w-10 h-10 overflow-hidden ring-2 ring-[var(--ui-primary)] cursor-pointer"
            v-if="session?.user?.avatar">
            <img :src="session?.user?.avatar" alt="Profile" class="w-full h-full rounded-full object-cover">
        </div>
        <div class="rounded-full w-10 h-10 flex items-center justify-center ring-2 ring-[var(--ui-primary)] cursor-pointer"
            v-else>
            <span class="text-white">?</span>
        </div>
        <div ref="menuTemplateRef"
            class="absolute top-12 right-0 z-50 min-w-48 bg-white dark:bg-[var(--ui-bg-muted)] rounded-md shadow-2xl"
            v-if="menuOpen">
            <div class="p-4 flex flex-col gap-5 text-sm text-[var(--ui-text)]">
                <div class="flex items-center gap-3 cursor-pointer" v-if="loggedIn">
                    <img :src="session?.user?.avatar" alt="Profile"
                        class="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-[var(--ui-primary)]">
                    <div class="flex flex-col">
                        <span>프로필 보기</span>
                        <span class="text-xs text-[var(--ui-text-dimmed)]">
                            {{ session?.user?.name }}
                        </span>
                    </div>
                </div>
                <div v-else class="flex flex-col justify-center items-center gap-6">
                    <span class="text-sm text-[var(--ui-text-dimmed)]">로그인이 필요합니다</span>
                    <NuxtLink to="/login" class="text-sm flex items-center gap-2 w-full hover:bg-[var(--ui-bg-accented)] rounded-md p-2">
                        <Icon icon="material-symbols:login" width="24" height="24" />
                        <span>로그인</span>
                    </NuxtLink>
                </div>

                <div class="flex flex-col gap-5" v-if="loggedIn">
                    <div v-for="item in loggedInMenuList" :key="item.name" class="flex items-center gap-2 cursor-pointer
                    text-[var(--ui-text-toned)] hover:text-[var(--ui-text)]
                    " @click="item.onClick  ">
                        <Icon :icon="item.icon" width="24" height="24" />
                        <span class="text-sm">{{ item.name }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
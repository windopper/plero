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
        name: '프로필 보기',
        icon: 'material-symbols:person-outline',
        onClick: () => {
            navigateTo('/profile');
        },
        description: '내 프로필 정보 확인'
    },
    {
        name: '즐겨찾기',
        icon: 'material-symbols:star-outline',
        onClick: () => {
            navigateTo('/favorites');
        },
        description: '저장한 위키 목록'
    },
    {
        name: '설정',
        icon: 'material-symbols:settings-outline',
        onClick: () => {
            navigateTo('/settings');
        },
        description: '계정 및 앱 설정'
    },
    {
        name: '다크모드 토글',
        icon: colorMode.value === 'dark' ? 'material-symbols:light-mode-outline' : 'material-symbols:dark-mode-outline',
        onClick: () => {
            colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
        },
        description: colorMode.value === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
    },
    {
        name: '로그아웃',
        icon: 'material-symbols:logout',
        onClick: () => {
            clear();
            menuOpen.value = false;
        },
        description: '계정에서 로그아웃',
        danger: true
    }
]
</script>

<template>
    <div ref="containerTemplateRef" class="relative">
        <!-- 프로필 버튼 -->
        <button 
            @click="menuOpen = !menuOpen"
            class="group relative rounded-full w-10 h-10 overflow-hidden ring-2 ring-[var(--ui-primary)] hover:ring-[var(--ui-primary-elevated)] transition-all duration-200 hover:scale-105"
        >
            <img 
                v-if="session?.user?.avatar" 
                :src="session?.user?.avatar" 
                alt="Profile" 
                class="w-full h-full rounded-full object-cover"
            >
            <div 
                v-else 
                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white font-semibold"
            >
                <Icon icon="material-symbols:person" width="20" height="20" />
            </div>
            
            <!-- 온라인 상태 표시 -->
            <div 
                v-if="loggedIn" 
                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--ui-bg)] rounded-full"
            ></div>
        </button>

        <!-- 드롭다운 메뉴 -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1"
        >
            <div 
                v-if="menuOpen"
                ref="menuTemplateRef"
                class="absolute top-12 right-0 z-50 w-80 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-2xl overflow-hidden"
            >
                <div v-if="loggedIn" class="p-4">
                    <!-- 사용자 정보 헤더 -->
                    <div class="flex items-center gap-3 pb-4 border-b border-[var(--ui-border)]">
                        <div class="relative">
                            <img 
                                v-if="session?.user?.avatar"
                                :src="session?.user?.avatar" 
                                alt="Profile"
                                class="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-[var(--ui-primary)]"
                            >
                            <div 
                                v-else
                                class="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-primary-muted)] flex items-center justify-center text-white font-semibold"
                            >
                                <Icon icon="material-symbols:person" width="24" height="24" />
                            </div>
                            <!-- 온라인 상태 -->
                            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--ui-bg)] rounded-full"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-[var(--ui-text-highlighted)] truncate">
                                {{ session?.user?.name || '사용자' }}
                            </h3>
                            <p class="text-sm text-[var(--ui-text-muted)] truncate">
                                {{ session?.user?.email || '이메일 없음' }}
                            </p>
                            <div class="flex items-center gap-1 mt-1">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span class="text-xs text-[var(--ui-text-muted)]">온라인</span>
                            </div>
                        </div>
                    </div>

                    <!-- 메뉴 아이템들 -->
                    <div class="py-2">
                        <button
                            v-for="item in loggedInMenuList" 
                            :key="item.name"
                            @click="item.onClick"
                            class="group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-[var(--ui-bg-muted)]"
                            :class="item.danger ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : ''"
                        >
                            <div 
                                class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                                :class="item.danger 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50' 
                                    : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-toned)] group-hover:bg-[var(--ui-primary)] group-hover:text-white'"
                            >
                                <Icon :icon="item.icon" width="18" height="18" />
                            </div>
                            <div class="flex-1 text-left">
                                <div 
                                    class="font-medium text-sm transition-colors duration-200"
                                    :class="item.danger 
                                        ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300' 
                                        : 'text-[var(--ui-text)] group-hover:text-[var(--ui-text-highlighted)]'"
                                >
                                    {{ item.name }}
                                </div>
                                <div class="text-xs text-[var(--ui-text-muted)] mt-0.5">
                                    {{ item.description }}
                                </div>
                            </div>
                            <Icon 
                                icon="material-symbols:chevron-right" 
                                width="16" 
                                height="16" 
                                class="text-[var(--ui-text-muted)] group-hover:translate-x-0.5 transition-transform duration-200"
                            />
                        </button>
                    </div>
                </div>

                <!-- 로그인되지 않은 상태 -->
                <div v-else class="p-6">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-primary-muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon icon="material-symbols:person-outline" width="32" height="32" class="text-white" />
                        </div>
                        <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-2">로그인이 필요합니다</h3>
                        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
                            모든 기능을 사용하려면 로그인하세요
                        </p>
                        <NuxtLink 
                            to="/login"
                            @click="menuOpen = false"
                            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-lg hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                        >
                            <Icon icon="material-symbols:login" width="18" height="18" />
                            <span>로그인</span>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>
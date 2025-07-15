<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ContentHeader from '~/components/common/ContentHeader.vue';
import ContentBody from '~/components/common/ContentBody.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';
import type { User } from '~/server/db/schema';

defineRouteRules({
    isr: 60 * 60,
})

const route = useRoute();
const { user: sessionUser } = useUserSession();
const { data: user, refresh } = await useAsyncData<User>(`user-${route.params.id}`, async () => {
    const response = await $fetch<{data: User}>(`/api/user/${route.params.id}`);
    return response.data;
});

const isMe = computed(() => {
    if (!sessionUser.value || !user.value) return false;
    return (sessionUser.value as any).id === user.value.id;
});

// 편집 모드 상태
const isEditing = ref(false);
const editForm = ref({
    name: '',
    displayName: '',
    bio: '',
    preferences: {
        theme: 'auto' as 'light' | 'dark' | 'auto',
        language: 'ko',
        notifications: true,
        emailNotifications: false,
    }
});

// 저장 상태
const saving = ref(false);
const showSuccessMessage = ref(false);

// 편집 모드 시작
const startEditing = () => {
    if (user.value) {
        editForm.value = {
            name: user.value.name || '',
            displayName: user.value.displayName || '',
            bio: user.value.bio || '',
            preferences: {
                theme: user.value.preferences?.theme || 'auto',
                language: user.value.preferences?.language || 'ko',
                notifications: user.value.preferences?.notifications ?? true,
                emailNotifications: user.value.preferences?.emailNotifications ?? false,
            }
        };
    }
    isEditing.value = true;
};

// 편집 취소
const cancelEditing = () => {
    isEditing.value = false;
    editForm.value = {
        name: '',
        displayName: '',
        bio: '',
        preferences: {
            theme: 'auto',
            language: 'ko',
            notifications: true,
            emailNotifications: false,
        }
    };
};

// 프로필 저장
const saveProfile = async () => {
    if (!user.value) return;
    
    saving.value = true;
    try {
        await $fetch(`/api/user/${user.value.id}`, {
            method: 'PATCH' as any,
            body: editForm.value
        });
        
        await refresh();
        isEditing.value = false;
        showSuccessMessage.value = true;
        
        // 성공 메시지 자동 숨김
        setTimeout(() => {
            showSuccessMessage.value = false;
        }, 3000);
    } catch (error) {
        console.error('프로필 저장 실패:', error);
        // TODO: 에러 메시지 표시
    } finally {
        saving.value = false;
    }
};

// 날짜 포맷팅
const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 역할 표시 색상
const getRoleColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        case 'editor':
            return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        case 'viewer':
            return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
        default:
            return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
};

// 역할 한국어 번역
const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin':
            return '관리자';
        case 'editor':
            return '편집자';
        case 'viewer':
            return '뷰어';
        default:
            return role;
    }
};

// 테마 아이콘
const getThemeIcon = (theme: string) => {
    switch (theme) {
        case 'light':
            return 'material-symbols:light-mode-outline';
        case 'dark':
            return 'material-symbols:dark-mode-outline';
        case 'auto':
            return 'material-symbols:brightness-auto-outline';
        default:
            return 'material-symbols:brightness-auto-outline';
    }
};

// 테마 라벨
const getThemeLabel = (theme: string) => {
    switch (theme) {
        case 'light':
            return '라이트';
        case 'dark':
            return '다크';
        case 'auto':
            return '자동';
        default:
            return '자동';
    }
};

const navigateToHistory = () => {
    navigateTo(`/profile/${route.params.id}/history`)
}
</script>

<template>
    <ContentHeader>
        <NavigationTitle title="프로필" backButton />

        <div class="flex items-center gap-2">
            <button
                class="action-button
                 bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-elevated)]"
                @click="navigateToHistory"
                 >
                <!-- 활동 기록 -->
                <Icon icon="material-symbols:history" width="20" height="20" />
                <span>활동 기록</span>
            </button>
        </div>

        <!-- 성공 메시지 -->
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
            <div v-if="showSuccessMessage"
                class="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg">
                <Icon icon="material-symbols:check-circle-outline" width="20" height="20" />
                <span>프로필이 성공적으로 저장되었습니다</span>
            </div>
        </Transition>
    </ContentHeader>

    <ContentBody>
        <div v-if="user" class="max-w-4xl mx-auto space-y-6">
            <!-- 프로필 헤더 -->
            <div class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-6">
                            <!-- 프로필 이미지 -->
                            <div class="relative">
                                <img v-if="user.avatar" :src="user.avatar" :alt="user.name"
                                    class="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-[var(--ui-primary)]">
                                <div v-else
                                    class="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-primary-muted)] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {{ user.name?.charAt(0)?.toUpperCase() || 'U' }}
                                </div>

                                <!-- 온라인 상태 -->
                                <div
                                    class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-[var(--ui-bg)] rounded-full">
                                </div>
                            </div>

                            <!-- 사용자 정보 -->
                            <div class="space-y-2">
                                <div>
                                    <h1 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
                                        {{ user.displayName || user.name }}
                                    </h1>
                                    <p v-if="user.displayName && user.name !== user.displayName"
                                        class="text-[var(--ui-text-muted)]">
                                        {{ user.name }}
                                    </p>
                                </div>

                                <div class="flex items-center gap-3">
                                    <span class="text-[var(--ui-text-muted)]">{{ user.email }}</span>
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                        :class="getRoleColor(user.role)">
                                        <Icon icon="material-symbols:admin-panel-settings-outline" width="12"
                                            height="12" />
                                        {{ getRoleLabel(user.role) }}
                                    </span>
                                </div>

                                <p v-if="user.bio" class="text-[var(--ui-text)] max-w-md">
                                    {{ user.bio }}
                                </p>
                                <p v-else class="text-[var(--ui-text-muted)] italic">
                                    자기소개가 없습니다
                                </p>
                            </div>
                        </div>

                        <!-- 편집 버튼 -->
                        <button v-if="!isEditing && isMe" @click="startEditing"
                            class="flex items-center gap-2 px-4 py-2 bg-[var(--ui-primary)] text-white rounded-lg hover:bg-[var(--ui-primary-muted)] transition-colors duration-200 shadow-sm">
                            <Icon icon="material-symbols:edit-outline" width="18" height="18" />
                            <span>편집</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 편집 폼 -->
            <div v-if="isEditing"
                class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)]">프로필 편집</h2>
                        <div class="flex items-center gap-2">
                            <button @click="cancelEditing"
                                class="px-4 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200">
                                취소
                            </button>
                            <button @click="saveProfile" :disabled="saving"
                                class="flex items-center gap-2 px-4 py-2 bg-[var(--ui-primary)] text-white rounded-lg hover:bg-[var(--ui-primary-muted)] transition-colors duration-200 disabled:opacity-50">
                                <Icon v-if="saving" icon="material-symbols:hourglass-empty" width="18" height="18"
                                    class="animate-spin" />
                                <Icon v-else icon="material-symbols:save-outline" width="18" height="18" />
                                <span>{{ saving ? '저장 중...' : '저장' }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <!-- 기본 정보 -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-medium text-[var(--ui-text-highlighted)]">기본 정보</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
                                        이름
                                    </label>
                                    <input v-model="editForm.name" type="text"
                                        class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent bg-[var(--ui-bg)] text-[var(--ui-text)]"
                                        placeholder="이름을 입력하세요" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
                                        표시 이름
                                    </label>
                                    <input v-model="editForm.displayName" type="text"
                                        class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent bg-[var(--ui-bg)] text-[var(--ui-text)]"
                                        placeholder="표시할 이름을 입력하세요" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
                                    자기소개
                                </label>
                                <textarea v-model="editForm.bio" rows="3"
                                    class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent bg-[var(--ui-bg)] text-[var(--ui-text)] resize-none"
                                    placeholder="자기소개를 입력하세요" maxlength="500" />
                                <div class="text-xs text-[var(--ui-text-muted)] mt-1">
                                    {{ editForm.bio.length }}/500
                                </div>
                            </div>
                        </div>

                        <!-- 환경 설정 -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-medium text-[var(--ui-text-highlighted)]">환경 설정</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
                                        테마
                                    </label>
                                    <select v-model="editForm.preferences.theme"
                                        class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent bg-[var(--ui-bg)] text-[var(--ui-text)]">
                                        <option value="auto">자동</option>
                                        <option value="light">라이트</option>
                                        <option value="dark">다크</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
                                        언어
                                    </label>
                                    <select v-model="editForm.preferences.language"
                                        class="w-full px-3 py-2 border border-[var(--ui-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent bg-[var(--ui-bg)] text-[var(--ui-text)]">
                                        <option value="ko">한국어</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-[var(--ui-text)]">
                                            알림 받기
                                        </label>
                                        <p class="text-xs text-[var(--ui-text-muted)]">
                                            새로운 활동에 대한 알림을 받습니다
                                        </p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input v-model="editForm.preferences.notifications" type="checkbox"
                                            class="sr-only peer">
                                        <div
                                            class="w-11 h-6 bg-[var(--ui-bg-muted)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--ui-primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ui-primary)]">
                                        </div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-[var(--ui-text)]">
                                            이메일 알림
                                        </label>
                                        <p class="text-xs text-[var(--ui-text-muted)]">
                                            중요한 알림을 이메일로 받습니다
                                        </p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input v-model="editForm.preferences.emailNotifications" type="checkbox"
                                            class="sr-only peer">
                                        <div
                                            class="w-11 h-6 bg-[var(--ui-bg-muted)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--ui-primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--ui-primary)]">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 계정 정보 -->
            <div v-if="!isEditing"
                class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-4">계정 정보</h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:login" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">로그인 제공자</div>
                                    <div class="text-sm text-[var(--ui-text-muted)] capitalize">{{ user.provider }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:calendar-today-outline" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">가입일</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{ formatDate(user.createdAt) }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:update" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">최근 수정</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{ formatDate(user.updatedAt) }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:schedule-outline" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">마지막 로그인</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">
                                        {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '정보 없음' }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:counter-1" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">로그인 횟수</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{ user.loginCount.toLocaleString()
                                        }}회</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:check-circle-outline" width="20" height="20"
                                        class="text-green-500" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">계정 상태</div>
                                    <div class="text-sm">
                                        <span
                                            class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs">
                                            <Icon icon="material-symbols:check-circle" width="12" height="12" />
                                            {{ user.isActive ? '활성' : '비활성' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 환경 설정 -->
            <div v-if="!isEditing && isMe"
                class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-4">환경 설정</h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon :icon="getThemeIcon(user.preferences?.theme || 'auto')" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">테마</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{
                                        getThemeLabel(user.preferences?.theme || 'auto') }}</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon icon="material-symbols:language" width="20" height="20"
                                        class="text-[var(--ui-text-muted)]" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">언어</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{ user.preferences?.language ===
                                        'ko' ? '한국어' : 'English' }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon
                                        :icon="user.preferences?.notifications ? 'material-symbols:notifications-active-outline' : 'material-symbols:notifications-off-outline'"
                                        width="20" height="20"
                                        :class="user.preferences?.notifications ? 'text-[var(--ui-primary)]' : 'text-[var(--ui-text-muted)]'" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">알림</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{ user.preferences?.notifications
                                        ? '켜짐' : '꺼짐' }}</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 bg-[var(--ui-bg-muted)] rounded-lg flex items-center justify-center">
                                    <Icon
                                        :icon="user.preferences?.emailNotifications ? 'material-symbols:mail-outline' : 'material-symbols:mail-off-outline'"
                                        width="20" height="20"
                                        :class="user.preferences?.emailNotifications ? 'text-[var(--ui-primary)]' : 'text-[var(--ui-text-muted)]'" />
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-[var(--ui-text)]">이메일 알림</div>
                                    <div class="text-sm text-[var(--ui-text-muted)]">{{
                                        user.preferences?.emailNotifications ? '켜짐' : '꺼짐' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-else class="flex items-center justify-center py-12">
            <div class="flex items-center gap-3 text-[var(--ui-text-muted)]">
                <Icon icon="material-symbols:hourglass-empty" width="24" height="24" class="animate-spin" />
                <span>프로필 정보를 불러오는 중...</span>
            </div>
        </div>
    </ContentBody>
</template>


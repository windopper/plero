<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
    visible?: boolean;
    title?: string;
    message?: string;
    requiredFeature?: string;
    returnUrl?: string;
}

interface Emits {
    (e: 'close'): void;
    (e: 'login'): void;
}

const props = withDefaults(defineProps<Props>(), {
    visible: false,
    title: '로그인이 필요합니다',
    message: '이 기능을 사용하려면 로그인이 필요합니다.',
    requiredFeature: '',
    returnUrl: ''
});

const emit = defineEmits<Emits>();

const { loggedIn, openInPopup } = useUserSession();

const backdropRef = useTemplateRef('backdropRef');

// 백드롭 클릭 시 팝업 닫기
const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === backdropRef.value) {
        emit('close');
    }
};

// ESC 키로 팝업 닫기
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.visible) {
        emit('close');
    }
};

// 로그인 버튼 클릭
// TODO: 팝업 표시 후 로그인 완료 시 리다이렉트 처리
const handleLogin = async () => {
    try {
        openInPopup('/auth/google?redirectURL=' + encodeURIComponent(props.returnUrl));
        emit('login');
    } catch (error) {
        console.error('로그인 실패:', error);
    }
};

// 이벤트 리스너 등록/해제
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});

// 팝업이 열릴 때 body 스크롤 방지
watch(() => props.visible, (newValue) => {
    if (newValue) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<template>
    <!-- 팝업 오버레이 -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div 
                v-if="visible"
                ref="backdropRef"
                @click="handleBackdropClick"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <!-- 팝업 모달 -->
                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="opacity-0 scale-95 translate-y-4"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 translate-y-4"
                >
                    <div 
                        v-if="visible"
                        class="relative w-full max-w-md bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-2xl shadow-2xl overflow-hidden"
                        @click.stop
                    >
                        <!-- 닫기 버튼 -->
                        <button
                            @click="emit('close')"
                            class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-accented)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all duration-200 group"
                        >
                            <Icon 
                                icon="material-symbols:close" 
                                width="18" 
                                height="18" 
                                class="group-hover:scale-110 transition-transform duration-200" 
                            />
                        </button>

                        <!-- 팝업 내용 -->
                        <div class="p-8 text-center">
                            <!-- 아이콘 -->
                            <div class="w-20 h-20 bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-primary-muted)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Icon 
                                    icon="material-symbols:lock-outline" 
                                    width="40" 
                                    height="40" 
                                    class="text-white" 
                                />
                            </div>

                            <!-- 제목 -->
                            <h2 class="text-xl font-bold text-[var(--ui-text-highlighted)] mb-3">
                                {{ title }}
                            </h2>

                            <!-- 메시지 -->
                            <p class="text-[var(--ui-text-muted)] mb-2 leading-relaxed">
                                {{ message }}
                            </p>

                            <!-- 필요한 기능 표시 -->
                            <div v-if="requiredFeature" class="inline-flex items-center gap-2 px-3 py-1 bg-[var(--ui-bg-muted)] rounded-full text-sm text-[var(--ui-text-toned)] mb-6">
                                <Icon icon="material-symbols:info-outline" width="16" height="16" />
                                <span>{{ requiredFeature }} 기능</span>
                            </div>
                            
                            <div v-else class="mb-6"></div>

                            <!-- 로그인 혜택 -->
                            <div class="bg-[var(--ui-bg-muted)] rounded-xl p-4 mb-6">
                                <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-3">로그인하면 할 수 있어요</h3>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
                                        <Icon icon="material-symbols:check-circle-outline" width="16" height="16" class="text-green-500 flex-shrink-0" />
                                        <span>위키 즐겨찾기 및 관리</span>
                                    </div>
                                    <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
                                        <Icon icon="material-symbols:check-circle-outline" width="16" height="16" class="text-green-500 flex-shrink-0" />
                                        <span>위키 편집 및 기여</span>
                                    </div>
                                    <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
                                        <Icon icon="material-symbols:check-circle-outline" width="16" height="16" class="text-green-500 flex-shrink-0" />
                                        <span>개인화된 사용 경험</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 액션 버튼들 -->
                            <div class="flex flex-col gap-3">
                                <!-- 로그인 버튼 -->
                                <button
                                    @click="handleLogin"
                                    class="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-primary-muted)] text-white rounded-xl hover:from-[var(--ui-primary-muted)] hover:to-[var(--ui-primary-elevated)] transition-all duration-200 shadow-lg hover:shadow-xl font-semibold group"
                                >
                                    <Icon icon="flat-color-icons:google" width="20" height="20" />
                                    <span>Google로 로그인</span>
                                    <Icon 
                                        icon="material-symbols:arrow-forward" 
                                        width="18" 
                                        height="18" 
                                        class="group-hover:translate-x-0.5 transition-transform duration-200" 
                                    />
                                </button>

                                <!-- 닫기 버튼 -->
                                <button
                                    @click="emit('close')"
                                    class="w-full px-6 py-3 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors duration-200 font-medium"
                                >
                                    나중에 하기
                                </button>
                            </div>
                        </div>

                        <!-- 하단 장식 -->
                        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--ui-primary)] via-[var(--ui-primary-muted)] to-[var(--ui-primary)]"></div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

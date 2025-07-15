<template>
    <div class="web-template">
        <!-- 브라우저 창 -->
        <div class="browser-window">
            <!-- 상단 제어 바 -->
            <div class="browser-header">
                <!-- 트래픽 라이트 (macOS 스타일) -->
                <div class="traffic-lights">
                    <div class="traffic-light close"></div>
                    <div class="traffic-light minimize"></div>
                    <div class="traffic-light maximize"></div>
                </div>
                
                <!-- 탭 영역 -->
                <div class="tab-area">
                    <div class="tab active">
                        <Icon icon="material-symbols:language" class="tab-icon" />
                        <span class="tab-title">{{ tabTitle || 'Plero Wiki' }}</span>
                        <Icon icon="material-symbols:close" class="tab-close" />
                    </div>
                    <div class="new-tab-button">
                        <Icon icon="material-symbols:add" />
                    </div>
                </div>
            </div>

            <!-- 주소 표시줄 및 네비게이션 -->
            <div class="browser-toolbar">
                <div class="nav-buttons">
                    <button class="nav-button" :disabled="!canGoBack">
                        <Icon icon="material-symbols:arrow-back" />
                    </button>
                    <button class="nav-button" :disabled="!canGoForward">
                        <Icon icon="material-symbols:arrow-forward" />
                    </button>
                    <button class="nav-button">
                        <Icon icon="material-symbols:refresh" />
                    </button>
                </div>
                
                <div class="address-bar">
                    <div class="security-indicator">
                        <Icon icon="material-symbols:lock" class="lock-icon" />
                    </div>
                    <div class="url">{{ url || 'https://plero.dev' }}</div>
                    <div class="bookmark-button">
                        <Icon icon="material-symbols:star-outline" />
                    </div>
                </div>

                <div class="browser-actions">
                    <button class="action-button">
                        <Icon icon="material-symbols:more-vert" />
                    </button>
                </div>
            </div>

            <!-- 콘텐츠 영역 -->
            <div class="browser-content">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
interface Props {
    tabTitle?: string
    url?: string
    canGoBack?: boolean
    canGoForward?: boolean
}

withDefaults(defineProps<Props>(), {
    tabTitle: 'Plero Wiki',
    url: 'https://plero.dev',
    canGoBack: false,
    canGoForward: false
})
</script>

<style scoped>
@reference '~/assets/css/main.css';

.web-template {
    @apply w-full h-full;
}

.browser-window {
    @apply w-full h-full rounded-lg overflow-hidden;
    background-color: var(--ui-bg);
    border: 1px solid var(--ui-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.browser-header {
    @apply flex items-center px-4 py-2;
    background-color: var(--ui-bg-muted);
    border-bottom: 1px solid var(--ui-border);
    min-height: 40px;
}

.traffic-lights {
    @apply flex items-center gap-2 mr-4;
}

.traffic-light {
    @apply w-3 h-3 rounded-full cursor-pointer transition-all duration-200;
}

.traffic-light.close {
    @apply bg-red-500 hover:bg-red-600;
}

.traffic-light.minimize {
    @apply bg-yellow-500 hover:bg-yellow-600;
}

.traffic-light.maximize {
    @apply bg-green-500 hover:bg-green-600;
}

.tab-area {
    @apply flex items-center flex-1;
}

.tab {
    @apply flex items-center gap-2 px-4 py-1 rounded-t-lg cursor-pointer transition-all duration-200;
    background-color: var(--ui-bg);
    border: 1px solid var(--ui-border);
    border-bottom: none;
    max-width: 200px;
}

.tab.active {
    background-color: var(--ui-bg);
    border-bottom: 1px solid var(--ui-bg);
    margin-bottom: -1px;
}

.tab-icon {
    @apply w-4 h-4 flex-shrink-0;
    color: var(--ui-text-muted);
}

.tab-title {
    @apply text-sm truncate;
    color: var(--ui-text);
}

.tab-close {
    @apply w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity;
    color: var(--ui-text-muted);
}

.tab:hover .tab-close {
    @apply opacity-100;
}

.new-tab-button {
    @apply flex items-center justify-center w-8 h-6 ml-2 rounded cursor-pointer transition-all duration-200;
    color: var(--ui-text-muted);
}

.new-tab-button:hover {
    background-color: var(--ui-bg-elevated);
    color: var(--ui-text);
}

.browser-toolbar {
    @apply flex items-center gap-3 px-4 py-2;
    background-color: var(--ui-bg);
    border-bottom: 1px solid var(--ui-border);
}

.nav-buttons {
    @apply flex items-center gap-1;
}

.nav-button {
    @apply flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200;
    color: var(--ui-text-muted);
}

.nav-button:hover:not(:disabled) {
    background-color: var(--ui-bg-elevated);
    color: var(--ui-text);
}

.nav-button:disabled {
    @apply opacity-30 cursor-not-allowed;
}

.address-bar {
    @apply flex items-center flex-1 px-3 py-1.5 rounded-full;
    background-color: var(--ui-bg-muted);
    border: 1px solid var(--ui-border);
}

.security-indicator {
    @apply flex items-center mr-2;
}

.lock-icon {
    @apply w-4 h-4;
    color: var(--ui-primary);
}

.url {
    @apply flex-1 text-sm truncate;
    color: var(--ui-text-toned);
}

.bookmark-button {
    @apply flex items-center ml-2 cursor-pointer;
    color: var(--ui-text-muted);
}

.bookmark-button:hover {
    color: var(--ui-warning);
}

.browser-actions {
    @apply flex items-center;
}

.action-button {
    @apply flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200;
    color: var(--ui-text-muted);
}

.action-button:hover {
    background-color: var(--ui-bg-elevated);
    color: var(--ui-text);
}

.browser-content {
    @apply flex-1 overflow-auto;
    background-color: var(--ui-bg);
}

/* 다크모드에서 더 나은 대비 */
.dark .browser-window {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dark .tab.active {
    background-color: var(--ui-bg);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .browser-header {
        @apply px-2;
    }
    
    .browser-toolbar {
        @apply px-2 gap-2;
    }
    
    .tab {
        @apply px-2;
        max-width: 120px;
    }
    
    .tab-title {
        @apply hidden;
    }
    
    .url {
        @apply text-xs;
    }
}
</style>
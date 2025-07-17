<script setup>
import Search from './common/Search.vue';
import ThemeToggle from './common/ThemeToggle.vue';
import LoginProfileBadge from './common/LoginProfileBadge.vue';
</script>

<template>
    <header class="h-16 w-full p-4 text-white text-2xl border-[1px]
     dark:bg-[var(--ui-bg)] dark:border-[var(--ui-border)] flex items-center justify-center">
        <div class="flex justify-between items-center gap-2 max-w-7xl w-full">
            <NuxtLink to="/" class="font-bold text-[var(--ui-primary)]">Plero</NuxtLink>
            <div class="flex items-center gap-4">
                <Search />
            </div>
            <div class="flex items-center gap-4">
                <ThemeToggle />
                <LoginProfileBadge />
            </div>
        </div>
    </header>
</template>
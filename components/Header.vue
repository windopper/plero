<script setup>
import Search from './common/Search.vue';
import ThemeToggle from './common/ThemeToggle.vue';

const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()
</script>

<template>
    <header class="h-16 w-full p-4 text-white text-2xl border-[1px]
     dark:bg-[var(--ui-bg)] dark:border-[var(--ui-border)]">
        <div class="flex justify-between items-center gap-4 max-w-7xl mx-auto">
            <div class="flex items-center gap-4">
                <NuxtLink to="/" class="text-2xl font-bold text-[var(--ui-primary)]">Plero</NuxtLink>
                <Search />
                <ThemeToggle />
            </div>
            <div class="flex items-center gap-4">
                <NuxtLink to="/login" v-if="!loggedIn">Login</NuxtLink>
                <NuxtLink to="/login" v-else>Logout</NuxtLink>
            </div>
        </div>
    </header>
</template>
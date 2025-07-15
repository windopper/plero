<template>
    <footer class="border-t-[1px] border-[var(--ui-border)] p-4 w-full">
        <div class="max-w-6xl mx-auto flex flex-row items-center justify-center flex-wrap gap-2 text-sm text-[var(--ui-text-muted)]">
            <p>Plero.</p>
            <NuxtLink to="https://github.com/windopper/plero" target="_blank" class="text-[var(--ui-text-muted)]">Github
            </NuxtLink>
            <div class="h-4 w-px bg-[var(--ui-border)]"></div>
            <span class="sub">오픈소스</span>
            <NuxtLink to="https://nuxt.com/" target="_blank" class="text-[var(--ui-text-muted)]">Nuxt 3</NuxtLink>
            <NuxtLink to="https://vuejs.org/" target="_blank" class="text-[var(--ui-text-muted)]">Vue.js</NuxtLink>
            <NuxtLink to="https://tailwindcss.com/" target="_blank" class="text-[var(--ui-text-muted)]">Tailwind CSS
            </NuxtLink>
            <NuxtLink to="https://iconify.design/" target="_blank" class="text-[var(--ui-text-muted)]">Iconify
            </NuxtLink>
            <NuxtLink to="https://www.postgresql.org/" target="_blank" class="text-[var(--ui-text-muted)]">PostgreSQL
            </NuxtLink>
            <NuxtLink to="https://orm.drizzle.team/" target="_blank" class="text-[var(--ui-text-muted)]">Drizzle
            </NuxtLink>
            <NuxtLink to="https://vitejs.dev/" target="_blank" class="text-[var(--ui-text-muted)]">Vite</NuxtLink>
            <NuxtLink to="https://imzbf.github.io/md-editor-v3/en-US" target="_blank"
                class="text-[var(--ui-text-muted)]">
                md-editor-v3</NuxtLink>
        </div>
    </footer>
</template>

<style scoped>
.sub {
    color: var(--ui-text-muted);
    font-weight: 700;
}
</style>
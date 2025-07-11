<template>
    <div class="sticky top-0 z-10 bg-[var(--ui-bg)] border-b-[1px] border-[var(--ui-border)]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center flex-wrap gap-4 py-4">
                <slot />
            </div>
        </div>
    </div>
</template>
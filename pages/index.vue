<script setup lang="ts">
import HorizontalDiagonalLine from '~/components/common/HorizontalDiagonalLine.vue';
</script>

<template>
    <div class="flex flex-col gap-4 py-16 border-x-[1px] border-[var(--ui-border)]">
        <div class="flex flex-col gap-4 px-2 horizontal-line md:text-6xl text-4xl">
            <h1 class="font-bold">누구나 만들 수 있는</h1>
            <h1 class="font-bold text-[var(--ui-primary)]">나만의 위키.</h1>
        </div>
        <p class="md:text-2xl text-lg text-[var(--ui-text-dimmed)] my-4 px-2">관심사, 설정, 일기, 잡학사전까지 — 원하는 주제로 쉽게 시작하세요.
        </p>
        <div class="flex gap-4 px-2 horizontal-line md:text-xl text-base">
            <button
                class="bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] px-4 py-2 rounded-md w-fit cursor-pointer"
                @click="navigateTo('/wiki/create')">시작하기</button>
            <button class="hover:bg-[var(--ui-bg-accented)] text-[var(--ui-text)] px-4 py-2 rounded-md w-fit cursor-pointer
                border-[1px] border-[var(--ui-border)] hover:border-[var(--ui-border-accented)] transition-all duration-300
                ">다른 위키
                보러가기</button>
        </div>
        <HorizontalDiagonalLine />
    </div>
</template>

<style>
.horizontal-line {
    position: relative;
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -50vw;
        width: 200vw;
        height: 1px;
        background-color: var(--ui-border);
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -50vw;
        width: 200vw;
        height: 1px;
        background-color: var(--ui-border);
    }
}

.vertical-line {
    position: relative;
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
    }
}
</style>
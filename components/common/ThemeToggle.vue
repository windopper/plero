<script setup>
import SolarSunBoldDuotone from '../icon/SolarSunBoldDuotone.vue';
import SolarMoonBold from '../icon/SolarMoonBold.vue';
const colorMode = useColorMode();
</script>

<template>
    <button @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        class="p-2 cursor-pointer rounded-md hover:bg-[var(--ui-bg-accented)]">
        <SolarSunBoldDuotone v-if="colorMode.value === 'light'" class="text-[var(--ui-text)] w-5 h-5" />
        <SolarMoonBold v-else class="text-[var(--ui-text)] w-5 h-5" />
    </button>
</template>

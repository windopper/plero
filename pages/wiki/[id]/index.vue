<script setup>
import Container from '~/components/wiki/Container.vue';
import Sidebar from '~/components/wiki/Sidebar.vue';
import Topbar from '~/components/wiki/Topbar.vue';

const route = useRoute()
const id = route.params.id

const { data: response } = await useAsyncData(`/api/wiki?id=${id}`, async () => {
    const response = await $fetch(`/api/wiki?id=${id}`)
    const ast = await parseMarkdown(response)
    return ast
})
    
</script>

<template>
    <Container>
        <div class="flex flex-col w-full">
            <div class="border-b-[1px] border-[var(--ui-border)] px-2 py-1">
                <Topbar />
            </div>
            <div class="max-w-5xl w-full px-2 p-4">
                <MDCRenderer v-if="response" :body="response.body" :data="response.data"
                    class="prose-zinc prose-base overflow-x-hidden py-2" />
            </div>
        </div>
        <div class="min-w-80 border-l-[1px] border-[var(--ui-border)]">
            <Sidebar />
        </div>
    </Container>
</template>
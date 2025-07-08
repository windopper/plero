<script setup>
import { Icon } from '@iconify/vue'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const route = useRoute()
const id = route.params.id

const { data: wiki } = await useFetch(`/api/wiki?id=${id}`)

const content = ref(wiki.value || "")

const ast = ref(null)
watch(content, async () => {
    ast.value = await parseMarkdown(content.value)
    console.log(ast.value)
}, {
    immediate: true
})

const saveLoading = ref(false)
const save = async () => {
    saveLoading.value = true
    const res = await $fetch(`/api/wiki`, {
        method: "POST",
        body: { id: id, content: content.value }
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("response : "+ res.content)
    saveLoading.value = false
    navigateTo(`/wiki/${id}`)   
}
</script>

<template>
    <div class="flex flex-col border-x-[1px] border-[var(--ui-border)]">
        <div class="w-full px-2 py-2 border-b-[1px] border-[var(--ui-border)] flex flex-row gap-4 justify-end">
            <button
                class="px-2 py-1 rounded-md bg-[var(--ui-primary-muted)] w-fit flex flex-row gap-2
                 items-center cursor-pointer" @click="save" :style="{ opacity: saveLoading ? 0.5 : 1, pointerEvents: saveLoading ? 'none' : 'auto' }">
                <Icon v-if="!saveLoading" icon="material-symbols:save" width="24" height="24" />
                <Icon v-else icon="line-md:loading-loop" width="24" height="24" />
                <span>저장</span>
            </button>
        </div>
        <div class="flex flex-row ">
            <div class="flex flex-col w-1/2 min-h-screen p-2">
                <div class="px-2 py-1 rounded-md bg-[var(--ui-bg-muted)] w-fit">
                    Editor
                </div>
                <textarea v-model="content" class="w-full h-full py-2 outline-none" />
            </div>
            <div class="w-1/2 border-l-[1px] border-[var(--ui-border)] p-2">
                <div class="px-2 py-1 rounded-md bg-[var(--ui-bg-muted)] w-fit">
                    Preview
                </div>
                <MDCRenderer v-if="ast" :body="ast.body" :data="ast.data"
                    class="prose-zinc prose-base overflow-x-hidden py-2" />
            </div>
        </div>
    </div>
</template>
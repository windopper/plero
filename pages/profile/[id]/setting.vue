<script setup lang="ts">
import ContentHeader from '~/components/common/ContentHeader.vue';
import NavigationTitle from '~/components/common/NavigationTitle.vue';
const route = useRoute();
const { id } = route.params;

</script>

<template>
    <ContentHeader title="설정" >
        <NavigationTitle title="설정" backButton :navigatePath="`/profile/${id}`" />
    </ContentHeader>
</template>
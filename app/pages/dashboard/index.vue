<template>
    <div class="space-y-4">
       

        <div class="p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            Welcome to dashboard
        </div>
    </div>

</template>

<script lang="ts" setup>
definePageMeta({
    layout: "dashboard",
    middleware: 'auth',
})
</script>
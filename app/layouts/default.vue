<script lang="ts" setup>
</script>

<template>
    <div >
        <!-- <BaseNavigation /> -->

        <main class="flex-1">
            <slot />
        </main>

        <BaseFooter />

        <div class="fixed top-4 right-4 lg:right-12 z-50">
            <BaseThemeToggle />
        </div>
        
        <BaseToast />

    </div>
</template>

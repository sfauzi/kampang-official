<script lang="ts" setup>
const route = useRoute()
const { isAuthenticated } = useAuth()
const { isOpen, isPersistent, open, close } = useLoginModal()

const guardedPrefixes = ['/albums', '/groups', '/memories', '/users']

const requiresLoginGate = computed(() =>
    guardedPrefixes.some((prefix) => route.path === prefix || route.path.startsWith(`${prefix}/`))
)

watch(
    [requiresLoginGate, isAuthenticated, () => route.fullPath],
    ([requiresAuth, authenticated, fullPath]) => {
        if (requiresAuth && !authenticated) {
            open(fullPath, { persistent: true })
            return
        }

        if (isOpen.value && isPersistent.value) {
            close(true)
        }
    },
    { immediate: true }
)
</script>

<template>
    <div>
        <BaseNavigation />

        <main class="flex-1">
            <slot />
        </main>

        <BaseFooter />

        <!-- <div class="fixed top-4 right-4 lg:right-12 z-50">
            <BaseThemeToggle />
        </div> -->

        <BaseToast />
        <BaseConfirm />
        <LoginModal />
    </div>
</template>

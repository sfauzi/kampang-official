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

// --- Protection: non-select / non-copy / block inspect shortcuts when guarded + not auth
const isProtectionActive = computed(() => requiresLoginGate.value && !isAuthenticated.value)

const isInsideLoginModal = (target: EventTarget | null) => {
    try {
        const t = target as Node | null
        const modal = document.querySelector('.login-modal-root')
        return !!(modal && t && modal.contains(t))
    } catch {
        return false
    }
}

const onContextMenu = (e: Event) => {
    if (!isProtectionActive.value) return
    if (isInsideLoginModal(e.target)) return
    e.preventDefault()
}

const onCopyCutPaste = (e: Event) => {
    if (!isProtectionActive.value) return
    if (isInsideLoginModal(e.target)) return
    e.preventDefault()
}

const onSelectStart = (e: Event) => {
    if (!isProtectionActive.value) return
    if (isInsideLoginModal(e.target)) return
    e.preventDefault()
}

const onDragStart = (e: Event) => {
    if (!isProtectionActive.value) return
    if (isInsideLoginModal(e.target)) return
    e.preventDefault()
}

const onKeyDownProtect = (e: KeyboardEvent) => {
    if (!isProtectionActive.value) return
    if (isInsideLoginModal(e.target)) return

    const key = e.key.toLowerCase()
    // Block common inspect / view-source / save / copy / select all / devtools
    if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && (
            key === 'u' || // view source
            key === 's' || // save
            key === 'c' || // copy
            key === 'a' || // select all
            (e.shiftKey && ['i','j','c','k'].includes(key)) // ctrl+shift+I / J / C / K
        ))
    ) {
        e.preventDefault()
        e.stopPropagation()
    }
}

onMounted(() => {
    // toggle CSS class for user-select via watcher
    const stopWatch = watch(isProtectionActive, (v) => {
        document.documentElement.classList.toggle('no-copy-protect', !!v)
    }, { immediate: true })

    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('copy', onCopyCutPaste, true)
    document.addEventListener('cut', onCopyCutPaste, true)
    document.addEventListener('paste', onCopyCutPaste, true)
    document.addEventListener('selectstart', onSelectStart, true)
    document.addEventListener('dragstart', onDragStart, true)
    document.addEventListener('keydown', onKeyDownProtect, true)

    onUnmounted(() => {
        stopWatch()
        document.removeEventListener('contextmenu', onContextMenu, true)
        document.removeEventListener('copy', onCopyCutPaste, true)
        document.removeEventListener('cut', onCopyCutPaste, true)
        document.removeEventListener('paste', onCopyCutPaste, true)
        document.removeEventListener('selectstart', onSelectStart, true)
        document.removeEventListener('dragstart', onDragStart, true)
        document.removeEventListener('keydown', onKeyDownProtect, true)
    })
})
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

<style global>
/* Global protection: disable text selection / touch callout, but allow inside login modal */
.no-copy-protect, .no-copy-protect * {
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}

/* Allow interactions inside login modal (so modal remains usable) */
.no-copy-protect .login-modal-root,
.no-copy-protect .login-modal-root * {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
  -webkit-touch-callout: default !important;
}
</style>

<!-- components/Base/BaseConfirm.vue -->
<script lang="ts" setup>
const { state, handleConfirm, handleCancel } = useConfirm()

const colorMap = {
    danger: {
        icon: 'heroicons:exclamation-triangle-20-solid',
        iconClass: 'text-red-500 dark:text-red-400',
        iconBg: 'bg-red-100 dark:bg-red-950',
        confirmBtn:
            'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white',
    },
    warning: {
        icon: 'heroicons:exclamation-circle-20-solid',
        iconClass: 'text-amber-500 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-950',
        confirmBtn:
            'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white',
    },
    info: {
        icon: 'heroicons:information-circle-20-solid',
        iconClass: 'text-stone-500 dark:text-stone-400',
        iconBg: 'bg-stone-100 dark:bg-stone-800',
        confirmBtn:
            'bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-stone-300 dark:text-stone-900 text-white',
    },
}

const current = computed(
    () => colorMap[state.value.options.type ?? 'danger']
)
</script>

<template>
    <Teleport to="body">
        <Transition name="confirm-overlay">
            <div v-if="state.open"
                class="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click.self="handleCancel">
                <Transition name="confirm-modal">
                    <div v-if="state.open"
                        class="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700/50 overflow-hidden">
                        <!-- Body -->
                        <div class="p-6">
                            <div class="flex items-start gap-4">
                                <!-- Icon -->
                                <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                                    :class="current.iconBg">
                                    <Icon :name="current.icon" class="w-5 h-5" :class="current.iconClass" />
                                </div>

                                <!-- Text -->
                                <div class="flex-1 min-w-0">
                                    <h3 v-if="state.options.title"
                                        class="text-base font-semibold text-stone-900 dark:text-stone-50 mb-1">
                                        {{ state.options.title }}
                                    </h3>
                                    <p class="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                                        {{ state.options.message }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="px-6 pb-6 flex gap-3 justify-end">
                            <button @click="handleCancel" class="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg
                       text-stone-600 dark:text-stone-400
                       border border-stone-200 dark:border-stone-700
                       hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                                {{ state.options.cancelText ?? 'Batal' }}
                            </button>
                            <button @click="handleConfirm"
                                class="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition"
                                :class="current.confirmBtn">
                                {{ state.options.confirmText ?? 'Ya, lanjutkan' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.confirm-overlay-enter-active,
.confirm-overlay-leave-active {
    transition: opacity 0.2s ease;
}

.confirm-overlay-enter-from,
.confirm-overlay-leave-to {
    opacity: 0;
}

.confirm-modal-enter-active {
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-modal-leave-active {
    transition: all 0.18s ease-in;
}

.confirm-modal-enter-from {
    opacity: 0;
    transform: scale(0.92) translateY(8px);
}

.confirm-modal-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(4px);
}
</style>
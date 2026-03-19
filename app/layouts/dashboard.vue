<template>
  <div
    class="min-h-screen flex flex-col font-Manrope transition-colors duration-300"
    :class="isDark ? 'bg-stone-950' : 'bg-stone-50'"
  >

    <!-- Navbar — sticky top-0 -->
    <BaseNavigation @toggle-sidebar="sidebarRef?.openMobile()" />

    <div class="flex flex-1">

      <!-- Sidebar (self-managed collapse di desktop, drawer di mobile) -->
      <BaseSidebar ref="sidebarRef" :is-open="false" @close="() => {}" />

      <!-- Main content -->
      <main class="flex-1 min-w-0 p-4 lg:p-6">
        <slot />
      </main>

    </div>

    <BaseFooter />

    <!-- Theme Toggle -->
    <div class="fixed top-4 right-4 lg:right-12 z-50">
      <BaseThemeToggle />
    </div>

    <BaseToast />
    <BaseConfirm />

  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BaseSidebar from '~/components/Dashboard/BaseSidebar.vue'
import BaseFooter from '~/components/Dashboard/BaseFooter.vue'
import BaseNavigation from '~/components/Dashboard/BaseNavigation.vue'

const { isDark } = useTheme()
const sidebarRef = ref<InstanceType<typeof BaseSidebar> | null>(null)
</script>
<!-- pages/index.vue -->

<script lang="ts" setup>
const { isAuthenticated, loginWithGoogle, init } = useAuth();

onMounted(() => {
  init();
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-6 px-4 text-center"
  >
    <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
      Selamat Datang di <span class="text-blue-600 font-Mansalva">MyApp</span>
    </h1>

    <p class="text-gray-500 text-lg max-w-md">
      Masuk dengan akun Google untuk mengakses fitur lengkap.
    </p>

    <template v-if="!isAuthenticated">
      <button
        class="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-base font-medium shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
        @click="loginWithGoogle"
      >
        <Icon name="logos:google-icon" class="w-5 h-5" />
        Login dengan Google
      </button>
    </template>

    <template v-else>
      <NuxtLink
        to="/profile"
        class="px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition"
      >
        Lihat Profil Saya →
      </NuxtLink>
    </template>
  </div>
</template>

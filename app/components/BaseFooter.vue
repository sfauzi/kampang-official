<script lang="ts" setup>
const socials = [
  { name: "Instagram", url: "https://instagram.com/officialkampang" },
  { name: "Youtube", url: "https://youtube.com/@officialkampang" },
]
</script>

<template>
  <footer class="border-t border-stone-300 dark:border-stone-800 mt-10 max-w-6xl mx-auto px-6 sm:px-6 py-6 transition-colors duration-300">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div
        class="flex flex-col items-center text-center gap-4 
               md:flex-row md:items-center md:justify-between md:text-left"
      >
        
        <!-- Social Media -->
        <ul class="flex justify-center md:justify-start gap-4 text-sm">
          <li v-for="social in socials" :key="social.name">
            <a
              :href="social.url"
              class="text-stone-600 hover:text-stone-800 hover:font-semibold dark:text-stone-400 dark:hover:text-stone-300 transition-colors duration-200"
            >
              {{ social.name }}
            </a>
          </li>
        </ul>

        <!-- Copyright -->
        <p class="text-stone-700 dark:text-stone-300">
          Copyright &copy; 2026 Kampang Official - Powered by 
          <a href="https://sfauzi.dev" class="hover:underline transition-colors duration-200 font-mansalva">
            sfauzi.dev
          </a>
        </p>

      </div>

    </div>
  </footer>
</template>
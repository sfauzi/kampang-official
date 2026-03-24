<!-- pages/albums/index.vue -->
<!--
  Lokasi  : pages/albums/index.vue
  Layout  : default
  Akses   : Publik (tanpa login)
  Fungsi  : Daftar album kenangan.
            - Tanpa login → hanya privacy=public
            - Dengan login → public + grup yang diikuti + kontributor
            Undangan pending hanya muncul saat login.
-->
<script setup lang="ts">
definePageMeta({ layout: "default" });

const {
  albums,
  pagination,
  loading,
  error,
  fetchAlbums,
  respondInvitation,
} = useAlbums();
const { isAuthenticated } = useAuth();
const toast = useToast();

const category = ref("");
const collab = ref("");
const page = ref(1);

const load = () =>
  fetchAlbums({
    category: category.value || undefined,
    is_collaborative:
      collab.value === "true" ? true : collab.value === "false" ? false : undefined,
    page: page.value,
    per_page: 15,
  });

watch([category, collab], () => {
  page.value = 1;
  load();
});
watch(page, load);
onMounted(load);

const handleRespond = async (
  albumId: string,
  status: "accepted" | "declined",
  title: string
) => {
  const ok = await respondInvitation(albumId, status);
  if (ok) {
    toast.success(
      status === "accepted"
        ? `Kamu kini menjadi kontributor "${title}"!`
        : "Undangan ditolak."
    );
    load();
  } else {
    toast.error(error.value ?? "Gagal merespons undangan.");
  }
};

const { open: openLoginModal } = useLoginModal()

function handleProfileClick() {
  if (!isAuthenticated.value) {
    openLoginModal() // tanpa argumen → pakai halaman saat ini
  }
}

const { formatDate } = useFormatDate()

</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Album Kenangan</h1>
        <p v-if="!isAuthenticated" class="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Icon name="heroicons:eye" class="w-3.5 h-3.5" />
          Menampilkan album publik ·
          <button @click="handleProfileClick" class="cursor-pointer text-amber-500 hover:underline font-semibold">Login</button>
          untuk melihat lebih banyak
        </p>
      </div>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/albums/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all duration-200"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Buat Album
      </NuxtLink>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <select
        v-model="category"
        class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-700 dark:text-gray-300 text-sm focus:outline-none transition appearance-none cursor-pointer"
      >
        <option value="">Semua Kategori</option>
        <option value="school">Sekolah</option>
        <option value="hiking">Pendakian</option>
        <option value="traveling">Traveling</option>
        <option value="other">Lainnya</option>
      </select>
      <select
        v-model="collab"
        class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-700 dark:text-gray-300 text-sm focus:outline-none transition appearance-none cursor-pointer"
      >
        <option value="">Semua Tipe</option>
        <option value="true">Kolaboratif</option>
        <option value="false">Personal</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 8"
        :key="i"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse"
      >
        <div class="aspect-square bg-gray-100 dark:bg-neutral-800" />
        <div class="p-3 space-y-2">
          <div class="h-3.5 bg-gray-100 dark:bg-neutral-800 rounded-lg w-3/4" />
          <div class="h-3 bg-gray-100 dark:bg-neutral-800 rounded-lg w-1/2" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm"
    >
      <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!albums.length"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <Icon name="heroicons:book-open" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
      </div>
      <p class="text-sm text-gray-400">Belum ada album yang bisa ditampilkan.</p>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/albums/create"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
      >
        <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
        Buat Album Pertama
      </NuxtLink>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <article
        v-for="album in albums"
        :key="album.id"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        <!-- Banner undangan pending -->
        <div
          v-if="isAuthenticated && album.contributor_status === 'pending'"
          class="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 px-3 py-2.5"
        >
          <p class="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-2">
            <Icon name="heroicons:envelope" class="w-3.5 h-3.5" />
            Undangan kolaborasi
          </p>
          <div class="flex gap-1.5">
            <button
              class="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition"
              @click="handleRespond(album.id, 'accepted', album.title)"
            >
              <Icon name="heroicons:check" class="w-3 h-3" />
              Terima
            </button>
            <button
              class="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
              @click="handleRespond(album.id, 'declined', album.title)"
            >
              <Icon name="heroicons:x-mark" class="w-3 h-3" />
              Tolak
            </button>
          </div>
        </div>

        <NuxtLink :to="`/albums/${album.id}`" class="block">
          <!-- Cover -->
          <div class="aspect-square bg-gray-100 dark:bg-[#101010] overflow-hidden">
            <img
              v-if="album.cover_media?.url"
              :src="album.cover_media.url"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-12 h-12 text-gray-300 dark:text-neutral-700" />
            </div>
          </div>

          <!-- Info -->
          <div class="p-3">
            <p class="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 mb-0.5">
              {{ album.title }}
            </p>
            <p class="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <Icon name="heroicons:photo" class="w-3 h-3" />
              {{ album.memories_count ?? 0 }} kenangan
              <template v-if="album.event_date">
                <span class="text-gray-300 dark:text-neutral-700">·</span>
                <Icon name="heroicons:calendar-days" class="w-3 h-3" />
                {{ formatDate(album.event_date) }}
              </template>
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                v-if="album.is_collaborative"
                class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
              >
                <Icon name="heroicons:user-group" class="w-2.5 h-2.5" />
                Kolaboratif
              </span>
              <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#101010] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-800">
                <Icon name="heroicons:tag" class="w-2.5 h-2.5" />
                {{ album.category }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.last_page > 1"
      class="flex justify-center gap-2 mt-8"
    >
      <button
        v-for="p in pagination.last_page"
        :key="p"
        class="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="p === pagination.current_page
          ? 'bg-amber-500 text-white shadow-sm'
          : 'bg-white dark:bg-[#181818] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 hover:text-amber-500'"
        @click="page = p"
      >
        {{ p }}
      </button>
    </div>

    <BaseToast />
  </div>
</template>
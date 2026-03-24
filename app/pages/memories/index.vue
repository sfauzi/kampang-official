<!-- pages/memories/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: "default" });

const {
  memories,
  pagination,
  loading,
  error,
  fetchMemories,
  toggleReaction,
} = useMemories();
const { isAuthenticated } = useAuth();
const toast = useToast();
const { listen } = useMemoryChannel()
const { open: openLoginModal } = useLoginModal()
const { formatDateLong } = useFormatDate()

const category = ref("");
const sort = ref<"memory_date" | "created_at">("memory_date");
const page = ref(1);

const load = () =>
  fetchMemories({
    category: category.value || undefined,
    sort: sort.value,
    page: page.value,
    per_page: 12,
  });

watch([category, sort], () => {
  page.value = 1;
  load();
});
watch(page, load);
onMounted(load);

onMounted(async () => {
  await fetchMemories({ /* params yang sudah ada */ })
})

// Pasang listener BroadcastChannel
onMounted(() => {
  const unlisten = listen((event) => {
    if (event.type === 'created') {
      if (!memories.value.find(m => m.id === event.memory.id)) memories.value.unshift(event.memory)
    } else if (event.type === 'updated') {
      const idx = memories.value.findIndex(m => m.id === event.memory.id)
      if (idx !== -1) memories.value[idx] = event.memory
    } else if (event.type === 'deleted') {
      memories.value = memories.value.filter(m => m.id !== event.id)
    } else if (event.type === 'pin_toggled') {
      const m = memories.value.find(x => x.id === event.id)
      if (m) m.is_pinned = event.is_pinned
    } else if (event.type === 'reaction_toggled') {
      const m = memories.value.find(x => x.id === event.memoryId)
      if (m) {
        m.reactions_count = event.total
        m.my_reaction = event.reacted ? event.reactionType : null
      }
    } else if (event.type === 'comment_added') {
      const m = memories.value.find(x => x.id === event.memoryId)
      if (m) m.comments_count = (m.comments_count ?? 0) + 1
    } else if (event.type === 'comment_deleted') {
      const m = memories.value.find(x => x.id === event.memoryId)
      if (m) m.comments_count = Math.max(0, (m.comments_count ?? 0) - 1)
    }
  })

  onUnmounted(unlisten) // cleanup saat halaman di-destroy
})

const handleReaction = async (memoryId: string, type: any) => {
  if (!isAuthenticated.value) {
    toast.error("Login untuk bereaksi.");
    return;
  }
  await toggleReaction(memoryId, type);
};

const categoryOptions = [
  { label: "Semua", value: "", icon: "heroicons:squares-2x2" },
  { label: "Sekolah", value: "school", icon: "heroicons:academic-cap" },
  { label: "Pendakian", value: "hiking", icon: "heroicons:map" },
  { label: "Traveling", value: "traveling", icon: "heroicons:globe-alt" },
  { label: "Lainnya", value: "other", icon: "heroicons:star" },
];

const reactionEmoji: Record<string, string> = {
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  nostalgic: "🥹",
};

const privacyBadgeClass = (privacy: string) => {
  if (privacy === "group")
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (privacy === "private")
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "";
};

// Dipanggil saat klik profile — tidak perlu kirim redirect, 
// useLoginModal.open() otomatis capture route.fullPath saat itu
function handleProfileClick() {
  if (!isAuthenticated.value) {
    openLoginModal() // tanpa argumen → pakai halaman saat ini
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10 rounded-3xl px-4 py-8 font-manrope bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Timeline Kenangan
        </h1>
        <p v-if="!isAuthenticated" class="text-xs text-gray-400 mt-1">
          Menampilkan kenangan publik ·
          <button class="text-amber-400 cursor-pointer font-semibold hover:underline"
            @click="handleProfileClick"
          >
            Login
          </button>
          untuk melihat lebih banyak
        </p>
      </div>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/memories/create"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm"
      >
        <Icon name="heroicons:plus-16-solid" class="w-4 h-4" />
        Tambah Kenangan
      </NuxtLink>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 mb-6 items-center">
      <button
        v-for="opt in categoryOptions"
        :key="opt.value"
        class="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200"
        :class="
          category === opt.value
            ? 'bg-amber-500 text-white font-semibold'
            : 'bg-gray-100 dark:bg-[#101010] text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500'
        "
        @click="category = opt.value"
      >
        <Icon :name="opt.icon" class="w-3.5 h-3.5" />
        {{ opt.label }}
      </button>
      <select
        v-model="sort"
        class="ml-auto px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#101010] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/40 transition"
      >
        <option value="memory_date">Urut Tanggal Kenangan</option>
        <option value="created_at">Urut Terbaru Diupload</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-2xl animate-pulse bg-gray-100 dark:bg-[#101010] h-64"
      />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
    >
      <Icon name="heroicons:exclamation-circle" class="w-5 h-5 shrink-0" />
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="!memories.length" class="text-center py-24">
      <div
        class="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-[#101010] flex items-center justify-center mx-auto mb-5"
      >
        <Icon name="heroicons:photo" class="w-10 h-10 text-brand" />
      </div>
      <p class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        Belum ada kenangan
      </p>
      <p class="text-sm text-gray-400 mb-6">Belum ada kenangan yang bisa ditampilkan.</p>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/memories/create"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Icon name="heroicons:plus-16-solid" class="w-4 h-4" />
        Tambah Kenangan Pertama
      </NuxtLink>
    </div>

    <!-- Timeline cards -->
    <div v-else class="space-y-6">
      <article
        v-for="m in memories"
        :key="m.id"
        class="bg-white dark:bg-[#181818] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
      >
        <!-- User + date -->
        <div class="flex items-center gap-3 p-4 pb-3">
          <img
            :src="m.user?.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(m.user?.name)}`"
            class="w-10 h-10 rounded-full object-cover ring-2 ring-brand/20"
          />
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/users/${m.user?.id}`"
              class="font-semibold text-sm text-gray-900 dark:text-white hover:text-brand transition-colors"
            >
              {{ m.user?.name }}
            </NuxtLink>
            <p class="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Icon name="heroicons:calendar-days" class="w-3 h-3 shrink-0" />
              {{ formatDateLong(m.memory_date) }}
              <template v-if="m.location?.name">
                <span>·</span>
                <Icon name="heroicons:map-pin" class="w-3 h-3 shrink-0" />
                {{ m.location.name }}
              </template>
            </p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#101010] text-gray-600 dark:text-gray-300 capitalize"
            >
              {{ m.category }}
            </span>
            <span
              v-if="isAuthenticated && m.privacy !== 'public'"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="privacyBadgeClass(m.privacy)"
            >
              {{ m.privacy === "group" ? "Grup" : "Privat" }}
            </span>
          </div>
        </div>

        <!-- Media grid -->
        <NuxtLink :to="`/memories/${m.id}`">
          <div
            v-if="m.media && m.media.length"
            class="grid gap-0.5"
            :class="{
              'grid-cols-1': m.media.length === 1,
              'grid-cols-2': m.media.length === 2,
              'grid-cols-3': m.media.length >= 3,
            }"
          >
            <div
              v-for="(media, i) in m.media.slice(0, 3)"
              :key="media.id"
              class="relative overflow-hidden bg-gray-100 dark:bg-gray-800"
              :class="m.media.length === 1 ? 'h-80' : 'h-48'"
            >
              <img
                :src="media.thumbnail_url ?? media.url"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div
                v-if="i === 2 && m.media.length > 3"
                class="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold"
              >
                +{{ m.media.length - 3 }}
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-14 bg-gray-50 dark:bg-[#101010] flex items-center justify-center text-gray-400 text-sm gap-2"
          >
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            Lihat kenangan
          </div>
        </NuxtLink>

        <!-- Caption + tags -->
        <div class="p-4 pt-3">
          <p
            v-if="m.title"
            class="font-semibold text-gray-900 dark:text-white mb-1"
          >
            {{ m.title }}
          </p>
          <p
            v-if="m.caption"
            class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed"
          >
            {{ m.caption }}
          </p>
          <div v-if="m.tags && m.tags.length" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="tag in m.tags"
              :key="tag.id"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              #{{ tag.name }}
            </span>
          </div>
        </div>

        <!-- Reaction bar -->
        <div
          class="px-4 pb-4 flex items-center gap-3 border-t border-gray-50 dark:border-neutral-800 pt-3"
        >
          <div class="flex gap-0.5">
            <button
              v-for="(emoji, type) in reactionEmoji"
              :key="type"
              class="text-xl cursor-pointer transition-all duration-200 px-1 py-0.5 rounded-lg hover:scale-125 hover:bg-amber-100 dark:hover:bg-amber-900/20"
              :class="
                m.my_reaction === type
                  ? 'opacity-100 scale-110'
                  : 'opacity-40 hover:opacity-80'
              "
              :title="isAuthenticated ? String(type) : 'Login untuk bereaksi'"
              @click="handleReaction(m.id, type)"
            >
              {{ emoji }}
            </button>
          </div>
          <span class="text-xs text-gray-400">{{ m.reactions_count ?? 0 }} reaksi</span>
          <NuxtLink
            :to="`/memories/${m.id}`"
            class="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand transition-colors"
          >
            <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-4 h-4" />
            {{ m.comments_count ?? 0 }} komentar
          </NuxtLink>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.last_page > 1"
      class="flex justify-center gap-2 mt-10"
    >
      <button
        v-for="p in pagination.last_page"
        :key="p"
        class="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="
          p === pagination.current_page
            ? 'bg-brand text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-brand'
        "
        @click="page = p"
      >
        {{ p }}
      </button>
    </div>

    <BaseToast />
  </div>
</template>

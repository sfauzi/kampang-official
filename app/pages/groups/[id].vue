<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { group, members, loading, error, fetchGroup, fetchMembers, joinGroup, leaveGroup, updateMemberRole } = useGroups()
const { memories, fetchMemories } = useMemories()
const { isAuthenticated, user } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const id = route.params.id as string
const activeTab = ref<'memories' | 'members'>('memories')
const alreadyJoinedMessage = 'Kamu sudah bergabung di grup ini.'

onMounted(async () => {
  await fetchGroup(id)
  await fetchMembers(id)
  await fetchMemories({ group_id: id, per_page: 12 })
})

const isOwner = computed(() => group.value?.my_role === 'owner')
const isAdmin = computed(() => ['owner', 'admin'].includes(group.value?.my_role ?? ''))
const isMember = computed(() => {
  const currentGroup = group.value
  if (!currentGroup) return false
  return currentGroup.my_status === 'active' || ['owner', 'admin', 'member'].includes(currentGroup.my_role ?? '')
})
const pageError = computed(() => (group.value ? null : error.value))

const handleJoin = async () => {
  if (!isAuthenticated.value) return navigateTo('/login')
  const msg = await joinGroup(id)
  if (msg) {
    if (msg === alreadyJoinedMessage) toast.info(msg)
    else toast.success(msg)
    error.value = null
    await fetchGroup(id)
    return
  }
  const message = error.value ?? 'Gagal bergabung.'
  if (message === alreadyJoinedMessage) {
    toast.info(message)
    error.value = null
    await fetchGroup(id)
    return
  }
  toast.error(message)
  error.value = null
}

const handleLeave = async () => {
  const ok = await confirm({
    title: 'Keluar dari grup?',
    message: `Kamu akan keluar dari grup "${group.value?.name}".`,
    confirmText: 'Ya, keluar',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await leaveGroup(id)
  if (success) { toast.success('Berhasil keluar.'); await fetchGroup(id) }
  else toast.error(error.value ?? 'Gagal keluar.')
}

const handleBanMember = async (memberId: string) => {
  const ok = await confirm({
    title: 'Ban anggota?',
    message: 'Anggota ini akan diblokir dari grup.',
    confirmText: 'Ya, ban',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  await updateMemberRole(id, memberId, 'member', 'banned')
  toast.success('Anggota berhasil dibanned.')
  await fetchMembers(id)
}

const { open: openLoginModal } = useLoginModal()

// useLoginModal.open() otomatis capture route.fullPath saat itu
function handleProfileClick() {
  if (!isAuthenticated.value) {
    openLoginModal() // tanpa argumen → pakai halaman saat ini
  }
}
</script>

<template>
  <div class="font-[Manrope]">

    <!-- Skeleton -->
    <div v-if="loading" class="animate-pulse lg:pl-16">
      <div class="h-52 sm:h-64 bg-gray-200 dark:bg-neutral-800" />
      <div class="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-xl w-2/3" />
        <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-xl w-1/2" />
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
          <div v-for="i in 8" :key="i" class="aspect-square bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="pageError"
      class="lg:pl-16 max-w-3xl mx-auto px-4 py-12 flex flex-col items-center gap-3 text-center"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
        <Icon name="heroicons:exclamation-circle" class="w-7 h-7 text-red-400" />
      </div>
      <p class="text-sm text-red-500 dark:text-red-400">{{ pageError }}</p>
    </div>

    <div v-else-if="group" class="animate-[fadeIn_0.4s_ease_forwards]">

      <!-- ── Hero: offset sidebar di desktop ── -->
      <div class="lg:pl-16">
        <div class="relative h-52 sm:h-64 bg-gray-200 dark:bg-neutral-800 overflow-hidden">
          <img
            v-if="group.cover_image"
            :src="group.cover_image"
            :alt="group.name"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div class="absolute inset-0 flex items-end p-6">
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl sm:text-3xl font-bold text-white leading-tight">{{ group.name }}</h1>
              <p class="text-white/60 text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span v-if="group.location?.name" class="flex items-center gap-1">
                  <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
                  {{ group.location.name }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:users" class="w-3.5 h-3.5" />
                  {{ group.members_count }} anggota
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:photo" class="w-3.5 h-3.5" />
                  {{ group.memories_count }} kenangan
                </span>
              </p>
            </div>
            <div v-if="isAdmin" class="shrink-0 ml-4">
              <NuxtLink
                :to="`/dashboard/groups/${id}/edit`"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold transition border border-white/20"
              >
                <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
                Edit Grup
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Konten utama: offset sidebar di desktop ── -->
      <div class="lg:pl-16">
        <div class="max-w-5xl mx-auto px-4 py-6">

          <!-- Description + action -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6 bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800">
            <p class="flex-1 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {{ group.description ?? 'Belum ada deskripsi.' }}
            </p>
            <div class="shrink-0 flex items-start">
              <template v-if="isAuthenticated">
                <button
                  v-if="isMember && !isOwner"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-sm font-semibold transition border border-gray-200 dark:border-neutral-800"
                  @click="handleLeave"
                >
                  <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
                  Keluar Grup
                </button>
                <button
                  v-else-if="group.my_status === 'pending'"
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#101010] text-gray-400 dark:text-neutral-600 text-sm font-semibold border border-gray-200 dark:border-neutral-800 cursor-not-allowed opacity-60"
                  disabled
                >
                  <Icon name="heroicons:clock" class="w-4 h-4" />
                  Menunggu...
                </button>
                <button
                  v-else-if="!isMember"
                  class="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition"
                  @click="handleJoin"
                >
                  <Icon :name="group.privacy === 'closed' ? 'heroicons:paper-airplane' : 'heroicons:user-plus'" class="w-4 h-4" />
                  {{ group.privacy === 'closed' ? 'Minta Bergabung' : 'Bergabung' }}
                </button>
              </template>
              <button
                v-else
                class="inline-flex items-center cursor-pointer gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition"
                @click="handleProfileClick"
              >
                <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
                Login untuk bergabung
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 rounded-xl p-1 mb-6 w-fit">
            <button
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              :class="activeTab === 'memories'
                ? 'bg-white dark:bg-[#101010] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
              @click="activeTab = 'memories'"
            >
              <span class="flex items-center gap-1.5">
                <Icon name="heroicons:photo" class="w-4 h-4" />
                Kenangan
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
                  :class="activeTab === 'memories'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400'"
                >
                  {{ group.memories_count ?? 0 }}
                </span>
              </span>
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              :class="activeTab === 'members'
                ? 'bg-white dark:bg-[#101010] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
              @click="activeTab = 'members'"
            >
              <span class="flex items-center gap-1.5">
                <Icon name="heroicons:users" class="w-4 h-4" />
                Anggota
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
                  :class="activeTab === 'members'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400'"
                >
                  {{ group.members_count ?? 0 }}
                </span>
              </span>
            </button>
          </div>

          <!-- Memories tab -->
          <div v-if="activeTab === 'memories'">
            <div v-if="isMember" class="flex justify-end mb-4">
              <NuxtLink
                :to="`/dashboard/memories/create?group_id=${id}`"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                Tambah Kenangan
              </NuxtLink>
            </div>

            <div
              v-if="!memories.length"
              class="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-neutral-800"
            >
              <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
                <Icon name="heroicons:photo" class="w-7 h-7 text-gray-300 dark:text-neutral-700" />
              </div>
              <p class="text-sm text-gray-400">Belum ada kenangan di grup ini.</p>
              <NuxtLink
                v-if="isMember"
                :to="`/dashboard/memories/create?group_id=${id}`"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
              >
                <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                Tambah Kenangan Pertama
              </NuxtLink>
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <NuxtLink
                v-for="m in memories"
                :key="m.id"
                :to="`/memories/${m.id}`"
                class="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#101010] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 relative group"
              >
                <img
                  v-if="m.media?.[0]?.url"
                  :src="m.media[0].thumbnail_url ?? m.media[0].url"
                  class="w-full h-full object-cover group-hover:brightness-90 transition"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Icon name="heroicons:photo" class="w-10 h-10 text-gray-300 dark:text-neutral-700" />
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                  <p class="text-white text-xs font-semibold line-clamp-1">{{ m.title ?? m.memory_date }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Members tab -->
          <div v-else-if="activeTab === 'members'">
            <div class="bg-white dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden shadow-sm">
              <ul class="divide-y divide-gray-100 dark:divide-neutral-800">
                <li
                  v-for="member in members"
                  :key="member.id"
                  class="flex items-center gap-3 px-5 py-3.5"
                >
                  <img
                    :src="member.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user.name)}`"
                    class="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ member.name }}</p>
                    <p class="text-xs text-gray-400 capitalize flex items-center gap-1 mt-0.5">
                      <Icon
                        :name="member.pivot?.role === 'owner' ? 'heroicons:crown' : member.pivot?.role === 'admin' ? 'heroicons:bolt' : 'heroicons:user'"
                        class="w-3 h-3"
                      />
                      {{ member.pivot?.role ?? 'member' }}
                    </p>
                  </div>
                  <div v-if="isAdmin && member.id !== user?.id">
                    <button
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400 text-xs font-semibold transition border border-red-200 dark:border-red-800/50"
                      @click="handleBanMember(member.id)"
                    >
                      <Icon name="heroicons:no-symbol" class="w-3.5 h-3.5" />
                      Ban
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>
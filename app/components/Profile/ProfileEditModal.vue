<!-- components/Profile/ProfileEditModal.vue -->
<script lang="ts" setup>
import type { User } from '~/types/user'

interface Props {
  open: boolean
  user: User | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { updateProfile } = useAuth()
const toast = useToast()  // ← tambahkan ini

const formData = ref({
  name: '',
  description: '',
  address: '',
  avatar: null as File | null,
})

const avatarPreview = ref<string | null>(null)
const isLoading = ref(false)

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      formData.value = {
        name: newUser.name,
        description: newUser.description || '',
        address: newUser.address || '',
        avatar: null,
      }
      avatarPreview.value = newUser.avatar_url
    }
  },
  { immediate: true }
)

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file tidak boleh lebih dari 2MB')
      return
    }

    formData.value.avatar = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    toast.error('Nama tidak boleh kosong')
    return
  }

  isLoading.value = true

  const success = await updateProfile({
    name: formData.value.name,
    description: formData.value.description || null,
    address: formData.value.address || null,
    // Kirim avatar hanya jika user memilih file baru
    // undefined = tidak diubah, null = sengaja dihapus
    avatar: formData.value.avatar ?? undefined,
  })

  isLoading.value = false

  if (success) {
    toast.success('Profil berhasil diperbarui!')
    emit('saved')
    emit('update:open', false)
  } else {
    toast.error('Gagal memperbarui profil. Coba lagi.')
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-colors duration-300"
    @click.self="$emit('update:open', false)"
  >
    <div class="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-stone-900 dark:text-stone-50">Edit Profil</h2>
        <button
          class="cursor-pointer text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400 transition"
          @click="$emit('update:open', false)"
        >
          <Icon name="heroicons:x-mark-20-solid" class="w-6 h-6" />
        </button>
      </div>

      <!-- Error Message dihapus, diganti toast -->

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Avatar Upload -->
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 transition-colors duration-300">Avatar</label>
          <div class="flex flex-col items-center gap-4">
            <div class="w-24 h-24 rounded-2xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden transition-colors duration-300">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Preview"
                class="w-full h-full object-cover"
              />
              <Icon
                v-else
                name="heroicons:user-circle"
                class="w-12 h-12 text-stone-400 dark:text-stone-500"
              />
            </div>
            <label class="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
              <span class="px-4 py-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition">
                Pilih Foto
              </span>
            </label>
          </div>
        </div>

        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1 transition-colors duration-300">Nama</label>
          <input
            v-model="formData.name"
            type="text"
            class="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors duration-300"
            placeholder="Nama Anda"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1 transition-colors duration-300">Deskripsi</label>
          <textarea
            v-model="formData.description"
            class="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 resize-none transition-colors duration-300"
            placeholder="Deskripsi singkat tentang Anda"
            rows="2"
          />
        </div>

        <!-- Address -->
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1 transition-colors duration-300">Alamat</label>
          <input
            v-model="formData.address"
            type="text"
            class="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors duration-300"
            placeholder="Alamat Anda"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="cursor-pointer w-full px-4 py-3 bg-amber-600 dark:bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-700 dark:hover:bg-amber-600 transition disabled:bg-stone-400 dark:disabled:bg-stone-600"
        >
          <span v-if="!isLoading">Simpan Perubahan</span>
          <span v-else class="flex items-center justify-center gap-2">
            <Icon name="mdi:loading" class="w-4 h-4 animate-spin" />
            Menyimpan...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>
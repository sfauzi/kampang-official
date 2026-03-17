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

const formData = ref({
  name: '',
  description: '',
  address: '',
  // notes: '',
  avatar: null as File | null,
})

const avatarPreview = ref<string | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      formData.value = {
        name: newUser.name,
        description: newUser.description || '',
        address: newUser.address || '',
        // notes: newUser.notes || '',
        avatar: null,
      }
      avatarPreview.value = newUser.avatar_url
      errorMessage.value = ''
    }
  },
  { immediate: true }
)

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = 'Ukuran file tidak boleh lebih dari 2MB'
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
    errorMessage.value = 'Nama tidak boleh kosong'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const success = await updateProfile({
    name: formData.value.name,
    description: formData.value.description || null,
    address: formData.value.address || null,
    // notes: null,
    avatar: formData.value.avatar,
  })

  isLoading.value = false

  if (success) {
    emit('saved')
    emit('update:open', false)
  } else {
    errorMessage.value = 'Gagal memperbarui profil'
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="$emit('update:open', false)"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Edit Profil</h2>
        <button
          class="text-gray-400 hover:text-gray-600 transition"
          @click="$emit('update:open', false)"
        >
          <Icon name="heroicons:x-mark-20-solid" class="w-6 h-6" />
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Avatar Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
          <div class="flex flex-col items-center gap-4">
            <div class="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                alt="Preview"
                class="w-full h-full object-cover"
              />
              <Icon
                v-else
                name="heroicons:user-circle"
                class="w-12 h-12 text-gray-400"
              />
            </div>
            <label class="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
              <span class="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition">
                Pilih Foto
              </span>
            </label>
          </div>
        </div>

        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
          <input
            v-model="formData.name"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama Anda"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            v-model="formData.description"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Deskripsi singkat tentang Anda"
            rows="2"
          />
        </div>

        <!-- Address -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <input
            v-model="formData.address"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Alamat Anda"
          />
        </div>

        <!-- Notes -->
        <!-- <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            v-model="formData.notes"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Catatan tambahan"
            rows="2"
          />
        </div> -->

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
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


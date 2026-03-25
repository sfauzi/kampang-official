<!-- pages/terms.vue -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d0d0d] font-[Manrope]">
    <div class="max-w-3xl mx-auto px-4 py-12 pb-28 lg:pb-12 lg:pl-20">

      <!-- Header -->
      <div class="mb-10 animate-[fadeIn_0.4s_ease_forwards]">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-500 transition mb-6"
        >
          <Icon name="heroicons:arrow-left" class="w-3.5 h-3.5" />
          Kembali
        </NuxtLink>

        <div class="flex items-center gap-3 mb-3 py-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Icon name="heroicons:document-text" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Syarat & Ketentuan</h1>
            <p class="text-xs text-gray-400 mt-0.5">Terakhir diperbarui: 25 Maret 2026</p>
          </div>
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Dengan menggunakan layanan Kenangan, kamu menyetujui syarat dan ketentuan berikut.
          Baca dengan seksama sebelum menggunakan platform kami.
        </p>
      </div>

      <!-- Content -->
      <div class="space-y-4 animate-[slideUp_0.4s_ease_forwards] py-4">

        <div
          v-for="(section, i) in sections"
          :key="i"
          class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm"
        >
          <div class="flex items-start gap-3 mb-3">
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon :name="section.icon" class="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <span class="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Pasal {{ i + 1 }}
              </span>
              <h2 class="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {{ section.title }}
              </h2>
            </div>
          </div>
          <ul class="space-y-2 ml-10">
            <li
              v-for="(point, j) in section.points"
              :key="j"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              <span class="w-1 h-1 rounded-full bg-amber-500 shrink-0 mt-2" />
              {{ point }}
            </li>
          </ul>
        </div>

        <!-- Footer note -->
        <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 flex items-start gap-3">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">Pertanyaan?</p>
            <p class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              Jika kamu memiliki pertanyaan terkait syarat dan ketentuan ini, hubungi kami di
              <a href="mailto:officialkampang@gmail.com" class="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition">
                officialkampang@gmail.com
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Syarat & Ketentuan — Kenangan',
  description: 'Baca syarat dan ketentuan penggunaan layanan Kenangan.',
})

const sections = [
  {
    icon: 'heroicons:user-circle',
    title: 'Penggunaan Akun',
    points: [
      'Kamu harus berusia minimal 13 tahun untuk menggunakan layanan ini.',
      'Satu orang hanya boleh memiliki satu akun aktif.',
      'Kamu bertanggung jawab penuh atas aktivitas yang terjadi di akunmu.',
      'Jangan berbagi kredensial akun kepada pihak lain.',
    ],
  },
  {
    icon: 'heroicons:photo',
    title: 'Konten & Kenangan',
    points: [
      'Kamu memiliki hak atas konten yang kamu unggah ke platform ini.',
      'Dengan mengunggah konten, kamu memberi kami lisensi untuk menampilkannya sesuai pengaturan privasi yang kamu pilih.',
      'Dilarang mengunggah konten yang melanggar hak cipta, mengandung kekerasan, atau melanggar hukum yang berlaku.',
      'Kami berhak menghapus konten yang melanggar ketentuan ini tanpa pemberitahuan.',
    ],
  },
  {
    icon: 'heroicons:lock-closed',
    title: 'Privasi & Data',
    points: [
      'Data pribadimu diproses sesuai dengan Kebijakan Privasi kami.',
      'Kami tidak menjual data pribadimu kepada pihak ketiga.',
      'Kamu dapat menghapus akunmu dan seluruh datamu kapan saja.',
      'Kami menggunakan enkripsi untuk melindungi data yang tersimpan.',
    ],
  },
  {
    icon: 'heroicons:user-group',
    title: 'Grup & Kolaborasi',
    points: [
      'Admin grup bertanggung jawab atas konten yang ada di dalam grupnya.',
      'Anggota grup wajib mematuhi aturan komunitas yang berlaku.',
      'Penyalahgunaan fitur kolaborasi dapat mengakibatkan pemblokiran akun.',
    ],
  },
  {
    icon: 'heroicons:shield-check',
    title: 'Keamanan Platform',
    points: [
      'Dilarang melakukan upaya peretasan, scraping, atau penyalahgunaan API.',
      'Laporan kerentanan keamanan dapat dikirimkan ke tim kami.',
      'Kami berhak menangguhkan akun yang terindikasi melakukan aktivitas mencurigakan.',
    ],
  },
  {
    icon: 'heroicons:arrow-path',
    title: 'Perubahan Ketentuan',
    points: [
      'Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu.',
      'Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi.',
      'Melanjutkan penggunaan layanan setelah pembaruan berarti kamu menyetujui ketentuan yang baru.',
    ],
  },
]
</script>
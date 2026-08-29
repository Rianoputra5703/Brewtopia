import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Check, Upload, Coffee, Image as ImageIcon } from 'lucide-react'

export default function InformasiCafe() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingBannerVideo, setUploadingBannerVideo] = useState(false)

  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const bannerVideoInputRef = useRef(null)

  const [cafeInfo, setCafeInfo] = useState({
    id: null,
    name: '',
    tagline: '',
    description: '',
    logo_url: '',
    banner_url: '',
    banner_video_url: '',
    address: '',
    phone: '',
    email: '',
    instagram_url: '',
    facebook_url: '',
    whatsapp_number: '',
    google_maps_url: '',
  })

  useEffect(() => {
    loadCafeInfo()
  }, [])

  async function loadCafeInfo() {
    setLoading(true)
    const { data } = await supabase.from('cafe_info').select('*').limit(1).maybeSingle()
    if (data) setCafeInfo(data)
    setLoading(false)
  }

  async function handleImageUpload(e, field, setUploadingState) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingState(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${field}-${Date.now()}.${fileExt}`
    const filePath = `cafe-assets/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Gagal upload gambar: ' + uploadError.message)
      setUploadingState(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)

    setCafeInfo((prev) => ({ ...prev, [field]: urlData.publicUrl }))
    setUploadingState(false)
  }

  async function handleVideoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran video maksimal 20MB.')
      return
    }

    setUploadingBannerVideo(true)

    const fileName = `banner-video-${Date.now()}.mp4`
    const filePath = `cafe-assets/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Gagal upload video: ' + uploadError.message)
      setUploadingBannerVideo(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
    setCafeInfo((prev) => ({ ...prev, banner_video_url: urlData.publicUrl }))
    setUploadingBannerVideo(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    if (cafeInfo.id) {
      // Data sudah ada sebelumnya -> UPDATE baris yang sudah ada
      const { error } = await supabase
        .from('cafe_info')
        .update({ ...cafeInfo, updated_at: new Date() })
        .eq('id', cafeInfo.id)

      if (error) {
        alert('Gagal menyimpan: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      // Data BELUM ada -> INSERT baris baru.
      // PENTING: buang field "id" (yang masih null) dari payload,
      // supaya database yang generate id-nya sendiri secara otomatis.
      const { id, ...payloadTanpaId } = cafeInfo

      const { data, error } = await supabase
        .from('cafe_info')
        .insert(payloadTanpaId)
        .select()
        .single()

      if (error) {
        alert('Gagal menyimpan: ' + error.message)
        setSaving(false)
        return
      }

      if (data) setCafeInfo(data)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="ml-64 min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    )
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Informasi Café</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola identitas café Anda: nama, logo, deskripsi, dan kontak.
          </p>
        </div>

        {/* Identitas & Logo */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Identitas Café</h2>
          <p className="text-sm text-gray-500 mb-5">
            Nama, tagline, dan deskripsi yang tampil di website Anda.
          </p>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-5">
              <Field label="Nama Café">
                <Input
                  value={cafeInfo.name}
                  onChange={(v) => setCafeInfo({ ...cafeInfo, name: v })}
                  placeholder="Brewtopia Coffee & Eatery"
                />
              </Field>
              <Field label="Tagline">
                <Input
                  value={cafeInfo.tagline}
                  onChange={(v) => setCafeInfo({ ...cafeInfo, tagline: v })}
                  placeholder="Good coffee, good mood."
                />
              </Field>
              <Field label="Deskripsi Singkat">
                <Textarea
                  value={cafeInfo.description}
                  onChange={(v) => setCafeInfo({ ...cafeInfo, description: v })}
                  placeholder="Ceritakan tentang café Anda..."
                />
              </Field>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                  {cafeInfo.logo_url ? (
                    <img src={cafeInfo.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Coffee size={28} className="text-gray-300" />
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'logo_url', setUploadingLogo)}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {uploadingLogo ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploadingLogo ? 'Mengunggah...' : 'Ubah Logo'}
                </button>
                <p className="text-[10px] text-gray-400 text-center">PNG, JPG. Maks. 2MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Hero — foto atau video */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Banner Hero</h2>
          <p className="text-sm text-gray-500 mb-5">
            Tampilan atas (hero) landing page. Bisa pakai foto atau video — kalau
            video diisi, video akan dipakai (foto jadi cadangan).
          </p>

          <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden mb-4">
            <div className="aspect-[21/9] bg-gray-100 flex items-center justify-center relative">
              {cafeInfo.banner_video_url ? (
                <video
                  src={cafeInfo.banner_video_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : cafeInfo.banner_url ? (
                <img src={cafeInfo.banner_url} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <ImageIcon size={32} />
                  <p className="text-xs mt-2">Belum ada banner</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Banner</label>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'banner_url', setUploadingBanner)}
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2.5 disabled:opacity-50"
              >
                {uploadingBanner ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadingBanner ? 'Mengunggah...' : 'Pilih Foto'}
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5">PNG/JPG, rekomendasi 1920x820px</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Video Banner <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                ref={bannerVideoInputRef}
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <button
                onClick={() => bannerVideoInputRef.current?.click()}
                disabled={uploadingBannerVideo}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2.5 disabled:opacity-50"
              >
                {uploadingBannerVideo ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadingBannerVideo ? 'Mengunggah...' : 'Pilih Video'}
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5">MP4, maks. 20MB, disarankan tanpa suara</p>
              {cafeInfo.banner_video_url && (
                <button
                  onClick={() => setCafeInfo({ ...cafeInfo, banner_video_url: '' })}
                  className="text-[10px] text-red-500 hover:underline mt-1"
                >
                  Hapus video, pakai foto saja
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kontak & Lokasi */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Kontak &amp; Lokasi</h2>
          <p className="text-sm text-gray-500 mb-5">
            Informasi kontak yang tampil di website untuk dihubungi pelanggan.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Nomor WhatsApp">
              <Input
                value={cafeInfo.whatsapp_number}
                onChange={(v) => setCafeInfo({ ...cafeInfo, whatsapp_number: v })}
                placeholder="628xxxxxxxxxx"
              />
            </Field>
            <Field label="Telepon">
              <Input
                value={cafeInfo.phone}
                onChange={(v) => setCafeInfo({ ...cafeInfo, phone: v })}
                placeholder="(0293) 123456"
              />
            </Field>
            <Field label="Email">
              <Input
                value={cafeInfo.email}
                onChange={(v) => setCafeInfo({ ...cafeInfo, email: v })}
                placeholder="hello@brewtopia.com"
              />
            </Field>
            <Field label="Link Google Maps">
              <Input
                value={cafeInfo.google_maps_url}
                onChange={(v) => setCafeInfo({ ...cafeInfo, google_maps_url: v })}
                placeholder="https://maps.google.com/..."
              />
            </Field>
            <Field label="Alamat" full>
              <Textarea
                value={cafeInfo.address}
                onChange={(v) => setCafeInfo({ ...cafeInfo, address: v })}
                placeholder="Jl. Contoh No. 123, Magelang"
              />
            </Field>
          </div>
        </div>

        {/* Sosial Media */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Sosial Media</h2>
          <p className="text-sm text-gray-500 mb-5">
            Link akun sosial media resmi café Anda.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <Field label="Instagram">
              <Input
                value={cafeInfo.instagram_url}
                onChange={(v) => setCafeInfo({ ...cafeInfo, instagram_url: v })}
                placeholder="https://instagram.com/brewtopia"
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={cafeInfo.facebook_url}
                onChange={(v) => setCafeInfo({ ...cafeInfo, facebook_url: v })}
                placeholder="https://facebook.com/brewtopia"
              />
            </Field>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saved && <Check size={16} />}
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan'}
        </button>
      </main>
    </div>
  )
}

/* ==================== KOMPONEN KECIL REUSABLE ==================== */

function Field({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  )
}

function Textarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
    />
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Check, Upload, X, Image as ImageIcon } from 'lucide-react'

const TABS = ['Tampilan', 'SEO', 'Jam Buka', 'Lainnya']

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// Preset warna siap pakai untuk tiap kolom warna di tab Tampilan.
// Tinggal tambah/hapus kode HEX di sini kalau mau ubah pilihannya.
const PRESET_COLORS = {
  primary: [
    '#4A5D3A', '#6C4E31', '#8B4513', '#2F4F2F', '#5C4033', '#3B3B3B',
    '#7B3F00', '#556B2F', '#3E2723', '#8B0000', '#004225', '#1B4332',
    '#4B3621', '#6B4226', '#800020', '#014421', '#40241A', '#5D3A00',
    '#3B5249', '#264653', '#283618', '#432818', '#606C38', '#582F0E',
  ],
  secondary: [
    '#C9A66B', '#D4A373', '#E6C79C', '#B08968', '#DDB892', '#A67C52',
    '#E9C46A', '#F4A261', '#DEB887', '#CD853F', '#D2B48C', '#EDC9AF',
    '#F0C987', '#C68642', '#DAA520', '#E0AC69', '#BC8F5F', '#F5DEB3',
    '#E3B778', '#B5895A', '#F6C453', '#D9A566', '#C19A6B', '#EAD2AC',
  ],
  text: [
    '#333333', '#1A1A1A', '#4A4A4A', '#000000', '#5C5C5C', '#2D2D2D',
    '#212121', '#3C3C3C', '#0D0D0D', '#454545', '#1E1E1E', '#292929',
    '#111111', '#383838', '#2B2B2B', '#4F4F4F', '#181818', '#363636',
  ],
  background: [
    '#FBF7F1', '#F5F0E8', '#F2E9DD', '#FAF6F0', '#FFFFFF', '#F7F3EC',
    '#EFE7D8', '#F9F5EF', '#F4EFE6', '#FDFBF7', '#F0EAE0', '#F8F4EC',
    '#FFFDF9', '#F6F1E7', '#EDE4D3', '#F3EEE4', '#FAF8F5', '#F1EBDD',
    '#E9E0CD', '#FCF9F4', '#F5EEDD', '#EFEAE0', '#FAF3E8', '#F2EDE5',
    '#FDF9F0', '#EEE6D6', '#F7F0E3', '#F4F1EA', '#FBF3E4', '#E8E1D3',
    '#FEFCF8', '#F0E9DA', '#F6EFDF', '#EAE3D5', '#FCF6EC', '#F3ECDC',
    '#2B2B2B', '#1E1E1E', '#111111', '#0D0D0D', '#242424', '#F0F4F1',
    '#EDF2F0', '#F4F1F6', '#F0EEF5', '#E9F0EE', '#F5F2ED', '#EFF3F4',
  ],
}

export default function Pengaturan() {
  const [activeTab, setActiveTab] = useState('Tampilan')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [theme, setTheme] = useState({
    primary_color: '#6C4E31',
    secondary_color: '#D4A373',
    text_color: '#333333',
    background_color: '#FBF7F1',
    font: 'Poppins',
    style: 'Modern',
  })
  const [seo, setSeo] = useState({
    title: '',
    keywords: '',
    meta_description: '',
    og_image_url: '',
  })
  const [otherSettings, setOtherSettings] = useState({
    show_menu_landing: true,
    show_gallery_landing: true,
    show_testimonials_landing: true,
    show_promo_landing: true,
    maintenance_mode: false,
    analytics_enabled: false,
  })
  const [openingHours, setOpeningHours] = useState([])

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)

    const { data: settingsData } = await supabase.from('settings').select('*')
    if (settingsData) {
      settingsData.forEach((row) => {
        try {
          const parsed = JSON.parse(row.value)
          if (row.key === 'theme') setTheme((prev) => ({ ...prev, ...parsed }))
          if (row.key === 'seo') setSeo((prev) => ({ ...prev, ...parsed }))
          if (row.key === 'other') setOtherSettings((prev) => ({ ...prev, ...parsed }))
        } catch (e) {
          // abaikan kalau bukan JSON valid
        }
      })
    }

    const { data: hoursData } = await supabase
      .from('opening_hours')
      .select('*')
      .order('day_of_week', { ascending: true })
    if (hoursData) setOpeningHours(hoursData)

    setLoading(false)
  }

  async function saveSettingKey(key, valueObj) {
    const value = JSON.stringify(valueObj)
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .maybeSingle()

    if (existing) {
      await supabase.from('settings').update({ value, updated_at: new Date() }).eq('key', key)
    } else {
      await supabase.from('settings').insert({ key, value })
    }
  }

  async function handleSaveAll() {
    setSaving(true)
    setSaved(false)

    await saveSettingKey('theme', theme)
    await saveSettingKey('seo', seo)
    await saveSettingKey('other', otherSettings)

    for (const hour of openingHours) {
      await supabase
        .from('opening_hours')
        .update({
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed,
        })
        .eq('id', hour.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateHour = (id, field, value) => {
    setOpeningHours((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    )
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Pengaturan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola tampilan, SEO, jam operasional, dan fitur website Anda.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Untuk nama café, logo, kontak, dan sosial media, atur di halaman{' '}
              <a href="/admin/informasi-cafe" className="text-indigo-600 hover:underline">
                Informasi Café
              </a>.
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ==================== TAB: TAMPILAN ==================== */}
        {activeTab === 'Tampilan' && (
          <Card title="Pengaturan Tampilan" subtitle="Sesuaikan warna dan tampilan website café Anda.">
            <div className="grid grid-cols-4 gap-6">
              <Field label="Warna Primer">
                <ColorInput
                  value={theme.primary_color}
                  onChange={(v) => setTheme({ ...theme, primary_color: v })}
                  presets={PRESET_COLORS.primary}
                />
              </Field>
              <Field label="Warna Sekunder">
                <ColorInput
                  value={theme.secondary_color}
                  onChange={(v) => setTheme({ ...theme, secondary_color: v })}
                  presets={PRESET_COLORS.secondary}
                />
              </Field>
              <Field label="Warna Teks">
                <ColorInput
                  value={theme.text_color}
                  onChange={(v) => setTheme({ ...theme, text_color: v })}
                  presets={PRESET_COLORS.text}
                />
              </Field>
              <Field label="Warna Latar (Background)">
                <ColorInput
                  value={theme.background_color}
                  onChange={(v) => setTheme({ ...theme, background_color: v })}
                  presets={PRESET_COLORS.background}
                />
              </Field>
              <Field label="Font Utama">
                <Select
                  value={theme.font}
                  onChange={(v) => setTheme({ ...theme, font: v })}
                  options={['Poppins', 'Inter', 'Playfair Display', 'Lora', 'Montserrat']}
                />
              </Field>
              <Field label="Gaya Website">
                <Select
                  value={theme.style}
                  onChange={(v) => setTheme({ ...theme, style: v })}
                  options={['Modern', 'Klasik', 'Minimalis', 'Playful']}
                />
              </Field>
            </div>
          </Card>
        )}

        {/* ==================== TAB: SEO ==================== */}
        {activeTab === 'SEO' && (
          <Card title="Pengaturan SEO" subtitle="Optimalkan website Anda agar lebih mudah ditemukan di mesin pencari.">
            <div className="grid grid-cols-2 gap-6">
              <Field label="SEO Title">
                <Input value={seo.title} onChange={(v) => setSeo({ ...seo, title: v })} />
              </Field>
              <Field label="Keywords">
                <Input
                  placeholder="pisahkan dengan koma"
                  value={seo.keywords}
                  onChange={(v) => setSeo({ ...seo, keywords: v })}
                />
              </Field>
              <Field label="Meta Description" full>
                <Textarea
                  value={seo.meta_description}
                  onChange={(v) => setSeo({ ...seo, meta_description: v })}
                />
              </Field>
              <Field label="Gambar Share (OG Image)" full>
                <ImageUpload
                  value={seo.og_image_url}
                  onChange={(v) => setSeo({ ...seo, og_image_url: v })}
                />
              </Field>
            </div>
          </Card>
        )}

        {/* ==================== TAB: JAM BUKA ==================== */}
        {activeTab === 'Jam Buka' && (
          <Card title="Jam Operasional" subtitle="Atur jadwal operasional café yang ditampilkan di halaman website.">
            <div className="space-y-3">
              {openingHours.map((hour) => (
                <div
                  key={hour.id}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="w-24 text-sm font-medium text-gray-700">
                    {DAYS[hour.day_of_week]}
                  </span>
                  <input
                    type="time"
                    disabled={hour.is_closed}
                    value={hour.open_time?.slice(0, 5) || ''}
                    onChange={(e) => updateHour(hour.id, 'open_time', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="text-gray-400 text-sm">s/d</span>
                  <input
                    type="time"
                    disabled={hour.is_closed}
                    value={hour.close_time?.slice(0, 5) || ''}
                    onChange={(e) => updateHour(hour.id, 'close_time', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <label className="flex items-center gap-2 ml-auto text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={hour.is_closed}
                      onChange={(e) => updateHour(hour.id, 'is_closed', e.target.checked)}
                      className="rounded"
                    />
                    Tutup
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ==================== TAB: LAINNYA ==================== */}
        {activeTab === 'Lainnya' && (
          <Card title="Pengaturan Lainnya" subtitle="Atur fitur tambahan seperti section landing page, mode maintenance, dan analytics.">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Toggle
                label="Tampilkan Menu di Landing Page"
                checked={otherSettings.show_menu_landing}
                onChange={(v) => setOtherSettings({ ...otherSettings, show_menu_landing: v })}
              />
              <Toggle
                label="Tampilkan Gallery di Landing Page"
                checked={otherSettings.show_gallery_landing}
                onChange={(v) => setOtherSettings({ ...otherSettings, show_gallery_landing: v })}
              />
              <Toggle
                label="Tampilkan Testimoni di Landing Page"
                checked={otherSettings.show_testimonials_landing}
                onChange={(v) => setOtherSettings({ ...otherSettings, show_testimonials_landing: v })}
              />
              <Toggle
                label="Tampilkan Promo di Landing Page"
                checked={otherSettings.show_promo_landing}
                onChange={(v) => setOtherSettings({ ...otherSettings, show_promo_landing: v })}
              />
              <Toggle
                label="Aktifkan Mode Maintenance"
                description="Website akan menampilkan halaman maintenance"
                checked={otherSettings.maintenance_mode}
                onChange={(v) => setOtherSettings({ ...otherSettings, maintenance_mode: v })}
              />
              <Toggle
                label="Aktifkan Analytic / Tracking"
                description="Pastikan script tracking sudah diisi"
                checked={otherSettings.analytics_enabled}
                onChange={(v) => setOtherSettings({ ...otherSettings, analytics_enabled: v })}
              />
            </div>
          </Card>
        )}

        <div className="mt-6">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saved && <Check size={16} />}
            {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan'}
          </button>
        </div>
      </main>
    </div>
  )
}

/* ==================== KOMPONEN KECIL REUSABLE ==================== */

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  )
}

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

function Textarea({ value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
    />
  )
}

// Kolom warna: ada color picker native + kolom teks HEX + deretan preset warna
// yang tinggal diklik. Swatch yang sedang aktif ditandai ring indigo.
function ColorInput({ value, onChange, presets = [] }) {
  return (
    <div>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-none flex-shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm focus:outline-none"
        />
      </div>

      {presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((color) => {
            const isActive = value?.toLowerCase() === color.toLowerCase()
            return (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                title={color}
                aria-label={`Pilih warna ${color}`}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  isActive
                    ? 'border-indigo-600 ring-2 ring-indigo-200'
                    : 'border-white shadow'
                }`}
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Upload gambar ke Supabase Storage (bucket "assets", folder "seo").
// Ganti nama bucket di bawah ini kalau project kamu sudah pakai bucket lain
// (misalnya bucket yang sama dipakai untuk logo/gallery).
const STORAGE_BUCKET = 'public-assets'
const STORAGE_FOLDER = 'seo'

function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.')
      return
    }

    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${STORAGE_FOLDER}/og-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError('Gagal upload: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    onChange(publicUrlData.publicUrl)
    setUploading(false)
    e.target.value = ''
  }

  function handleRemove() {
    onChange('')
    setError('')
  }

  return (
    <div>
      {value ? (
        <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-200">
          <img src={value} alt="OG Preview" className="w-full aspect-[1200/630] object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
            title="Hapus gambar"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-2 w-full max-w-sm aspect-[1200/630] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'border-indigo-300 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-indigo-600" />
              <span className="text-xs text-indigo-600">Mengupload...</span>
            </>
          ) : (
            <>
              <ImageIcon size={22} className="text-gray-400" />
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Upload size={12} /> Klik untuk upload gambar
              </span>
              <span className="text-[10px] text-gray-400">Rekomendasi 1200x630px, maks 5MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ml-4 ${
          checked ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
        }`}
      >
        <span className="w-5 h-5 bg-white rounded-full mx-0.5 shadow" />
      </button>
    </div>
  )
}
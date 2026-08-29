import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Plus, Pencil, Trash2, X, Upload, Percent, Calendar } from 'lucide-react'

const emptyForm = {
  id: null,
  title: '',
  description: '',
  image_url: '',
  discount_percent: '',
  menu_id: '',
  start_date: '',
  end_date: '',
  is_active: true,
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getPromoStatus(promo) {
  const today = new Date().toISOString().split('T')[0]
  if (!promo.is_active) return { label: 'Nonaktif', color: 'bg-gray-100 text-gray-500' }
  if (promo.end_date && promo.end_date < today)
    return { label: 'Berakhir', color: 'bg-red-50 text-red-600' }
  if (promo.start_date && promo.start_date > today)
    return { label: 'Terjadwal', color: 'bg-amber-50 text-amber-600' }
  return { label: 'Berjalan', color: 'bg-emerald-50 text-emerald-600' }
}

export default function Promo() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState([])
  const [menus, setMenus] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [promosRes, menusRes] = await Promise.all([
      supabase
        .from('promos')
        .select('*, menus(name)')
        .order('created_at', { ascending: false }),
      supabase.from('menus').select('id, name').order('name', { ascending: true }),
    ])
    setPromos(promosRes.data || [])
    setMenus(menusRes.data || [])
    setLoading(false)
  }

  function openAddModal() {
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEditModal(promo) {
    setForm({
      id: promo.id,
      title: promo.title || '',
      description: promo.description || '',
      image_url: promo.image_url || '',
      discount_percent: promo.discount_percent || '',
      menu_id: promo.menu_id || '',
      start_date: promo.start_date || '',
      end_date: promo.end_date || '',
      is_active: promo.is_active,
    })
    setShowModal(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `promo-${Date.now()}.${fileExt}`
    const filePath = `promo-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Gagal upload gambar: ' + uploadError.message)
      setUploadingImage(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }))
    setUploadingImage(false)
  }

  async function handleSave() {
    if (!form.title) {
      alert('Judul promo wajib diisi.')
      return
    }

    setSaving(true)

    const payload = {
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      menu_id: form.menu_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    }

    if (form.id) {
      await supabase.from('promos').update({ ...payload, updated_at: new Date() }).eq('id', form.id)
    } else {
      await supabase.from('promos').insert(payload)
    }

    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('promos').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    loadData()
  }

  async function toggleActive(promo) {
    await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id)
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
    )
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Promo</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola promo dan diskon yang tampil di website café Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Promo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : promos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <Percent size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Belum ada promo. Klik "Tambah Promo" untuk mulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {promos.map((promo) => {
              const status = getPromoStatus(promo)
              return (
                <div
                  key={promo.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden group"
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {promo.image_url ? (
                      <img
                        src={promo.image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Percent size={28} />
                      </div>
                    )}

                    {promo.discount_percent && (
                      <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        -{promo.discount_percent}%
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(promo)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-indigo-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(promo)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800">{promo.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {promo.menus?.name && (
                      <p className="text-xs text-indigo-600 mb-1">Untuk: {promo.menus.name}</p>
                    )}

                    {(promo.start_date || promo.end_date) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                        <Calendar size={12} />
                        {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                      </p>
                    )}

                    <button
                      onClick={() => toggleActive(promo)}
                      className={`w-full text-xs py-1.5 rounded-lg font-medium transition-colors ${
                        promo.is_active
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {promo.is_active ? 'Aktif' : 'Nonaktifkan'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-800">
                {form.id ? 'Edit Promo' : 'Tambah Promo'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gambar Promo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.image_url ? (
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Percent size={20} className="text-gray-300" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploadingImage ? 'Mengunggah...' : 'Pilih Gambar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Promo</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Diskon 20% Cappuccino"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Syarat & ketentuan berlaku..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Diskon (%)</label>
                  <input
                    type="number"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    placeholder="20"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Khusus Menu <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <select
                    value={form.menu_id}
                    onChange={(e) => setForm({ ...form, menu_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Semua menu / umum</option>
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                Aktifkan promo ini
              </label>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hapus Promo?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Promo <strong>{deleteTarget.title}</strong> akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
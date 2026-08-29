import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import {
  Loader2, Plus, Trash2, X, Upload, MessageSquareQuote, Star, Check, User,
} from 'lucide-react'

const emptyForm = {
  id: null,
  customer_name: '',
  message: '',
  rating: 5,
  avatar_url: '',
  is_approved: true,
}

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

export default function Testimoni() {
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState([])
  const [filter, setFilter] = useState('all') // all | approved | pending

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadTestimonials()
  }, [])

  async function loadTestimonials() {
    setLoading(true)
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    setTestimonials(data || [])
    setLoading(false)
  }

  function openAddModal() {
    setForm(emptyForm)
    setShowModal(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `testimonial-${Date.now()}.${fileExt}`
    const filePath = `testimonial-avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Gagal upload gambar: ' + uploadError.message)
      setUploadingImage(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
    setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
    setUploadingImage(false)
  }

  async function handleSave() {
    if (!form.customer_name || !form.message) {
      alert('Nama dan ulasan wajib diisi.')
      return
    }

    setSaving(true)

    await supabase.from('testimonials').insert({
      customer_name: form.customer_name,
      message: form.message,
      rating: form.rating,
      avatar_url: form.avatar_url,
      is_approved: form.is_approved,
    })

    setSaving(false)
    setShowModal(false)
    loadTestimonials()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('testimonials').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    loadTestimonials()
  }

  async function toggleApproval(t) {
    await supabase.from('testimonials').update({ is_approved: !t.is_approved }).eq('id', t.id)
    setTestimonials((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, is_approved: !item.is_approved } : item))
    )
  }

  const filteredTestimonials = testimonials.filter((t) => {
    if (filter === 'approved') return t.is_approved
    if (filter === 'pending') return !t.is_approved
    return true
  })

  const pendingCount = testimonials.filter((t) => !t.is_approved).length

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Testimoni</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola ulasan pelanggan yang tampil di website café Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Testimoni
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'approved', label: 'Ditampilkan' },
            { key: 'pending', label: `Menunggu${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <MessageSquareQuote size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Tidak ada testimoni di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredTestimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.customer_name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.customer_name}</p>
                      <StarRating value={t.rating} />
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.message}"</p>

                <button
                  onClick={() => toggleApproval(t)}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    t.is_approved
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  {t.is_approved && <Check size={12} />}
                  {t.is_approved ? 'Ditampilkan di website' : 'Menunggu persetujuan'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Tambah */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-800">Tambah Testimoni</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Pelanggan</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-gray-300" />
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
                    {uploadingImage ? 'Mengunggah...' : 'Pilih Foto'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Pelanggan</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Sarah Wijaya"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, rating: n })}
                      type="button"
                    >
                      <Star
                        size={22}
                        className={
                          n <= form.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 hover:text-amber-200'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Isi Ulasan</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  placeholder="Suasananya nyaman, kopinya enak..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_approved}
                  onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
                  className="rounded"
                />
                Langsung tampilkan di website
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
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hapus Testimoni?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Testimoni dari <strong>{deleteTarget.customer_name}</strong> akan dihapus permanen.
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
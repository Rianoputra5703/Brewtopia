import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Plus, Trash2, X, Upload, Image as ImageIcon, Pencil } from 'lucide-react'

export default function Gallery() {
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [caption, setCaption] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const [editTarget, setEditTarget] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [])

  async function loadPhotos() {
    setLoading(true)
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  function openAddModal() {
    setCaption('')
    setUploadFile(null)
    setPreviewUrl('')
    setShowModal(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!uploadFile) {
      alert('Pilih foto terlebih dahulu.')
      return
    }

    setSaving(true)

    const fileExt = uploadFile.name.split('.').pop()
    const fileName = `gallery-${Date.now()}.${fileExt}`
    const filePath = `gallery-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, uploadFile)

    if (uploadError) {
      alert('Gagal upload gambar: ' + uploadError.message)
      setSaving(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)

    const maxOrder = photos.reduce((max, p) => Math.max(max, p.display_order || 0), 0)

    await supabase.from('gallery').insert({
      image_url: urlData.publicUrl,
      caption,
      display_order: maxOrder + 1,
    })

    setSaving(false)
    setShowModal(false)
    loadPhotos()
  }

  function openEditCaption(photo) {
    setEditTarget(photo)
    setEditCaption(photo.caption || '')
  }

  async function handleSaveCaption() {
    setSavingCaption(true)
    await supabase.from('gallery').update({ caption: editCaption }).eq('id', editTarget.id)
    setSavingCaption(false)
    setEditTarget(null)
    loadPhotos()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('gallery').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    loadPhotos()
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Gallery</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola foto suasana, interior, dan momen di café Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Foto
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <ImageIcon size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Belum ada foto. Klik "Tambah Foto" untuk mulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || 'Gallery'}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEditCaption(photo)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-indigo-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(photo)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {photo.caption && (
                  <div className="p-2.5">
                    <p className="text-xs text-gray-500 truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Tambah Foto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Tambah Foto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload size={24} />
                      <p className="text-xs mt-2">Klik untuk pilih foto</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Suasana indoor Brewtopia"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Mengunggah...' : 'Unggah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edit caption */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Edit Keterangan</h2>
            <input
              type="text"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Suasana indoor Brewtopia"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCaption}
                disabled={savingCaption}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {savingCaption && <Loader2 size={14} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hapus Foto?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Foto ini akan dihapus permanen dari gallery.
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
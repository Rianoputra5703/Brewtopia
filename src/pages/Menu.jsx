import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import {
  Loader2, Plus, Pencil, Trash2, X, Upload, Coffee, Search,
} from 'lucide-react'

const emptyForm = {
  id: null,
  category_id: '',
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_available: true,
  is_featured: false,
}

export default function Menu() {
  const [loading, setLoading] = useState(true)
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

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
    const [menusRes, categoriesRes] = await Promise.all([
      supabase
        .from('menus')
        .select('*, categories(name)')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order', { ascending: true }),
    ])
    setMenus(menusRes.data || [])
    setCategories(categoriesRes.data || [])
    setLoading(false)
  }

  function openAddModal() {
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEditModal(menu) {
    setForm({
      id: menu.id,
      category_id: menu.category_id || '',
      name: menu.name || '',
      description: menu.description || '',
      price: menu.price || '',
      image_url: menu.image_url || '',
      is_available: menu.is_available,
      is_featured: menu.is_featured,
    })
    setShowModal(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `menu-${Date.now()}.${fileExt}`
    const filePath = `menu-photos/${fileName}`

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
    if (!form.name || !form.price) {
      alert('Nama menu dan harga wajib diisi.')
      return
    }

    setSaving(true)

    const payload = {
      category_id: form.category_id || null,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image_url: form.image_url,
      is_available: form.is_available,
      is_featured: form.is_featured,
    }

    if (form.id) {
      await supabase.from('menus').update({ ...payload, updated_at: new Date() }).eq('id', form.id)
    } else {
      await supabase.from('menus').insert(payload)
    }

    setSaving(false)
    setShowModal(false)
    loadData()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('menus').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    loadData()
  }

  async function toggleAvailability(menu) {
    await supabase.from('menus').update({ is_available: !menu.is_available }).eq('id', menu.id)
    setMenus((prev) =>
      prev.map((m) => (m.id === menu.id ? { ...m, is_available: !m.is_available } : m))
    )
  }

  const filteredMenus = menus.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || m.category_id === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Menu</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola daftar menu makanan & minuman café Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Menu
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Konten */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <Coffee size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {menus.length === 0
                ? 'Belum ada menu. Klik "Tambah Menu" untuk mulai.'
                : 'Tidak ada menu yang cocok dengan pencarian.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {menu.image_url ? (
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Coffee size={28} />
                    </div>
                  )}

                  {menu.is_featured && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      Unggulan
                    </span>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEditModal(menu)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-indigo-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(menu)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-xs text-indigo-600 font-medium mb-0.5">
                    {menu.categories?.name || 'Tanpa kategori'}
                  </p>
                  <p className="text-sm font-medium text-gray-800 truncate">{menu.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Rp {Number(menu.price).toLocaleString('id-ID')}
                  </p>

                  <button
                    onClick={() => toggleAvailability(menu)}
                    className={`mt-2 w-full text-xs py-1.5 rounded-lg font-medium transition-colors ${
                      menu.is_available
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {menu.is_available ? 'Tersedia' : 'Habis'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-800">
                {form.id ? 'Edit Menu' : 'Tambah Menu'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Upload foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Menu</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.image_url ? (
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee size={24} className="text-gray-300" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Menu</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Cappuccino"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="25000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Espresso dengan susu steamed dan foam lembut..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="rounded"
                  />
                  Tersedia
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  Tandai sebagai Unggulan
                </label>
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
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hapus Menu?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Menu <strong>{deleteTarget.name}</strong> akan dihapus permanen dan tidak bisa
              dikembalikan.
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
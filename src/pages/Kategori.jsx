import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Plus, Pencil, Trash2, X, Tags } from 'lucide-react'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export default function Kategori() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ id: null, name: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*, menus(count)')
      .order('display_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }

  function openAddModal() {
    setForm({ id: null, name: '', is_active: true })
    setShowModal(true)
  }

  function openEditModal(cat) {
    setForm({ id: cat.id, name: cat.name, is_active: cat.is_active })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name) {
      alert('Nama kategori wajib diisi.')
      return
    }
    setSaving(true)

    const payload = {
      name: form.name,
      slug: slugify(form.name),
      is_active: form.is_active,
    }

    if (form.id) {
      await supabase.from('categories').update(payload).eq('id', form.id)
    } else {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0)
      await supabase.from('categories').insert({ ...payload, display_order: maxOrder + 1 })
    }

    setSaving(false)
    setShowModal(false)
    loadCategories()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('categories').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    loadCategories()
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Kategori</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola kategori menu, contoh: Coffee, Non-Coffee, Snack.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Tambah Kategori
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <Tags size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Belum ada kategori. Klik "Tambah Kategori" untuk mulai.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Nama Kategori</th>
                  <th className="px-5 py-3 font-medium">Jumlah Menu</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-5 py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {cat.menus?.[0]?.count ?? 0} menu
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-indigo-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {form.id ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Coffee"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                Aktif (tampil di website)
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
            <h2 className="text-base font-semibold text-gray-800 mb-1">Hapus Kategori?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Kategori <strong>{deleteTarget.name}</strong> akan dihapus. Menu yang memakai
              kategori ini akan jadi "Tanpa kategori", bukan ikut terhapus.
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
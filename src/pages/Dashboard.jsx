import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Coffee, Tags, Percent, MessageSquareQuote, Image as ImageIcon, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    menus: 0,
    categories: 0,
    activePromos: 0,
    testimonials: 0,
    gallery: 0,
  })
  const [recentMenus, setRecentMenus] = useState([])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)

    const [menusRes, categoriesRes, promosRes, testimonialsRes, galleryRes, recentMenusRes] =
      await Promise.all([
        supabase.from('menus').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('promos').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }),
        supabase.from('gallery').select('id', { count: 'exact', head: true }),
        supabase
          .from('menus')
          .select('id, name, price, image_url, is_available')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

    setStats({
      menus: menusRes.count || 0,
      categories: categoriesRes.count || 0,
      activePromos: promosRes.count || 0,
      testimonials: testimonialsRes.count || 0,
      gallery: galleryRes.count || 0,
    })
    setRecentMenus(recentMenusRes.data || [])
    setLoading(false)
  }

  const cards = [
    { label: 'Total Menu', value: stats.menus, icon: Coffee, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Kategori', value: stats.categories, icon: Tags, color: 'bg-amber-50 text-amber-600' },
    { label: 'Promo Aktif', value: stats.activePromos, icon: Percent, color: 'bg-rose-50 text-rose-600' },
    { label: 'Testimoni', value: stats.testimonials, icon: MessageSquareQuote, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Foto Gallery', value: stats.gallery, icon: ImageIcon, color: 'bg-sky-50 text-sky-600' },
  ]

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas website Brewtopia Café.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : (
          <>
            {/* Cards statistik */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {cards.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-2xl font-semibold text-gray-800">{value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Menu terbaru */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Menu Terbaru</h2>

              {recentMenus.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  Belum ada menu. Tambahkan menu pertama Anda di halaman Menu.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentMenus.map((menu) => (
                    <div key={menu.id} className="flex items-center gap-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {menu.image_url ? (
                          <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Coffee size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{menu.name}</p>
                        <p className="text-xs text-gray-500">
                          Rp {Number(menu.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          menu.is_available
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {menu.is_available ? 'Tersedia' : 'Habis'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
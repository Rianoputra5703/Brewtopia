import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  LayoutDashboard, Info, Coffee, Tags, Percent, Image,
  MessageSquareQuote, Settings as SettingsIcon, UserCircle, LogOut
} from 'lucide-react'

const menuItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/informasi-cafe', label: 'Informasi Café', icon: Info },
  { to: '/admin/menu', label: 'Menu', icon: Coffee },
  { to: '/admin/kategori', label: 'Kategori', icon: Tags },
  { to: '/admin/promo', label: 'Promo', icon: Percent },
  { to: '/admin/gallery', label: 'Gallery', icon: Image },
  { to: '/admin/testimoni', label: 'Testimoni', icon: MessageSquareQuote },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: SettingsIcon },
  { to: '/admin/account', label: 'Admin Account', icon: UserCircle },
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  const [cafe, setCafe] = useState({ name: 'Brewtopia', tagline: 'Good coffee, good mood.', logo_url: '' })

  useEffect(() => {
    loadCafeInfo()

    // Dengarkan perubahan realtime, supaya kalau diubah di tab lain, sidebar ikut update
    const channel = supabase
      .channel('cafe_info_sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_info' }, () => {
        loadCafeInfo()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadCafeInfo() {
    const { data } = await supabase
      .from('cafe_info')
      .select('name, tagline, logo_url')
      .limit(1)
      .maybeSingle()

    if (data) {
      setCafe({
        name: data.name || 'Brewtopia',
        tagline: data.tagline || 'Good coffee, good mood.',
        logo_url: data.logo_url || '',
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <aside className="w-64 h-screen bg-[#211D2C] text-gray-300 flex flex-col fixed left-0 top-0">
      {/* Brand — sekarang dinamis dari database */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#6C4E31] flex items-center justify-center overflow-hidden flex-shrink-0">
          {cafe.logo_url ? (
            <img src={cafe.logo_url} alt={cafe.name} className="w-full h-full object-cover" />
          ) : (
            <Coffee size={18} className="text-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold leading-tight truncate">{cafe.name}</p>
          <p className="text-[10px] tracking-widest text-gray-400 uppercase truncate">
            {cafe.tagline}
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Promo card kecil di bawah — juga dinamis */}
      <div className="m-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-[#6C4E31] to-[#8a6640] text-white">
        <p className="font-semibold text-sm truncate">{cafe.name}</p>
        <p className="text-xs text-white/80 mt-0.5 truncate">{cafe.tagline}</p>
      </div>
    </aside>
  )
}
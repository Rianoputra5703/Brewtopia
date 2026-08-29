import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
  Coffee, Menu as MenuIcon, X, Star, MapPin, Phone, Mail,
  ChevronLeft, ChevronRight, Wifi, ChefHat, Sofa, Loader2, Wand2,
} from 'lucide-react'

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// Daftar halaman navbar. Tambah/hapus di sini kalau mau ubah menu.
const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'menu', label: 'Menu' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'contact', label: 'Contact' },
]

// Nilai default kalau admin belum pernah menyimpan pengaturan tampilan.
const DEFAULT_THEME = {
  primary_color: '#B98A54',
  secondary_color: '#D4A373',
  text_color: '#2b1e14',
  background_color: '#FBF7F1',
  font: 'Poppins',
  style: 'Modern',
}

// Cari meta tag berdasarkan attribute (name/property), buat baru kalau belum ada,
// lalu isi/update content-nya. Dipakai untuk sinkronkan SEO dari admin ke <head>.
function setMetaTag(attr, key, content) {
  if (!content) return
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function Landing() {
  const [loading, setLoading] = useState(true)
  const [cafeInfo, setCafeInfo] = useState(null)
  const [categories, setCategories] = useState([])
  const [menus, setMenus] = useState([])
  const [promos, setPromos] = useState([])
  const [gallery, setGallery] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [openingHours, setOpeningHours] = useState([])
  const [theme, setTheme] = useState(DEFAULT_THEME)
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

  const [activeCategory, setActiveCategory] = useState('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

  // ==== STATE UTAMA UNTUK GANTI "HALAMAN" ====
  // Baca dari URL hash (misal buka link /#contact langsung) supaya menu
  // yang ke-highlight aktif sesuai halaman yang benar-benar tampil,
  // bukan selalu "Home" walau URL-nya beda.
  const VALID_PAGES = ['home', 'about', 'menu', 'gallery', 'contact']
  const initialPage = VALID_PAGES.includes(window.location.hash.replace('#', ''))
    ? window.location.hash.replace('#', '')
    : 'home'
  const [activePage, setActivePage] = useState(initialPage)

  // ==== STATE MODAL DETAIL MENU (drawer dari bawah) ====
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  function openMenuDetail(menu) {
    setSelectedMenu(menu)
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)))
  }

  function closeMenuDetail() {
    setDrawerVisible(false)
    setTimeout(() => setSelectedMenu(null), 300)
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Setiap ganti halaman, scroll ke atas biar rapi
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activePage])

  // Kalau lagi di halaman Menu/Gallery tapi section itu di-OFF dari admin
  // (misal user klik link lama sebelum di-nonaktifkan), lempar ke Home
  // supaya tidak menampilkan halaman kosong.
  useEffect(() => {
    if (loading) return
    if (activePage === 'menu' && !otherSettings.show_menu_landing) setActivePage('home')
    if (activePage === 'gallery' && !otherSettings.show_gallery_landing) setActivePage('home')
  }, [activePage, otherSettings, loading])

  // Kunci scroll body saat drawer menu terbuka
  useEffect(() => {
    document.body.style.overflow = selectedMenu ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedMenu])

  async function loadAllData() {
    setLoading(true)
    const [cafeRes, catRes, menuRes, promoRes, galleryRes, testiRes, hoursRes, themeRes, seoRes, otherRes] = await Promise.all([
      supabase.from('cafe_info').select('*').limit(1).maybeSingle(),
      supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('menus').select('*').eq('is_available', true).order('display_order'),
      supabase.from('promos').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1),
      supabase.from('gallery').select('*').order('display_order').limit(6),
      supabase.from('testimonials').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('opening_hours').select('*').order('day_of_week'),
      supabase.from('settings').select('*').eq('key', 'theme').maybeSingle(),
      supabase.from('settings').select('*').eq('key', 'seo').maybeSingle(),
      supabase.from('settings').select('*').eq('key', 'other').maybeSingle(),
    ])

    setCafeInfo(cafeRes.data)
    setCategories(catRes.data || [])
    setMenus(menuRes.data || [])
    setPromos(promoRes.data || [])
    setGallery(galleryRes.data || [])
    setTestimonials(testiRes.data || [])
    setOpeningHours(hoursRes.data || [])

    if (themeRes.data?.value) {
      try {
        const parsed = JSON.parse(themeRes.data.value)
        setTheme((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        // kalau value bukan JSON valid, pakai default
      }
    }

    if (seoRes.data?.value) {
      try {
        const parsed = JSON.parse(seoRes.data.value)
        setSeo((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        // kalau value bukan JSON valid, pakai default
      }
    }

    if (otherRes.data?.value) {
      try {
        const parsed = JSON.parse(otherRes.data.value)
        setOtherSettings((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        // kalau value bukan JSON valid, pakai default
      }
    }

    setLoading(false)
  }

  // Update <title> dan meta tag SEO tiap kali data seo berhasil di-fetch.
  // Catatan: ini membantu tab judul browser & bot yang menjalankan JS (Googlebot),
  // tapi TIDAK membantu preview share di WhatsApp/Facebook — bot itu tidak
  // menjalankan JavaScript, jadi og:image untuk mereka harus statis di index.html.
  useEffect(() => {
    if (!seo.title && !seo.meta_description && !seo.og_image_url) return

    if (seo.title) document.title = seo.title

    setMetaTag('name', 'description', seo.meta_description)
    setMetaTag('name', 'keywords', seo.keywords)
    setMetaTag('property', 'og:title', seo.title)
    setMetaTag('property', 'og:description', seo.meta_description)
    setMetaTag('property', 'og:image', seo.og_image_url)
  }, [seo])

  function goTo(page) {
    setActivePage(page)
    setMobileMenuOpen(false)
    window.history.replaceState(null, '', page === 'home' ? '/' : `/#${page}`)
  }

  // Menu navbar ikut sembunyi kalau section-nya di-OFF dari admin,
  // supaya tidak ada link menuju halaman yang sengaja disembunyikan.
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'menu') return otherSettings.show_menu_landing
    if (item.key === 'gallery') return otherSettings.show_gallery_landing
    return true
  })

  const filteredMenus =
    activeCategory === 'all' ? menus : menus.filter((m) => m.category_id === activeCategory)

  const activePromo = promos[0]
  const currentTestimonial = testimonials[testimonialIndex]

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.background_color }}
      >
        <Loader2 className="animate-spin" style={{ color: theme.primary_color }} size={32} />
      </div>
    )
  }

  const cafeName = cafeInfo?.name || 'Brewtopia'
  const tagline = cafeInfo?.tagline || 'Good Coffee, Good Mood'

  // Mode maintenance: kalau diaktifkan di admin, tampilkan halaman ini saja
  // dan hentikan render landing page normal sama sekali.
  if (otherSettings.maintenance_mode) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: theme.background_color, color: theme.text_color }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
          style={{ backgroundColor: theme.primary_color }}
        >
          <Coffee size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          {cafeName} sedang dalam perbaikan
        </h1>
        <p className="text-sm max-w-md opacity-70">
          Kami sedang memperbarui tampilan website. Silakan kunjungi lagi beberapa saat lagi. Terima kasih atas kesabarannya!
        </p>
      </div>
    )
  }

  // CSS variable dari pengaturan admin, dipasang di wrapper paling luar
  // supaya semua elemen di bawahnya bisa pakai var(--theme-primary) dst.
  const themeVars = {
    '--theme-primary': theme.primary_color,
    '--theme-secondary': theme.secondary_color,
    '--theme-text': theme.text_color,
    '--theme-bg': theme.background_color,
    fontFamily: theme.font ? `'${theme.font}', sans-serif` : undefined,
  }

  return (
    <div style={{ ...themeVars, backgroundColor: 'var(--theme-bg)' }}>
      {/* Utility class supaya elemen bisa pakai warna dari pengaturan admin */}
      <style>{`
        .theme-bg-primary { background-color: var(--theme-primary); transition: filter .15s ease; }
        .theme-bg-primary:hover { filter: brightness(0.9); }
        .theme-text-primary { color: var(--theme-primary); }
        .theme-text-secondary { color: var(--theme-secondary); }
        .theme-text-dark { color: var(--theme-text); }
        .theme-bg-dark { background-color: var(--theme-text); }
        .theme-border-dark { border-color: var(--theme-text); }
        .theme-bg-page { background-color: var(--theme-bg); }
        .theme-bg-section { background-color: color-mix(in srgb, var(--theme-bg) 85%, var(--theme-text) 6%); }
      `}</style>

      {/* ==================== NAVBAR ==================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <button onClick={() => goTo('home')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg theme-bg-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                {cafeInfo?.logo_url ? (
                  <img src={cafeInfo.logo_url} alt={cafeName} className="w-full h-full object-cover" />
                ) : (
                  <Coffee size={16} className="text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm leading-tight">{cafeName}</p>
                <p className="text-[8px] tracking-widest text-white/60">COFFEE &amp; EATERY</p>
              </div>
            </button>

            <a
              href={cafeInfo?.whatsapp_number ? `https://wa.me/${cafeInfo.whatsapp_number}` : undefined}
              onClick={(e) => {
                if (!cafeInfo?.whatsapp_number) {
                  e.preventDefault()
                  goTo('contact')
                }
              }}
              className="sm:hidden flex items-center gap-1.5 border border-white/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Visit Us
            </a>
          </div>

          {/* Nav selalu tampil di semua ukuran layar, wrap otomatis
              kalau tidak muat di satu baris (tanpa hamburger menu). */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-white/90">
            {visibleNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => goTo(item.key)}
                className={
                  activePage === item.key
                    ? 'text-white border-b border-white pb-1'
                    : 'hover:text-white pb-1 border-b border-transparent'
                }
              >
                {item.label}
              </button>
            ))}
          </nav>

          <a
            href={cafeInfo?.whatsapp_number ? `https://wa.me/${cafeInfo.whatsapp_number}` : undefined}
            onClick={(e) => {
              if (!cafeInfo?.whatsapp_number) {
                e.preventDefault()
                goTo('contact')
              }
            }}
            className="hidden sm:flex items-center gap-1.5 border border-white/40 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Visit Us
          </a>
        </div>
      </header>
      {activePage === 'home' && (
        <>
          {/* HERO — mendukung video ATAU foto */}
          <section className="relative min-h-[600px] flex items-center pt-32 sm:pt-20 overflow-hidden">
            {cafeInfo?.banner_video_url ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-[70%_center] sm:object-center"
              >
                <source src={cafeInfo.banner_video_url} type="video/mp4" />
              </video>
            ) : cafeInfo?.banner_url ? (
              <img
                src={cafeInfo.banner_url}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover object-[70%_center] sm:object-center"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, #1e140a, #4a3220)' }}
              />
            )}

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-20 w-full">
              <div className="max-w-xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  {tagline.split(',').map((part, i) => (
                    <span key={i} className="block">
                      {part.trim()}
                      {i === 0 && tagline.includes(',') ? ',' : ''}
                    </span>
                  ))}
                </h1>
                <p className="text-white/80 mb-8 text-sm sm:text-base">
                  {cafeInfo?.description || 'Nikmati kopi berkualitas dan suasana nyaman untuk menemani harimu.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => goTo('menu')}
                    className="theme-bg-primary text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
                  >
                    Explore Menu
                  </button>
                  <button
                    onClick={() => goTo('about')}
                    className="border border-white/60 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="theme-bg-section py-14">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-center text-2xl font-bold theme-text-dark mb-10" style={{ fontFamily: 'Georgia, serif' }}>
                Why Choose Us
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: Coffee, title: 'Premium Coffee', desc: 'Kami menggunakan biji kopi berkualitas terbaik.' },
                  { icon: Sofa, title: 'Cozy Atmosphere', desc: 'Tempat nyaman dengan desain estetik.' },
                  { icon: ChefHat, title: 'Fresh Every Day', desc: 'Semua menu dibuat fresh setiap hari.' },
                  { icon: Wifi, title: 'Free WiFi', desc: 'Tersedia WiFi cepat untuk kerja dan belajar.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex flex-col items-center text-center">
                    <Icon size={26} className="theme-text-dark mb-3" />
                    <p className="font-semibold text-sm theme-text-dark mb-1">{title}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== ABOUT ==================== */}
      {activePage === 'about' && (
        <section className="max-w-7xl mx-auto px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-gray-200">
            {gallery[0]?.image_url ? (
              <img src={gallery[0].image_url} alt="Interior" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Coffee size={40} />
              </div>
            )}
          </div>

          <div>
            <p className="theme-text-primary text-sm font-medium mb-1">— About Us</p>
            <h2 className="text-2xl sm:text-3xl font-bold theme-text-dark mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              About Our Café
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              {cafeInfo?.description ||
                `${cafeName} adalah coffee shop dengan konsep cozy, minimalis dan modern. Kami menyajikan kopi berkualitas tinggi dan makanan lezat untuk menemani setiap momen berharga Anda.`}
            </p>

            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold theme-text-dark">{menus.length}+</p>
                <p className="text-xs text-gray-500">Menu</p>
              </div>
              <div>
                <p className="text-2xl font-bold theme-text-dark">5K+</p>
                <p className="text-xs text-gray-500">Happy Customers</p>
              </div>
              <div>
                <p className="text-2xl font-bold theme-text-dark">
                  {testimonials.length > 0
                    ? (testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) / testimonials.length).toFixed(1)
                    : '4.9'}
                </p>
                <p className="text-xs text-gray-500">Customer Rating</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MENU ==================== */}
      {activePage === 'menu' && otherSettings.show_menu_landing && (
        <>
          <section className="max-w-7xl mx-auto px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold theme-text-dark" style={{ fontFamily: 'Georgia, serif' }}>
                Our Menu
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === 'all' ? 'theme-bg-dark text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.id ? 'theme-bg-dark text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filteredMenus.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Belum ada menu untuk kategori ini.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredMenus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => openMenuDetail(menu)}
                    className="text-left bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-100">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Coffee size={24} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold theme-text-dark truncate">{menu.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{menu.description}</p>
                      <p className="text-sm font-medium theme-text-primary mt-1.5">
                        Rp {Number(menu.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {otherSettings.show_promo_landing && (
          <section className="max-w-7xl mx-auto px-6 pb-20">
            <div
              className="rounded-2xl overflow-hidden relative min-h-[280px] flex flex-col justify-center p-8 text-white"
              style={{
                backgroundImage: activePromo?.image_url
                  ? `linear-gradient(to right, rgba(20,12,6,0.85), rgba(20,12,6,0.5)), url(${activePromo.image_url})`
                  : 'linear-gradient(135deg, #2b1e14, #4a3220)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {activePromo ? (
                <>
                  {activePromo.discount_percent && (
                    <span className="absolute top-4 right-4 bg-rose-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                      -{activePromo.discount_percent}%
                    </span>
                  )}
                  <p className="theme-text-secondary text-xs tracking-widest font-medium mb-2">WEEKEND SPECIAL</p>
                  <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                    {activePromo.title}
                  </h3>
                  {activePromo.description && (
                    <p className="text-white/80 text-sm mb-5 max-w-xs">{activePromo.description}</p>
                  )}
                  <button className="theme-bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg w-fit transition-colors">
                    Learn More
                  </button>
                </>
              ) : (
                <div className="text-center text-white/60">
                  <Wand2 size={28} className="mx-auto mb-2" />
                  <p className="text-sm">Belum ada promo aktif saat ini</p>
                </div>
              )}
            </div>
          </section>
          )}
        </>
      )}

      {/* ==================== GALLERY ==================== */}
      {activePage === 'gallery' && otherSettings.show_gallery_landing && (
        <section className="max-w-7xl mx-auto px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold theme-text-dark mb-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Gallery
          </h2>
          {gallery.length === 0 ? (
            <div className="h-56 rounded-xl bg-white flex items-center justify-center text-gray-300">
              Belum ada foto gallery
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden bg-white">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || 'Gallery'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-gray-500 px-2 py-2 text-center">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== CONTACT ==================== */}
      {activePage === 'contact' && (
        <>
          <section className={`max-w-7xl mx-auto px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 grid gap-12 ${
            otherSettings.show_testimonials_landing ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-3xl'
          }`}>
            {otherSettings.show_testimonials_landing && (
            <div>
              <h2 className="text-2xl font-bold theme-text-dark mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Testimonials
              </h2>

              {testimonials.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
                  Belum ada testimoni.
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 relative">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        className={n <= currentTestimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">"{currentTestimonial.message}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {currentTestimonial.avatar_url && (
                        <img src={currentTestimonial.avatar_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold theme-text-dark">{currentTestimonial.customer_name}</p>
                      <p className="text-xs text-gray-400">Customer</p>
                    </div>
                  </div>

                  {testimonials.length > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => setTestimonialIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
                        className="text-gray-400 hover:theme-text-dark"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex gap-1.5">
                        {testimonials.map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i === testimonialIndex ? 'theme-bg-primary' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                        className="text-gray-400 hover:theme-text-dark"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            <div>
              <h2 className="text-2xl font-bold theme-text-dark mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Location &amp; Opening Hours
              </h2>

              <div className="flex items-start gap-3 mb-5">
                <MapPin size={18} className="theme-text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{cafeInfo?.address || 'Alamat belum diisi'}</p>
              </div>

              <p className="text-sm font-medium theme-text-dark mb-2">Follow Us</p>
              <div className="flex gap-2 mb-6">
                {cafeInfo?.instagram_url && (
                  <a
                    href={cafeInfo.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full theme-bg-dark text-white flex items-center justify-center hover:opacity-80"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
              </div>

              <div className="bg-white rounded-xl p-5">
                <p className="text-sm font-semibold theme-text-dark mb-3">Opening Hours</p>
                <div className="space-y-1.5 mb-4">
                  {openingHours.map((h) => (
                    <div key={h.id} className="flex justify-between text-xs text-gray-500">
                      <span>{DAYS[h.day_of_week]}</span>
                      <span>{h.is_closed ? 'Tutup' : `${h.open_time?.slice(0, 5)} - ${h.close_time?.slice(0, 5)}`}</span>
                    </div>
                  ))}
                </div>
                {(cafeInfo?.google_maps_url || cafeInfo?.address) && (
                  <a
                    href={
                      cafeInfo?.google_maps_url
                        ? cafeInfo.google_maps_url
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cafeInfo.address)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center theme-bg-primary text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="theme-bg-dark py-16">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="theme-text-secondary text-xl font-semibold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  Ready for your next coffee?
                </p>
                <p className="text-white/60 text-sm">Kunjungi kami dan nikmati pengalaman terbaik.</p>
              </div>
              <a
                href={cafeInfo?.whatsapp_number ? `https://wa.me/${cafeInfo.whatsapp_number}` : '#'}
                className="theme-bg-primary text-white text-sm font-medium px-6 py-3 rounded-lg whitespace-nowrap transition-colors"
              >
                Visit Us Today
              </a>
            </div>
          </section>
        </>
      )}

      {/* ==================== FOOTER (selalu tampil) ==================== */}
      <footer className="bg-black text-white/70 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg theme-bg-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                {cafeInfo?.logo_url ? (
                  <img src={cafeInfo.logo_url} alt={cafeName} className="w-full h-full object-cover" />
                ) : (
                  <Coffee size={14} className="text-white" />
                )}
              </div>
              <p className="text-white font-semibold text-sm">{cafeName}</p>
            </div>
            <p className="text-xs">{tagline}</p>
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-3">Quick Links</p>
            <div className="flex flex-col gap-1.5 text-xs">
              {NAV_ITEMS.filter((i) => i.key !== 'contact').map((item) => (
                <button key={item.key} onClick={() => goTo(item.key)} className="text-left hover:text-white">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-3">Contact</p>
            <div className="flex flex-col gap-1.5 text-xs">
              {cafeInfo?.phone && (
                <span className="flex items-center gap-1.5"><Phone size={12} />{cafeInfo.phone}</span>
              )}
              {cafeInfo?.email && (
                <span className="flex items-center gap-1.5"><Mail size={12} />{cafeInfo.email}</span>
              )}
              {cafeInfo?.address && (
                <span className="flex items-center gap-1.5"><MapPin size={12} />{cafeInfo.address}</span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-white/10 text-center text-xs">
          © {new Date().getFullYear()} {cafeName} Coffee &amp; Eatery. All rights reserved.
        </div>
      </footer>

      {/* ==================== MODAL DETAIL MENU (muncul di tengah, fade + zoom) ==================== */}
      {selectedMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              drawerVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMenuDetail}
          />

          <div
            className={`relative bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out ${
              drawerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <button
              onClick={closeMenuDetail}
              className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-gray-100"
            >
              <X size={16} className="theme-text-dark" />
            </button>

            <div className="aspect-[16/10] bg-gray-100 rounded-t-2xl overflow-hidden">
              {selectedMenu.image_url ? (
                <img
                  src={selectedMenu.image_url}
                  alt={selectedMenu.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Coffee size={40} />
                </div>
              )}
            </div>

            <div className="p-5 pb-6">
              <p className="text-lg font-semibold theme-text-dark mb-2">{selectedMenu.name}</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {selectedMenu.description || 'Belum ada deskripsi untuk menu ini.'}
              </p>
              <p className="text-xl font-bold theme-text-primary">
                Rp {Number(selectedMenu.price).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
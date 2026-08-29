import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Coffee, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cafeInfo, setCafeInfo] = useState(null)

  // Ambil nama & logo café dari Informasi Café supaya halaman Login
  // ikut sinkron, bukan hardcode "Brewtopia" terus.
  useEffect(() => {
    async function loadCafeInfo() {
      const { data } = await supabase.from('cafe_info').select('name, logo_url').limit(1).maybeSingle()
      if (data) setCafeInfo(data)
    }
    loadCafeInfo()
  }, [])

  const cafeName = cafeInfo?.name || 'Brewtopia'

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('Email atau password salah. Coba lagi.')
      return
    }

    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#211D2C] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#6C4E31] flex items-center justify-center mb-3 overflow-hidden">
            {cafeInfo?.logo_url ? (
              <img src={cafeInfo.logo_url} alt={cafeName} className="w-full h-full object-cover" />
            ) : (
              <Coffee size={22} className="text-white" />
            )}
          </div>
          <h1 className="text-white font-semibold text-lg">{cafeName}</h1>
          <p className="text-xs tracking-widest text-gray-400">COFFEE &amp; EATERY — ADMIN</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Masuk ke Dashboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Masukkan email dan password admin Anda.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brewtopia.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Hanya untuk admin/staff {cafeName} Café.
        </p>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import AdminSidebar from '../components/AdminSidebar'
import { Loader2, Check, Upload, User, Mail, Lock, Shield } from 'lucide-react'

export default function AdminAccount() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Profil
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '', role: 'admin' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  // Email
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    loadAccount()
  }, [])

  async function loadAccount() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    setUser(currentUser)
    setNewEmail(currentUser?.email || '')

    if (currentUser) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)
      } else {
        // Kalau belum ada baris profile, buatkan otomatis
        await supabase.from('profiles').insert({ id: currentUser.id, full_name: '', role: 'admin' })
      }
    }

    setLoading(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Gagal upload foto: ' + uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
    setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
    setUploadingAvatar(false)
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    setProfileSaved(false)

    await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      })
      .eq('id', user.id)

    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function handleChangeEmail() {
    if (!newEmail || newEmail === user.email) return

    setSavingEmail(true)
    setEmailMessage('')

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    setSavingEmail(false)

    if (error) {
      setEmailMessage('Gagal: ' + error.message)
    } else {
      setEmailMessage('Link konfirmasi telah dikirim ke email baru Anda. Cek inbox untuk verifikasi.')
    }
  }

  async function handleChangePassword() {
    setPasswordError('')
    setPasswordMessage('')

    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordError('Gagal: ' + error.message)
    } else {
      setPasswordMessage('Password berhasil diubah.')
      setNewPassword('')
      setConfirmPassword('')
    }
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

      <main className="ml-64 flex-1 p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola profil, email, dan password akun Anda.
          </p>
        </div>

        {/* Profil */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Profil</h2>
          <p className="text-sm text-gray-500 mb-5">Nama dan foto yang tampil di dashboard admin.</p>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-gray-300" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {uploadingAvatar ? 'Mengunggah...' : 'Ubah Foto'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Nama Anda"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                <Shield size={14} />
                {profile.role === 'admin' ? 'Administrator' : profile.role === 'owner' ? 'Owner' : 'Staff'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            {profileSaved && <Check size={14} />}
            {savingProfile ? 'Menyimpan...' : profileSaved ? 'Tersimpan!' : 'Simpan Profil'}
          </button>
        </div>

        {/* Ganti Email */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Email</h2>
          <p className="text-sm text-gray-500 mb-5">
            Email digunakan untuk login ke dashboard admin.
          </p>

          {emailMessage && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-lg px-3 py-2 mb-4">
              {emailMessage}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleChangeEmail}
              disabled={savingEmail || newEmail === user?.email}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              {savingEmail && <Loader2 size={14} className="animate-spin" />}
              Ubah Email
            </button>
          </div>
        </div>

        {/* Ganti Password */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Ganti Password</h2>
          <p className="text-sm text-gray-500 mb-5">
            Gunakan password yang kuat dan tidak digunakan di akun lain.
          </p>

          {passwordMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
              {passwordError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {savingPassword && <Loader2 size={14} className="animate-spin" />}
            {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </div>
      </main>
    </div>
  )
}
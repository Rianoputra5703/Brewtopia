import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined) // undefined = belum dicek, null = tidak login

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
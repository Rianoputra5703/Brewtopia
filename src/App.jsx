import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InformasiCafe from './pages/InformasiCafe'
import Menu from './pages/Menu'
import Kategori from './pages/Kategori'
import Promo from './pages/Promo'
import Gallery from './pages/Gallery'
import Testimoni from './pages/Testimoni'
import Pengaturan from './pages/Pengaturan'
import AdminAccount from './pages/AdminAccount'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page publik */}
        <Route path="/" element={<Landing />} />

        {/* Login admin */}
        <Route path="/admin/login" element={<Login />} />

        {/* Halaman admin, wajib login dulu */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/informasi-cafe"
          element={
            <ProtectedRoute>
              <InformasiCafe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kategori"
          element={
            <ProtectedRoute>
              <Kategori />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promo"
          element={
            <ProtectedRoute>
              <Promo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/testimoni"
          element={
            <ProtectedRoute>
              <Testimoni />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pengaturan"
          element={
            <ProtectedRoute>
              <Pengaturan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/account"
          element={
            <ProtectedRoute>
              <AdminAccount />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
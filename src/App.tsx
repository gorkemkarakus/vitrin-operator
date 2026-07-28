import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import BusinessListPage from './pages/BusinessListPage'
import DashboardLayout from './layouts/DashboardLayout'
import AppointmentsPage from './pages/AppointmentsPage'
import TeamPage from './pages/TeamPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDescriptionPage from './pages/ServiceDescriptionPage'
import DashboardPage from './pages/DashboardPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isPlatformAdmin, loading } = useAuth()

  if (loading || (session && isPlatformAdmin === null)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-dim)' }}>
        Yükleniyor…
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  if (isPlatformAdmin === false) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-dim)' }}>
        Bu panele erişim yetkiniz yok.
      </div>
    )
  }

  return <>{children}</>
}

function AppRoutes() {
  const { session, isPlatformAdmin, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route
        path="/"
        element={session && isPlatformAdmin ? <Navigate to="/isletmeler" replace /> : <LoginPage />}
      />
      <Route path="/isletmeler" element={<ProtectedRoute><BusinessListPage /></ProtectedRoute>} />
      <Route path="/isletme/:businessId" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="randevular" element={<AppointmentsPage />} />
        <Route path="ekip" element={<TeamPage />} />
        <Route path="hizmetler" element={<ServicesPage />} />
        <Route path="hizmetler/:id/aciklama" element={<ServiceDescriptionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

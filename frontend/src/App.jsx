import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import EventDetailPage from './pages/EventDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import MyTicketsPage from './pages/MyTicketsPage'
import MyInterestsPage from './pages/MyInterestsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function OrganizerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'organizer') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <div style={{ position: 'relative' }}>
      <img
        src="/src/assets/gradient-tl.avif"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <Navbar />
      <div className="page-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <OrganizerRoute><OrganizerDashboard /></OrganizerRoute>
        } />
        <Route path="/my-tickets" element={
          <PrivateRoute><MyTicketsPage /></PrivateRoute>
        } />
        <Route path="/my-interests" element={
          <PrivateRoute><MyInterestsPage /></PrivateRoute>
        } />
      </Routes>
      </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

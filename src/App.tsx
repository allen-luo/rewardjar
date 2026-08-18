import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/Layout'
import { useAuth } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { ChoreForm, ChoresPage } from './features/chores/ChoreForm'
import { FamilyDashboard } from './features/dashboard/FamilyDashboard'
import { KidDashboard } from './features/dashboard/KidDashboard'
import { KidKiosk } from './features/dashboard/KidKiosk'
import { HistoryPage } from './features/history/HistoryPage'
import { KidForm } from './features/kids/KidForm'
import { CheckInPage } from './features/rewards/CheckInActions'
import { SettingsPage } from './features/settings/SettingsPage'

function Guard() {
  const { ready, session, configured } = useAuth()
  if (!ready) return <p className="p-8 font-display text-2xl">Opening the jar…</p>
  if (!configured || !session) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  const { session, ready } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={ready && session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<Guard />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FamilyDashboard />} />
          <Route path="/kids/new" element={<KidForm />} />
          <Route path="/kids/:id" element={<KidDashboard />} />
          <Route path="/kids/:id/edit" element={<KidForm />} />
          <Route path="/kids/:id/kiosk" element={<KidKiosk />} />
          <Route path="/kids/:id/history" element={<HistoryPage />} />
          <Route path="/kids/:id/chores" element={<ChoresPage />} />
          <Route path="/kids/:id/chores/new" element={<ChoreForm />} />
          <Route path="/kids/:id/chores/:choreId" element={<ChoreForm />} />
          <Route path="/check-in/:choreId" element={<CheckInPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

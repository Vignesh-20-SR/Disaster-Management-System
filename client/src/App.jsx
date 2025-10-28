import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Victim from './pages/Victim'
import Volunteer from './pages/Volunteer'
import Navbar from './components/Navbar'

function RequireAuth({ children, role }) {
  const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')
  const users = JSON.parse(localStorage.getItem('users') || '{}')
  const token = role ? tokens[role] : (tokens.victim || tokens.volunteer)
  const user = role ? users[role] : (users.victim || users.volunteer)
  if (!token || !user || (role && user.role !== role)) return <Navigate to={`/auth/${role || 'victim'}`} replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/:role" element={<Auth />} />
        <Route
          path="/victim"
          element={
            <RequireAuth role="victim">
              <Victim />
            </RequireAuth>
          }
        />
        <Route
          path="/volunteer"
          element={
            <RequireAuth role="volunteer">
              <Volunteer />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

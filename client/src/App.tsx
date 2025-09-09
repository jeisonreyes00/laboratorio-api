import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import UserPage from './pages/UserPage'
import AdminPage from './pages/AdminPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { getUser, clearUser, setUser, User } from './lib/auth'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { api } from './lib/api'

function Protected({ children, role }: { children: JSX.Element, role?: 'admin' | 'user' }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [current, setCurrent] = useState<User | null>(getUser())
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/me')
      .then(({ data }) => { const u = { name: data.name, email: data.email, role: data.role } as User; setUser(u); setCurrent(u) })
      .catch(() => { clearUser(); setCurrent(null) })
      .finally(() => setReady(true))
  }, [])

  async function handleLogout() { await api.post('/logout'); clearUser(); setCurrent(null); navigate('/login') }
  if (!ready) return null

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }} component={Link} to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Roles Demo</Typography>
          {current ? (<><Typography sx={{ mr: 2 }}>{current.name} ({current.role})</Typography><Button color="inherit" onClick={handleLogout}>Salir</Button></>) : (<Button color="inherit" onClick={() => navigate('/login')}>Login</Button>)}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={ current ? <Navigate to={current.role === 'admin' ? '/admin' : '/user'} replace /> : <Navigate to="/login" replace /> } />
        <Route path="/login" element={<LoginPage onLogged={(u) => { setUser(u); setCurrent(u); }} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/user" element={<Protected role="user"><UserPage /></Protected>} />
        <Route path="/admin" element={<Protected role="admin"><AdminPage /></Protected>} />
      </Routes>
    </Box>
  )
}

import { useState } from 'react'
import { api } from '../lib/api'
import { User } from '../lib/auth'
import { Avatar, Box, Button, Container, TextField, Typography, Paper, Link as MuiLink } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage({ onLogged }: { onLogged: (u: User) => void }) {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { data } = await api.post('/login', { email, password })
      const user = data.user as User
      onLogged(user)
      navigate(user.role === 'admin' ? '/admin' : '/user')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Avatar><LockIcon /></Avatar>
          <Typography variant="h6">Iniciar sesión</Typography>
          <Box component="form" onSubmit={handleSubmit} width="100%" display="grid" gap={2}>
            <TextField label="Email" fullWidth value={email} onChange={e => setEmail(e.target.value)} />
            <TextField label="Password" type="password" fullWidth value={password} onChange={e => setPassword(e.target.value)} />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</Button>
            <MuiLink component={Link} to="/forgot-password" underline="hover">¿Olvidaste tu contraseña?</MuiLink>
            <Typography variant="body2">Usuarios de prueba:</Typography>
            <Typography variant="body2">admin@example.com / 123456 (admin)</Typography>
            <Typography variant="body2">user@example.com / 123456 (user)</Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

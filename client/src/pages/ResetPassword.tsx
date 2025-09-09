import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import { Container, Paper, Box, TextField, Button, Typography } from '@mui/material'

export default function ResetPassword() {
  const [sp] = useSearchParams()
  const [email, setEmail] = useState(sp.get('email') || '')
  const [token, setToken] = useState(sp.get('token') || '')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { data } = await api.post('/reset-password', { email, token, newPassword: password })
      setMsg(data.message || 'Contraseña actualizada.')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>Restablecer contraseña</Typography>
        <Box component="form" onSubmit={submit} display="grid" gap={2}>
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
          <TextField label="Token" value={token} onChange={e => setToken(e.target.value)} fullWidth />
          <TextField label="Nueva contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth />
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar'}</Button>
          {msg && <Typography>{msg}</Typography>}
        </Box>
      </Paper>
    </Container>
  )
}

import { useState } from 'react'
import { api } from '../lib/api'
import { Container, Paper, Box, TextField, Button, Typography } from '@mui/material'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { data } = await api.post('/request-password-reset', { email })
      setMsg(data.message || 'Si el email existe, se ha enviado un enlace.')
    } catch (e: any) {
      setMsg('Si el email existe, se ha enviado un enlace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }} elevation={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recuperar contraseña</Typography>
        <Box component="form" onSubmit={submit} display="grid" gap={2}>
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</Button>
          {msg && <Typography>{msg}</Typography>}
        </Box>
      </Paper>
    </Container>
  )
}

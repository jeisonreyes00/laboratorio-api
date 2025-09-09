import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Container, Paper, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
type Point = { day: string; ventas: number }
export default function AdminPage() {
  const [data, setData] = useState<Point[]>([])
  useEffect(() => { api.get('/admin/metrics').then(res => setData(res.data)) }, [])
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Panel de Admin (Ventas)</Typography>
      <Paper sx={{ p: 2 }}>
        <LineChart xAxis={[{ scaleType: 'point', data: data.map(d => d.day) }]} series={[{ data: data.map(d => d.ventas), label: 'Ventas' }]} height={400} />
      </Paper>
    </Container>
  )
}

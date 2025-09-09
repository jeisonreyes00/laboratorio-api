import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
type Product = { id: number; name: string; price: number }
export default function UserPage() {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => { api.get('/products').then(res => setProducts(res.data)) }, [])
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Productos de supermercado</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Nombre</TableCell><TableCell align="right">Precio</TableCell></TableRow></TableHead>
          <TableBody>{products.map(p => (<TableRow key={p.id}><TableCell>{p.id}</TableCell><TableCell>{p.name}</TableCell><TableCell align="right">${p.price.toLocaleString('es-CO')}</TableCell></TableRow>))}</TableBody>
        </Table>
      </Paper>
    </Container>
  )
}

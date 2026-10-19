import React from 'react'

import { Atelier } from '@/components/Atelier'

export const metadata = { title: 'Atelier · Notenn' }

export default function AtelierPage() {
  return (
    <>
      <h1>Atelier</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>Importe un morceau : Notenn en tire la mélodie et l’écrit en Système Argoat.</p>
      <Atelier />
    </>
  )
}

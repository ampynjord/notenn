import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Tablatures pour accordéon diatonique en Système Argoat.',
  title: 'Notenn',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fr">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}

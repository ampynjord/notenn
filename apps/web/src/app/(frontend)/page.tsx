import React from 'react'

import { hohner2915GC } from '@notenn/engine'

export default function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <h1>Notenn</h1>
        <p>Tablatures pour accordéon diatonique en Système Argoat.</p>
        <p>
          Clavier de référence : {hohner2915GC.name} ({hohner2915GC.rows.length} rangs,{' '}
          {hohner2915GC.bassGroups.length * 2} basses).
        </p>
        <div className="links">
          <a className="admin" href="/admin">
            Administration
          </a>
        </div>
      </div>
    </div>
  )
}

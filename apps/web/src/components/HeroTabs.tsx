'use client'

import type { SystemLine } from '@notenn/argoat'
import React, { useState } from 'react'

import { ArgoatSheet } from './ArgoatSheet'

export interface HeroVariant {
  id: string
  label: string
  caption: string
  lines: SystemLine[]
}

/** The same tune written for each instrument: the visitor picks one and sees its tablature. */
export function HeroTabs({ variants, width }: { variants: HeroVariant[]; width: number }) {
  const [current, setCurrent] = useState(variants[0]!.id)
  const shown = variants.find((v) => v.id === current) ?? variants[0]!
  return (
    <figure className="hero-tab">
      <div className="hero-tabs" role="tablist">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={v.id === shown.id}
            className={v.id === shown.id ? 'on' : undefined}
            onClick={() => setCurrent(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <ArgoatSheet lines={shown.lines} width={width} cursor={null} />
      <figcaption>{shown.caption}</figcaption>
    </figure>
  )
}

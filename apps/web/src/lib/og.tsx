import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { OG_SIZE } from '@/lib/seo'

/** Colours of the notation (push, pull, bass), as in the site's stylesheet. */
const NOTATION = ['#8da2ff', '#ff8f87', '#6fd9ab']

/** Share preview of the site (Facebook, Discord, WhatsApp, X…), in the language of the page. */
export async function renderOgImage(locale: string) {
  const t = await getTranslations({ locale, namespace: 'meta' })
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 90px',
          background: 'linear-gradient(135deg, #14183f, #0b0f1f)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', marginBottom: 40 }}>
          {NOTATION.map((colour) => (
            <div
              key={colour}
              style={{ width: 96, height: 14, borderRadius: 7, marginRight: 16, background: colour }}
            />
          ))}
        </div>
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4 }}>{t('title')}</div>
        <div style={{ fontSize: 52, marginTop: 20, color: '#c9d1d9' }}>{t('tagline')}</div>
      </div>
    ),
    { ...OG_SIZE },
  )
}

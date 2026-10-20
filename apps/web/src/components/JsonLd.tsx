import React from 'react'

import { jsonLdString } from '@/lib/seo'

/** Structured data read by search engines (schema.org); invisible to readers. One tag per entity. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <>
      {[data].flat().map((entity, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(entity) }} />
      ))}
    </>
  )
}

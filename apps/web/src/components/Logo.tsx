import React from 'react'

/** The Notenn mark: an N whose two uprights are the push (blue) and the pull (coral) of the bellows. Same drawing as public/logo.svg. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#27348b" />
          <stop offset="1" stopColor="#14183f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
      <g fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 46V18" stroke="#8da2ff" />
        <path d="M45 46V18" stroke="#ff8f87" />
        <path d="M19 18 45 46" stroke="#1d2363" strokeWidth="13" />
        <path d="M19 18 45 46" stroke="#ffffff" />
      </g>
    </svg>
  )
}

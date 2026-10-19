'use client'

import { layout } from '@notenn/argoat'
import { arrange, hohner2915GC, meterInfo, pickMelodyTrack, type Song } from '@notenn/engine'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { fromAbc, fromFile } from '@/lib/import'
import { play, type Playback } from '@/lib/player'
import { ArgoatSheet, type Cursor } from './ArgoatSheet'

/** Auld Lang Syne, air traditionnel écossais (domaine public). */
const SAMPLE = `X:1
T:Auld Lang Syne (exemple)
M:4/4
L:1/8
Q:1/4=80
K:C
G2|c3c c2e2|d3c d2ed|c3c e2g2|a6a2|g3e e2c2|d3c d2e2|c3A A2G2|c6a2|
g3e e2c2|d3c d2a2|g3e e2g2|a6c'2|g3e e2c2|d3c d2e2|c3A A2G2|c8|]`

const WIDTH = 900
const profile = hohner2915GC

export function Atelier() {
  const [song, setSong] = useState<Song | null>(null)
  const [abc, setAbc] = useState(SAMPLE)
  const [error, setError] = useState('')
  const [track, setTrack] = useState(0)
  const [fromBar, setFromBar] = useState(1)
  const [toBar, setToBar] = useState(0)
  const [rows, setRows] = useState<'all' | 'inner'>('all')
  const [staff, setStaff] = useState(true)
  const [bass, setBass] = useState(true)
  const [transpose, setTranspose] = useState<'auto' | number>('auto')
  const [tempo, setTempo] = useState(80)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const playback = useRef<Playback | null>(null)
  const raf = useRef(0)

  const load = (s: Song) => {
    if (!s.tracks.length) throw new Error('Aucune note trouvée dans ce fichier.')
    stop()
    setSong(s)
    setTrack(pickMelodyTrack(s.tracks))
    setFromBar(1)
    setToBar(0)
    setTempo(s.tempo || 90)
    setError('')
  }
  const attempt = async (f: () => Promise<Song>) => {
    try {
      load(await f())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    void attempt(() => fromAbc(SAMPLE))
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const result = useMemo(() => {
    if (!song) return null
    try {
      const innerRow = profile.rows[0]!.id
      const arr = arrange(song, profile, {
        trackIndex: track,
        rows: rows === 'all' ? undefined : [innerRow],
        fromBar,
        toBar: toBar || undefined,
        transpose,
        bass,
      })
      const lines = layout(arr, profile, song.meter, { width: WIDTH, staff })
      return { arr, lines, error: '' }
    } catch (e) {
      return { arr: null, lines: [], error: e instanceof Error ? e.message : String(e) }
    }
  }, [song, track, rows, fromBar, toBar, transpose, bass, staff])

  // Un changement de réglage recalcule la partition : la lecture en cours n'y correspond plus.
  useEffect(() => stop(), [result, tempo])

  function stop() {
    cancelAnimationFrame(raf.current)
    playback.current?.stop()
    playback.current = null
    setCursor(null)
  }

  function start() {
    if (!result?.arr) return
    stop()
    const arr = result.arr
    const pb = play(arr, profile, tempo)
    playback.current = pb
    const tick = () => {
      const t = pb.position()
      if (t > pb.endsAt + 0.2) return stop()
      // Seuls les événements qui sonnent encore restent surlignés (rien pendant les silences).
      const note = arr.notes.findIndex((n) => n.start <= t + 1e-6 && t < n.start + n.dur)
      const bassLen = arr.meter.beat * 0.55
      const b = arr.bass.findIndex((ev) => ev.time <= t + 1e-6 && t < ev.time + bassLen)
      const n = arr.notes[note]
      setCursor({ time: Math.max(t, arr.notes[0]?.start ?? 0), note, bass: b, noteStart: n?.start, noteDur: n?.dur })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  const arr = result?.arr
  const totalBars = arr ? arr.toBar : 0
  const mi = song ? meterInfo(song.meter) : null

  return (
    <div className="atelier">
      <div className="grid">
        <section className="panel">
          <h2>Morceau</h2>
          <label>
            Fichier MIDI, MusicXML (.musicxml, .xml, .mxl) ou ABC
            <input
              type="file"
              accept=".mid,.midi,.musicxml,.xml,.mxl,.abc"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void attempt(() => fromFile(f))
              }}
            />
          </label>
          <p style={{ margin: '12px 0 4px', fontSize: 14, color: 'var(--muted)' }}>…ou colle un air en notation ABC :</p>
          <textarea value={abc} onChange={(e) => setAbc(e.target.value)} aria-label="Notation ABC" />
          <div className="row" style={{ marginTop: 8 }}>
            <button onClick={() => void attempt(() => fromAbc(abc))}>Charger l&apos;ABC</button>
          </div>
        </section>

        <section className="panel">
          <h2>Réglages</h2>
          <div className="row">
            {song && song.tracks.length > 1 && (
              <label>
                Piste de la mélodie
                <select value={track} onChange={(e) => setTrack(Number(e.target.value))}>
                  {song.tracks.map((t, i) => (
                    <option key={i} value={i}>
                      {t.name} ({t.notes.length} notes)
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              De la mesure
              <input type="number" min={1} value={fromBar} onChange={(e) => setFromBar(Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <label>
              à
              <input type="number" min={0} value={toBar || ''} placeholder="fin" onChange={(e) => setToBar(Math.max(0, Number(e.target.value) || 0))} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label>
              Rangs
              <select value={rows} onChange={(e) => setRows(e.target.value as 'all' | 'inner')}>
                <option value="all">Do + Sol</option>
                <option value="inner">Do seulement</option>
              </select>
            </label>
            <label>
              Transposition
              <select value={String(transpose)} onChange={(e) => setTranspose(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}>
                <option value="auto">Automatique</option>
                {Array.from({ length: 25 }, (_, i) => i - 12).map((t) => (
                  <option key={t} value={t}>
                    {t > 0 ? `+${t}` : t} demi-ton{Math.abs(t) > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tempo
              <input type="number" min={30} max={240} value={tempo} onChange={(e) => setTempo(Math.min(240, Math.max(30, Number(e.target.value) || 80)))} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 16 }}>
            <label style={{ flexDirection: 'row', alignItems: 'center' }}>
              <input type="checkbox" checked={staff} onChange={(e) => setStaff(e.target.checked)} /> Portée
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center' }}>
              <input type="checkbox" checked={bass} onChange={(e) => setBass(e.target.checked)} /> Basses
            </label>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            {cursor ? (
              <button onClick={stop}>Arrêter</button>
            ) : (
              <button className="primary" onClick={start} disabled={!arr}>
                Écouter
              </button>
            )}
          </div>
        </section>
      </div>

      {(error || result?.error) && <p className="pill err">{error || result?.error}</p>}

      {arr && song && (
        <section className="sheet">
          <h3>{song.title || 'Sans titre'}</h3>
          <p className="sub">
            {profile.name} · {song.meter.num}/{song.meter.den} · mesures {arr.fromBar} à {totalBars}
          </p>
          <div className="pills" style={{ marginBottom: 10 }}>
            <span className="pill">{arr.transpose === 0 ? 'Tonalité d’origine' : `Transposé de ${arr.transpose > 0 ? '+' : ''}${arr.transpose} demi-tons`}</span>
            <span className="pill">{arr.bellowsChanges} changements de soufflet</span>
            {arr.approxCount > 0 && <span className="pill warn">{arr.approxCount} note(s) remplacée(s), en orange</span>}
          </div>
          <div className="legend">
            <span>
              <b className="p">P</b> poussé
            </span>
            <span>
              <b className="t">T</b> tiré
            </span>
            <span>4&apos; = rang intérieur (Do) · 4 = rang extérieur (Sol)</span>
            <span>Trait gris = note tenue</span>
            {bass && (
              <span>
                <b className="b">●</b> basse · <b className="b">○</b> accord
              </span>
            )}
            {mi && <span>Points = temps, trait = début de mesure</span>}
          </div>
          <ArgoatSheet lines={result.lines} width={WIDTH} cursor={cursor} />
        </section>
      )}
    </div>
  )
}

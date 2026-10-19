import type { Meter, Song, Track } from '@notenn/engine'

/** Fichier MIDI : une piste par instrument (batterie et doublons écartés). */
export async function fromMidi(buffer: ArrayBuffer, fallbackTitle = ''): Promise<Song> {
  const { Midi } = await import('@tonejs/midi')
  const midi = new Midi(buffer)
  const ppq = midi.header.ppq
  const ts = midi.header.timeSignatures[0]
  const meter: Meter = ts ? { num: ts.timeSignature[0]!, den: ts.timeSignature[1]! } : { num: 4, den: 4 }
  const seen = new Set<string>()
  const tracks: Track[] = []
  for (const t of midi.tracks) {
    if (!t.notes.length || t.channel === 9 || t.instrument?.percussion) continue
    const notes = t.notes.map((n) => ({ start: n.ticks / ppq, dur: n.durationTicks / ppq, pitch: n.midi }))
    const sig = notes.map((n) => `${n.pitch}@${n.start}/${n.dur}`).join(',')
    if (seen.has(sig)) continue
    seen.add(sig)
    const name = t.name.trim()
    const inst = t.instrument?.name ?? ''
    tracks.push({ name: (name || `Piste ${tracks.length + 1}`) + (inst && !name ? ` · ${inst}` : ''), notes })
  }
  const tempo = midi.header.tempos[0] ? Math.round(midi.header.tempos[0].bpm) : 90
  return { title: midi.name || fallbackTitle, tracks, meter, pickup: 0, tempo }
}

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** MusicXML non compressé : voix 1 de chaque partie, liaisons fusionnées, anacrouse détectée. */
export function fromMusicXML(text: string, fallbackTitle = ''): Song {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Le fichier MusicXML est illisible.')
  const names: Record<string, string> = {}
  doc.querySelectorAll('score-part').forEach((sp) => (names[sp.id] = sp.querySelector('part-name')?.textContent?.trim() ?? ''))
  let meter: Meter | null = null
  let pickup = 0
  const tracks: Track[] = []
  ;[...doc.querySelectorAll('part')].forEach((part, pi) => {
    let div = 1
    let t = 0
    let lastStart = 0
    const notes: Track['notes'] = []
    ;[...part.children].filter((e) => e.tagName === 'measure').forEach((m, mi) => {
      const mStart = t
      let maxT = t
      for (const el of [...m.children]) {
        if (el.tagName === 'attributes') {
          const d = el.querySelector('divisions')
          if (d) div = Number(d.textContent) || div
          const tm = el.querySelector('time')
          if (tm && !meter && pi === 0) meter = { num: Number(tm.querySelector('beats')?.textContent), den: Number(tm.querySelector('beat-type')?.textContent) }
        } else if (el.tagName === 'note') {
          if (el.querySelector('grace')) continue
          const dur = Number(el.querySelector('duration')?.textContent ?? 0) / div
          const chord = !!el.querySelector('chord')
          const voice = el.querySelector('voice')?.textContent ?? '1'
          const start = chord ? lastStart : t
          if (!chord) {
            lastStart = t
            t += dur
          }
          maxT = Math.max(maxT, t)
          if (voice !== '1' || el.querySelector('rest')) continue
          const pe = el.querySelector('pitch')
          if (!pe) continue
          const pitch =
            STEP[pe.querySelector('step')?.textContent ?? 'C']! +
            Number(pe.querySelector('alter')?.textContent ?? 0) +
            (Number(pe.querySelector('octave')?.textContent) + 1) * 12
          const tieStop = [...el.querySelectorAll('tie')].some((x) => x.getAttribute('type') === 'stop')
          // La note liée n'est pas forcément la dernière insérée (accords) : on cherche la bonne.
          const prev = tieStop ? [...notes].reverse().find((x) => x.pitch === pitch && Math.abs(x.start + x.dur - start) < 1e-6) : undefined
          if (prev) prev.dur += dur
          else notes.push({ start, dur, pitch })
        } else if (el.tagName === 'backup') t -= Number(el.querySelector('duration')?.textContent) / div
        else if (el.tagName === 'forward') {
          t += Number(el.querySelector('duration')?.textContent) / div
          maxT = Math.max(maxT, t)
        }
      }
      t = maxT
      if (mi === 0 && pi === 0) {
        // Levée : mesure marquée implicite, ou première mesure plus courte que la mesure indiquée.
        const sig = meter as Meter | null
        const full = sig ? (sig.num * 4) / sig.den : Infinity
        const len = maxT - mStart
        if (m.getAttribute('implicit') === 'yes' || (len > 1e-6 && len < full - 1e-6)) pickup = len
      }
    })
    if (notes.length) tracks.push({ name: names[part.id] || `Partie ${pi + 1}`, notes })
  })
  const title = (doc.querySelector('work-title') ?? doc.querySelector('movement-title'))?.textContent?.trim() || fallbackTitle
  return { title, tracks, meter: meter ?? { num: 4, den: 4 }, pickup, tempo: 90 }
}

export async function fromMxl(buffer: ArrayBuffer, fallbackTitle = ''): Promise<Song> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)
  let path: string | null = null
  const container = zip.file('META-INF/container.xml')
  if (container) {
    const x = new DOMParser().parseFromString(await container.async('string'), 'application/xml')
    path = x.querySelector('rootfile')?.getAttribute('full-path') ?? null
  }
  path ??= Object.keys(zip.files).find((n) => /\.(xml|musicxml)$/i.test(n) && !n.startsWith('META-INF')) ?? null
  if (!path) throw new Error('Aucune partition trouvée dans le fichier .mxl.')
  return fromMusicXML(await zip.file(path)!.async('string'), fallbackTitle)
}

/** Air en notation ABC, converti par abcjs (reprises dépliées). */
export async function fromAbc(abc: string): Promise<Song> {
  const ABCJS = (await import('abcjs')).default
  const host = document.createElement('div')
  const visual = ABCJS.renderAbc(host, abc)[0]
  if (!visual || !visual.lines?.length) throw new Error("Je n'arrive pas à lire cet ABC : il faut au moins les lignes X:, M:, K: et des notes.")
  const frac = visual.getMeterFraction()
  const pickup = visual.getPickupLength() * 4
  const out = ABCJS.synth.getMidiFile(abc, { midiOutputType: 'binary' }) as unknown
  const bytes = (Array.isArray(out) ? out[0] : out) as Uint8Array
  const song = await fromMidi(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
  song.meter = { num: frac.num ?? 4, den: frac.den ?? 4 }
  song.pickup = pickup
  song.title = abc.match(/^T:\s*(.+)$/m)?.[1]?.trim() ?? ''
  song.tracks.forEach((t, i) => (t.name = i === 0 ? 'Mélodie' : `Voix ${i + 1}`))
  return song
}

export async function fromFile(file: File): Promise<Song> {
  const name = file.name.toLowerCase()
  const title = file.name.replace(/\.[^.]+$/, '')
  if (/\.(mid|midi)$/.test(name)) return fromMidi(await file.arrayBuffer(), title)
  if (name.endsWith('.mxl')) return fromMxl(await file.arrayBuffer(), title)
  if (/\.(xml|musicxml)$/.test(name)) return fromMusicXML(await file.text(), title)
  if (name.endsWith('.abc')) return fromAbc(await file.text())
  throw new Error('Format non reconnu : utilise un fichier .mid, .musicxml, .xml, .mxl ou .abc.')
}

'use client'

import { layout } from '@notenn/argoat'
import {
  arrange,
  fingeringsFor,
  getProfile,
  hohner2915GC,
  noteKey,
  pickMelodyTrack,
  profiles,
  type FingerChoice,
  type InstrumentProfile,
  type Song,
  type Track,
} from '@notenn/engine'
import { fromAbc, fromFile, ImportError } from '@notenn/import'
import { useLocale, useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import {
  ApiError,
  getLibraryItem,
  itemFile,
  listLibrary,
  saveFileToLibrary,
  updateLibraryItem,
  useAccount,
  type FullLibraryItem,
} from '@/lib/account'
import { noteName, rowLabel } from '@/lib/music-names'
import { play, type Playback } from '@/lib/player'
import { usePreferences } from '@/lib/preferences'
import { ArgoatSheet, type Cursor } from './ArgoatSheet'

/** Auld Lang Syne, traditional Scottish tune (public domain). */
export const SAMPLE_ABC = `X:1
T:Auld Lang Syne
M:4/4
L:1/8
Q:1/4=80
K:C
G2|c3c c2e2|d3c d2ed|c3c e2g2|a6a2|g3e e2c2|d3c d2e2|c3A A2G2|c6a2|
g3e e2c2|d3c d2a2|g3e e2g2|a6c'2|g3e e2c2|d3c d2e2|c3A A2G2|c8|]`

/** Drawing width bounds: the tab is laid out at the width it is shown, so numbers stay readable on phones. */
const MIN_WIDTH = 340
const MAX_WIDTH = 1100

/** Something went wrong, as a translation key (never a hard-coded message). */
type Problem = { key: string } | null

/** Hand-made fingerings, by `<track>.<keyboard id>` then by note start. */
type AllEdits = Record<string, Record<string, FingerChoice>>

const problemOf = (e: unknown): Problem => ({
  key: e instanceof ImportError ? `import.${e.code}` : 'unknown',
})

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

interface Props {
  /**
   * `editor`: import, change fingerings, keep them in the library (with an account).
   * `preview`: a bank tune as it is, to look at, listen to and print.
   */
  mode?: 'editor' | 'preview'
  /** Tune to open, in ABC notation; the sample tune otherwise. */
  abc?: string
  /** Editor: library item to open. */
  itemId?: string
  /** False when the page already shows the tune's title. */
  showTitle?: boolean
}

const titleOf = (item: FullLibraryItem) =>
  item.tune && typeof item.tune === 'object' ? item.tune.title : item.title

export function Workshop({ mode = 'editor', abc: initialAbc, itemId, showTitle = true }: Props) {
  const editor = mode === 'editor'
  const t = useTranslations('workshop')
  const te = useTranslations('errors')
  const ta = useTranslations('account')
  const { member } = useAccount()
  const tl = useTranslations('lines')
  const ti = useTranslations('instruments')
  const tn = useTranslations('notes')
  const locale = useLocale()
  const [prefs, setPrefs] = usePreferences()

  const [song, setSong] = useState<Song | null>(null)
  const [abc, setAbc] = useState(initialAbc ?? SAMPLE_ABC)
  const [problem, setProblem] = useState<Problem>(null)
  const [track, setTrack] = useState(0)
  const [fromBar, setFromBar] = useState(1)
  const [toBar, setToBar] = useState(0)
  const [transpose, setTranspose] = useState<'auto' | number>('auto')
  const [tempo, setTempo] = useState(80)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [allEdits, setAllEdits] = useState<AllEdits>({})
  /** Library item being worked on: its fingerings are saved as they change. */
  const [item, setItem] = useState<FullLibraryItem | null>(null)
  /** Imported but not saved yet: what "Save to my library" stores. */
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [library, setLibrary] = useState<FullLibraryItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [libProblem, setLibProblem] = useState<string | null>(null)
  const libNotice = libProblem ?? (editor && itemId && member === null ? 'itemLoginRequired' : null)
  const [editing, setEditing] = useState<{ note: number; x: number; y: number } | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const playback = useRef<Playback | null>(null)
  const raf = useRef(0)
  const scoreRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)

  useEffect(() => {
    const el = scoreRef.current
    if (!el) return
    const measure = () => {
      const style = getComputedStyle(el)
      const inner = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      // Round to 20 px so small resizes do not recompute the whole layout.
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(inner / 20) * 20)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const profile: InstrumentProfile = getProfile(prefs.profileId) ?? hohner2915GC
  const rows = prefs.rows?.filter((r) => profile.rows.some((x) => x.id === r))
  const activeRows = rows && rows.length ? rows : profile.rows.map((r) => r.id)
  const profileName = (p: InstrumentProfile) => (ti.has(p.id) ? ti(p.id) : p.name)

  const load = (s: Song) => {
    if (!s.tracks.length) return setProblem({ key: 'noNotes' })
    stop()
    setSong(s)
    setTrack(pickMelodyTrack(s.tracks))
    setFromBar(1)
    setToBar(0)
    setTempo(s.tempo || 90)
    setProblem(null)
    setEditing(null)
  }
  /** Reads a tune; `origin` says where its fingerings go once it is shown. */
  const attempt = async (
    f: () => Promise<Song>,
    origin: { item?: FullLibraryItem; file?: File } = {},
  ) => {
    try {
      load(await f())
      setItem(origin.item ?? null)
      setPendingFile(origin.file ?? null)
      setAllEdits((origin.item?.fingerings as AllEdits | null | undefined) ?? {})
      setLibProblem(null)
    } catch (e) {
      setProblem(problemOf(e))
    }
  }

  /** Shows a library item; its fingerings are then saved to it. */
  const showItem = async (it: FullLibraryItem) => {
    const file = itemFile(it)
    const abcText = it.tune && typeof it.tune === 'object' ? it.tune.abc : null
    if (abcText) await attempt(() => fromAbc(abcText), { item: it })
    else if (file) await attempt(() => fromFile(file), { item: it })
    else setProblem({ key: 'unknown' })
    window.history.replaceState(null, '', `?item=${it.id}`)
  }
  const openItem = (id: number | string) =>
    getLibraryItem(id).then(showItem, () => {
      setProblem(null)
      setLibProblem('itemMissing')
    })

  // The tune to show first: a library item (editor), the page's tune or the sample.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    if (editor && itemId) {
      if (member === undefined) return
      started.current = true
      // Signed out: nothing to open, the notice below says why.
      if (member) void openItem(itemId)
      return
    }
    started.current = true
    fromAbc(initialAbc ?? SAMPLE_ABC).then(load, (e) => setProblem(problemOf(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member])
  useEffect(() => () => stop(), [])

  // The editor lists the member's library to open a tune from it.
  useEffect(() => {
    if (!editor || !member) return
    listLibrary()
      .then(setLibrary)
      .catch(() => setLibrary([]))
  }, [editor, member?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hand-made fingerings belong to one track and keyboard of the tune.
  const editsKey = `${track}.${profile.id}`
  const edits = useMemo(() => allEdits[editsKey] ?? {}, [allEdits, editsKey])

  const storeEdits = (next: Record<string, FingerChoice>) => {
    const all = { ...allEdits }
    if (Object.keys(next).length) all[editsKey] = next
    else delete all[editsKey]
    setAllEdits(all)
    if (item)
      void updateLibraryItem(item.id, { fingerings: all }).catch(() => setLibProblem('generic'))
  }

  const saveToLibrary = async () => {
    if (!pendingFile || !song) return
    setSaving(true)
    setLibProblem(null)
    try {
      const doc = await saveFileToLibrary(pendingFile, song.title || pendingFile.name)
      if (Object.keys(allEdits).length) await updateLibraryItem(doc.id, { fingerings: allEdits })
      setItem({ ...doc, fingerings: allEdits })
      setPendingFile(null)
      window.history.replaceState(null, '', `?item=${doc.id}`)
      setLibrary(await listLibrary())
    } catch (e) {
      setLibProblem(e instanceof ApiError ? e.key : 'generic')
    } finally {
      setSaving(false)
    }
  }

  const lineLabels = useMemo(() => ({ push: tl('push'), pull: tl('pull'), bass: tl('bass') }), [tl])

  const result = useMemo(() => {
    if (!song) return null
    try {
      const arr = arrange(song, profile, {
        trackIndex: track,
        rows: activeRows,
        transpose,
        bass: prefs.bass,
        fingerings: edits,
      })
      const lines = layout(arr, profile, song.meter, {
        width,
        staff: prefs.staff,
        labels: lineLabels,
        maxBarsPerLine: width < 520 ? 2 : width < 760 ? 3 : arr.meter.beatsPerBar > 4 ? 2 : 4,
      })
      return { arr, lines, failed: false }
    } catch {
      return { arr: null, lines: [], failed: true }
    }
    // activeRows is derived from prefs.rows and profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    song,
    track,
    profile,
    prefs.rows,
    transpose,
    prefs.bass,
    prefs.staff,
    lineLabels,
    edits,
    width,
  ])

  const arr = result?.arr ?? null
  const lastBar = arr?.toBar ?? 1
  const passage = useMemo(() => {
    if (!arr) return undefined
    const from = Math.min(Math.max(1, fromBar), lastBar)
    const to = Math.min(Math.max(from, toBar || lastBar), lastBar)
    const start = from === 1 ? 0 : arr.pickup + (from - 1) * arr.meter.barLength
    return {
      from,
      to,
      start,
      end: arr.pickup + to * arr.meter.barLength,
      whole: from === 1 && to === lastBar,
    }
  }, [arr, fromBar, toBar, lastBar])

  // Changing a setting recomputes the tab: the playback in progress no longer matches it.
  useEffect(
    () => stop(),
    [result, tempo, prefs.speed, prefs.metronome, prefs.loop, passage?.start, passage?.end],
  )

  function stop() {
    cancelAnimationFrame(raf.current)
    playback.current?.stop()
    playback.current = null
    setCursor(null)
  }

  const start = useCallback(
    (withCountIn = prefs.countIn) => {
      if (!arr || !passage) return
      stop()
      const pb = play(arr, profile, {
        bpm: (tempo * prefs.speed) / 100,
        from: Math.max(passage.start, arr.notes[0]?.start ?? 0),
        to: passage.end,
        metronome: prefs.metronome,
        countIn: withCountIn,
      })
      playback.current = pb
      const tick = () => {
        const time = pb.position()
        if (time > pb.to + 0.05) {
          if (prefs.loop) return start(false)
          return stop()
        }
        // Only events that are still sounding stay highlighted (nothing during rests or the count-in).
        const note = arr.notes.findIndex((n) => n.start <= time + 1e-6 && time < n.start + n.dur)
        const bassLen = arr.meter.beat * 0.55
        const b = arr.bass.findIndex((ev) => ev.time <= time + 1e-6 && time < ev.time + bassLen)
        const n = arr.notes[note]
        setCursor({
          time: Math.max(time, pb.from),
          note,
          bass: b,
          noteStart: n?.start,
          noteDur: n?.dur,
        })
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    },
    [arr, passage, profile, tempo, prefs.speed, prefs.metronome, prefs.countIn, prefs.loop],
  )

  // Space bar plays and stops, unless typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (
        e.code !== 'Space' ||
        /INPUT|TEXTAREA|SELECT|BUTTON/.test(el.tagName) ||
        el.getAttribute('role') === 'button'
      )
        return
      e.preventDefault()
      if (playback.current) stop()
      else start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [start])

  const trackName = (tr: Track, i: number) =>
    tr.name ||
    (tr.instrument
      ? t('trackInstrument', { n: i + 1, instrument: tr.instrument })
      : t('trackFallback', { n: i + 1 }))
  const rowName = (id: string) => {
    const i = profile.rows.findIndex((r) => r.id === id)
    return rowLabel(tn, id, i, profile.rows.length, t)
  }
  const buttonText = (f: FingerChoice) => {
    const row = profile.rows.find((r) => r.id === f.row)
    return `${f.button}${row?.suffix ?? ''}`
  }
  const describe = (i: number) => {
    const n = arr?.notes[i]
    if (!n) return ''
    return t('noteAria', {
      button: buttonText(n.fingering),
      bellows: n.fingering.bellows === 'push' ? t('legendPush') : t('legendPull'),
      note: noteName(n.pitch, locale),
    })
  }

  const setEdit = (i: number, choice: FingerChoice | null) => {
    const n = arr?.notes[i]
    if (!n) return
    const next = { ...edits }
    if (choice) next[noteKey(n.start)] = choice
    else delete next[noteKey(n.start)]
    storeEdits(next)
    setEditing(null)
  }

  const exportPdf = async () => {
    if (!arr || !song) return
    setPdfBusy(true)
    try {
      const { buildPdf } = await import('@/lib/pdf')
      const blob = await buildPdf(arr, profile, song.meter, {
        title: song.title || t('untitled'),
        subtitle: subtitle(),
        legend: legend().join('   '),
        footer: t('pdfFooter'),
        labels: lineLabels,
        staff: prefs.pdfStaff,
        color: prefs.pdfColor,
        barsPerLine: prefs.pdfBarsPerLine,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(song.title || 'notenn').replace(/[\\/:*?"<>|]+/g, '').trim() || 'notenn'}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } finally {
      setPdfBusy(false)
    }
  }

  const subtitle = () =>
    song && arr
      ? t('subtitle', {
          instrument: profileName(profile),
          meter: `${song.meter.num}/${song.meter.den}`,
          bars: arr.toBar,
        })
      : ''
  const legend = () => [
    `${tl('push')} ${t('legendPush')}`,
    `${tl('pull')} ${t('legendPull')}`,
    ...profile.rows
      .filter((r) => activeRows.includes(r.id))
      .map((r) => t('legendRow', { label: `4${r.suffix}`, row: rowName(r.id) })),
    t('legendHold'),
    // Plain words: the standard PDF fonts have no ● ○ glyphs.
    ...(prefs.bass ? [t('legendBassChordText')] : []),
    t('legendBeats'),
  ]

  const shownProblem = problem ?? (result?.failed ? { key: 'unknown' } : null)
  const editingNote = editing && arr ? arr.notes[editing.note] : undefined
  const choices = editingNote ? fingeringsFor(editingNote.pitch, profile, activeRows) : []
  const editCount = arr?.notes.filter((n) => n.edited).length ?? 0
  const playing = cursor !== null

  return (
    <div className="workshop">
      <aside className="controls" aria-label={t('settings')}>
        {editor && (
          <details open className="group">
            <summary>{t('song')}</summary>
            {member && library && (
              <label>
                <span>{t('fromLibrary')}</span>
                {library.length ? (
                  <select
                    value={item ? String(item.id) : ''}
                    onChange={(e) => e.target.value && void openItem(e.target.value)}
                  >
                    <option value="">{t('chooseItem')}</option>
                    {library.map((it) => (
                      <option key={it.id} value={it.id}>
                        {titleOf(it)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <small className="hint">{t('libraryEmpty')}</small>
                )}
              </label>
            )}
            <label className="file">
              <span>{member ? `${t('orImport')} : ${t('file')}` : t('file')}</span>
              <input
                type="file"
                accept=".mid,.midi,.musicxml,.xml,.mxl,.abc"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void attempt(() => fromFile(f), { file: f })
                  e.target.value = ''
                }}
              />
            </label>
            <details className="abc">
              <summary>{t('pasteAbc')}</summary>
              <textarea
                value={abc}
                onChange={(e) => setAbc(e.target.value)}
                aria-label={t('abcLabel')}
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => {
                  const title = /^T:(.*)$/m.exec(abc)?.[1]?.trim() || 'notenn'
                  void attempt(() => fromAbc(abc), {
                    file: new File([abc], `${title.replace(/[\\/:*?"<>|]+/g, '')}.abc`),
                  })
                }}
              >
                {t('loadAbc')}
              </button>
            </details>
            {song && song.tracks.length > 1 && (
              <label>
                <span>{t('melodyTrack')}</span>
                <select value={track} onChange={(e) => setTrack(Number(e.target.value))}>
                  {song.tracks.map((tr, i) => (
                    <option key={i} value={i}>
                      {t('trackOption', { name: trackName(tr, i), count: tr.notes.length })}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </details>
        )}

        <details open className="group">
          <summary>{t('keyboard')}</summary>
          <label>
            <span>{t('instrument')}</span>
            <select
              value={profile.id}
              onChange={(e) => setPrefs({ profileId: e.target.value, rows: null })}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {profileName(p)}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t('rows')}</legend>
            {profile.rows.map((r) => (
              <label key={r.id} className="inline">
                <input
                  type="checkbox"
                  checked={activeRows.includes(r.id)}
                  disabled={activeRows.length === 1 && activeRows.includes(r.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...activeRows, r.id]
                      : activeRows.filter((x) => x !== r.id)
                    setPrefs({ rows: next.length === profile.rows.length ? null : next })
                  }}
                />
                {rowName(r.id)}
              </label>
            ))}
          </fieldset>
          <label>
            <span>{t('transpose')}</span>
            <select
              value={String(transpose)}
              onChange={(e) =>
                setTranspose(e.target.value === 'auto' ? 'auto' : Number(e.target.value))
              }
            >
              <option value="auto">{t('auto')}</option>
              {Array.from({ length: 25 }, (_, i) => i - 12).map((v) => (
                <option key={v} value={v}>
                  {t('semitones', { value: Math.abs(v), signed: signed(v) })}
                </option>
              ))}
            </select>
          </label>
        </details>

        <details open className="group">
          <summary>{t('display')}</summary>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.staff}
              onChange={(e) => setPrefs({ staff: e.target.checked })}
            />{' '}
            {t('staff')}
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.bass}
              onChange={(e) => setPrefs({ bass: e.target.checked })}
            />{' '}
            {t('basses')}
          </label>
        </details>

        {editor && (
          <details open className="group">
            <summary>{t('practice')}</summary>
            <div className="pair">
              <label>
                <span>{t('fromBar')}</span>
                <input
                  type="number"
                  min={1}
                  max={lastBar}
                  value={fromBar}
                  onChange={(e) => setFromBar(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label>
                <span>{t('toBar')}</span>
                <input
                  type="number"
                  min={1}
                  max={lastBar}
                  value={toBar || ''}
                  placeholder={String(lastBar)}
                  onChange={(e) => setToBar(Math.max(0, Number(e.target.value) || 0))}
                />
              </label>
            </div>
            {passage && !passage.whole && (
              <button type="button" className="link" onClick={() => (setFromBar(1), setToBar(0))}>
                {t('wholeTune')}
              </button>
            )}
            <label>
              <span>{t('tempo')}</span>
              <input
                type="number"
                min={30}
                max={240}
                value={tempo}
                onChange={(e) =>
                  setTempo(Math.min(240, Math.max(30, Number(e.target.value) || 80)))
                }
              />
            </label>
          </details>
        )}

        <details className="group">
          <summary>{t('pdf')}</summary>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.pdfStaff}
              onChange={(e) => setPrefs({ pdfStaff: e.target.checked })}
            />{' '}
            {t('staff')}
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.pdfColor}
              onChange={(e) => setPrefs({ pdfColor: e.target.checked })}
            />{' '}
            {t('pdfColor')}
          </label>
          <label>
            <span>{t('pdfBarsPerLine')}</span>
            <select
              value={prefs.pdfBarsPerLine}
              onChange={(e) => setPrefs({ pdfBarsPerLine: Number(e.target.value) })}
            >
              <option value={0}>{t('auto')}</option>
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void exportPdf()} disabled={!arr || pdfBusy}>
            {pdfBusy ? t('pdfBusy') : t('pdfDownload')}
          </button>
        </details>
      </aside>

      <section className="score" ref={scoreRef}>
        {shownProblem && (
          <p className="notice error" role="alert">
            {te(shownProblem.key)}
          </p>
        )}
        {libNotice && (
          <p className="notice error" role="alert">
            {libNotice === 'itemLoginRequired' || libNotice === 'itemMissing'
              ? t(libNotice)
              : ta(`errors.${libNotice}`)}
            {libNotice === 'itemLoginRequired' && (
              <>
                {' '}
                <Link href="/account/login">{ta('login')}</Link>
              </>
            )}
          </p>
        )}
        {editor && arr && (
          <div className={`save-state${item ? ' saved' : ''}`} role="status">
            {item ? (
              <span>{t('savedIn')}</span>
            ) : member ? (
              <>
                <span>{t('notSaved')}</span>
                {pendingFile && (
                  <button type="button" onClick={() => void saveToLibrary()} disabled={saving}>
                    {saving ? t('saving') : t('saveToLibrary')}
                  </button>
                )}
              </>
            ) : member === null ? (
              <>
                <span>{t('guestNote')}</span>
                <Link href="/account/signup" className="button-link">
                  {t('guestLink')}
                </Link>
              </>
            ) : null}
          </div>
        )}
        {arr && song && (
          <>
            <header className="score-head">
              {showTitle && <h2>{(item ? titleOf(item) : song.title) || t('untitled')}</h2>}
              <p className="sub">{subtitle()}</p>
              <ul className="facts">
                <li>
                  {arr.transpose === 0
                    ? t('originalKey')
                    : t('transposed', { signed: signed(arr.transpose) })}
                </li>
                <li>{t('bellowsChanges', { count: arr.bellowsChanges })}</li>
                {arr.approxCount > 0 && (
                  <li className="warn">{t('replaced', { count: arr.approxCount })}</li>
                )}
                {editCount > 0 && (
                  <li>
                    {t('edited', { count: editCount })}{' '}
                    <button type="button" className="link" onClick={() => storeEdits({})}>
                      {t('resetEdits')}
                    </button>
                  </li>
                )}
              </ul>
              <p className="legend">
                <span>
                  <b className="p">{tl('push')}</b> {t('legendPush')}
                </span>
                <span>
                  <b className="t">{tl('pull')}</b> {t('legendPull')}
                </span>
                {profile.rows
                  .filter((r) => activeRows.includes(r.id))
                  .map((r) => (
                    <span key={r.id}>
                      {t('legendRow', { label: `4${r.suffix}`, row: rowName(r.id) })}
                    </span>
                  ))}
                <span>{t('legendHold')}</span>
                {prefs.bass && (
                  <span>
                    <b className="b">●</b> {t('legendBass')} <b className="b">○</b>{' '}
                    {t('legendChord')}
                  </span>
                )}
                <span>{t('legendBeats')}</span>
              </p>
              {editor && <p className="tip">{t('editTip')}</p>}
            </header>
            <ArgoatSheet
              lines={result!.lines}
              width={width}
              cursor={cursor}
              passage={passage && !passage.whole ? passage : undefined}
              selected={editing?.note}
              describeNote={describe}
              onNoteClick={
                editor
                  ? (note, target) => {
                      const box = target.getBoundingClientRect()
                      const host = scoreRef.current!.getBoundingClientRect()
                      setEditing(
                        editing?.note === note
                          ? null
                          : { note, x: box.left - host.left, y: box.bottom - host.top + 6 },
                      )
                    }
                  : undefined
              }
            />
            {editing && editingNote && (
              <div
                className="popover"
                role="dialog"
                aria-label={t('chooseFingering', { note: noteName(editingNote.pitch, locale) })}
                style={{
                  left: Math.min(editing.x, (scoreRef.current?.clientWidth ?? 600) - 260),
                  top: editing.y,
                }}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
              >
                <p>{t('chooseFingering', { note: noteName(editingNote.pitch, locale) })}</p>
                <div className="choices">
                  {choices.map((f) => {
                    const current =
                      f.row === editingNote.fingering.row &&
                      f.button === editingNote.fingering.button &&
                      f.bellows === editingNote.fingering.bellows
                    return (
                      <button
                        key={`${f.row}${f.button}${f.bellows}`}
                        type="button"
                        className={`choice ${f.bellows}${current ? ' current' : ''}`}
                        aria-pressed={current}
                        autoFocus={current}
                        onClick={() =>
                          setEdit(editing.note, {
                            row: f.row,
                            button: f.button,
                            bellows: f.bellows,
                          })
                        }
                      >
                        <b>{buttonText(f)}</b>{' '}
                        {f.bellows === 'push' ? t('legendPush') : t('legendPull')}
                      </button>
                    )
                  })}
                </div>
                <div className="popover-foot">
                  {editingNote.edited && (
                    <button
                      type="button"
                      className="link"
                      onClick={() => setEdit(editing.note, null)}
                    >
                      {t('automatic')}
                    </button>
                  )}
                  <button type="button" className="link" onClick={() => setEditing(null)}>
                    {t('close')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <div className="transport" role="toolbar" aria-label={t('transport')}>
        <button
          type="button"
          className="play"
          onClick={() => (playing ? stop() : start())}
          disabled={!arr}
          aria-keyshortcuts="Space"
        >
          {playing ? t('stop') : t('listen')}
        </button>
        <label className="inline">
          <input
            type="checkbox"
            checked={prefs.loop}
            onChange={(e) => setPrefs({ loop: e.target.checked })}
          />{' '}
          {t('loop')}
        </label>
        <label className="speed">
          <span>{t('speed', { value: prefs.speed })}</span>
          <input
            type="range"
            min={40}
            max={150}
            step={5}
            value={prefs.speed}
            onChange={(e) => setPrefs({ speed: Number(e.target.value) })}
            aria-valuetext={`${prefs.speed} %`}
          />
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={prefs.metronome}
            onChange={(e) => setPrefs({ metronome: e.target.checked })}
          />{' '}
          {t('metronome')}
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={prefs.countIn}
            onChange={(e) => setPrefs({ countIn: e.target.checked })}
          />{' '}
          {t('countIn')}
        </label>
        {editor && passage && !passage.whole && (
          <span className="passage">{t('passage', { from: passage.from, to: passage.to })}</span>
        )}
      </div>
    </div>
  )
}

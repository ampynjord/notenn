import { type Ink, layout, type LineLabels } from '@notenn/argoat'
import type { Arrangement, InstrumentProfile, Meter } from '@notenn/engine'

export interface PdfOptions {
  title: string
  subtitle: string
  /** Legend line under the subtitle, already translated. */
  legend: string
  /** Footer, already translated (e.g. "Notenn · notenn.ampynjord.bzh"). */
  footer: string
  labels: LineLabels
  staff: boolean
  color: boolean
  /** 0 = automatic. */
  barsPerLine: number
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40
const WIDTH = PAGE_W - 2 * MARGIN

const COLORS: Record<Ink, [number, number, number]> = {
  push: [34, 64, 143],
  pull: [161, 38, 44],
  bass: [29, 106, 77],
  warn: [180, 83, 10],
  muted: [110, 118, 128],
  line: [176, 184, 194],
  ink: [22, 32, 43],
}
const GREYS: Record<Ink, [number, number, number]> = {
  push: [0, 0, 0],
  pull: [0, 0, 0],
  bass: [40, 40, 40],
  warn: [80, 80, 80],
  muted: [120, 120, 120],
  line: [170, 170, 170],
  ink: [0, 0, 0],
}

/** Draws the Système Argoat layout on A4 pages and returns the PDF as a Blob. */
export async function buildPdf(arr: Arrangement, profile: InstrumentProfile, meter: Meter, opts: PdfOptions): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const palette = opts.color ? COLORS : GREYS
  const rgb = (ink: Ink) => palette[ink]
  const lines = layout(arr, profile, meter, {
    width: WIDTH,
    staff: opts.staff,
    labels: opts.labels,
    ...(opts.barsPerLine > 0 ? { barsPerLine: opts.barsPerLine } : {}),
  })

  const header = () => {
    doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...COLORS.ink)
    doc.text(opts.title, MARGIN, MARGIN + 14)
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...COLORS.muted)
    doc.text(opts.subtitle, MARGIN, MARGIN + 32)
    doc.setFontSize(8.5)
    doc.text(doc.splitTextToSize(opts.legend, WIDTH) as string[], MARGIN, MARGIN + 48)
    return MARGIN + 66
  }
  const footer = (page: number) => {
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...COLORS.muted)
    doc.text(`${opts.footer}   ${page}`, PAGE_W - MARGIN, PAGE_H - 22, { align: 'right' })
  }

  let page = 1
  let y = header()
  for (const line of lines) {
    if (y + line.height > PAGE_H - MARGIN) {
      footer(page)
      doc.addPage()
      page++
      y = MARGIN
    }
    const X = (x: number) => MARGIN + x
    const Y = (v: number) => y + v
    for (const op of line.ops) {
      switch (op.kind) {
        case 'line':
          doc.setDrawColor(...rgb(op.ink)).setLineWidth(op.width)
          doc.line(X(op.x1), Y(op.y1), X(op.x2), Y(op.y2))
          break
        case 'polyline':
          doc.setDrawColor(...rgb(op.ink)).setLineWidth(op.width)
          for (let i = 1; i < op.points.length; i++) {
            const [a, b] = [op.points[i - 1]!, op.points[i]!]
            doc.line(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]))
          }
          break
        case 'ellipse':
          doc.setDrawColor(...rgb(op.ink)).setFillColor(...rgb(op.ink)).setLineWidth(0.9)
          doc.ellipse(X(op.x), Y(op.y), op.rx, op.ry, op.filled ? 'FD' : 'S')
          break
        case 'circle':
          doc.setDrawColor(...rgb('bass')).setLineWidth(1)
          if (op.filled) doc.setFillColor(...rgb('bass'))
          doc.circle(X(op.x), Y(op.y), op.r, op.filled ? 'FD' : 'S')
          const [r, g, b] = op.filled ? [255, 255, 255] : rgb('bass')
          doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(r, g, b)
          doc.text(op.label, X(op.x), Y(op.y) + 2.5, { align: 'center' })
          break
        case 'text': {
          if (op.text === '♮') {
            // The standard PDF fonts have no natural sign: draw it.
            doc.setDrawColor(...rgb(op.ink)).setLineWidth(0.8)
            const x0 = X(op.x) + 1
            const y0 = Y(op.y) - 7
            doc.line(x0, y0, x0, y0 + 8)
            doc.line(x0 + 3, y0 + 2, x0 + 3, y0 + 10)
            doc.line(x0, y0 + 3.5, x0 + 3, y0 + 2.5)
            doc.line(x0, y0 + 6.5, x0 + 3, y0 + 5.5)
            break
          }
          doc.setFont(op.mono ? 'courier' : 'helvetica', op.bold ? 'bold' : 'normal').setFontSize(op.size)
          doc.setTextColor(...rgb(op.ink))
          doc.text(op.text, X(op.x), Y(op.y), op.anchor === 'middle' ? { align: 'center' } : {})
          break
        }
      }
    }
    y += line.height + 4
  }
  footer(page)
  return doc.output('blob')
}

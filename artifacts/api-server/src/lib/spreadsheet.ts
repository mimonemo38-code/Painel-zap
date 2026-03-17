import * as XLSX from 'xlsx'

interface Sd4Row {
  codigoMaterial: string
  descricao: string
  codigoOP: string
  qtdEmpenho: number
  dataPlanejada: string | null
  statusSetor: string
  saldoAtual: number
  qtdPC: number
  dataChegada: string | null
}

interface MaterialResumo {
  codigo: string
  descricao: string
  saldoAtual: number
  qtdPC: number
  dataChegada: string | null
  qtdFalta: number
  totalEmpenho: number
  opCritica: string | null
  ops: { codigoOP: string; qtdEmpenho: number; dataPlanejada: string | null }[]
}

let rows: Sd4Row[] = []
let materiaisIndex = new Map<string, MaterialResumo>()
let opsIndex = new Map<string, { op: string; dataPlanejada: string | null; materials: MaterialResumo[] }>()
let faltasCount = 0
let _filename: string | null = null
let _uploadedAt: Date | null = null
let _ignoradas = 0

const STATUSES_IGNORADOS = ['COMERCIAL', 'EXPEDICAO', 'FINALIZADA', 'QUALIDADE', 'LOGISTICA', '#N/D', 'EXPEDICAO']

function normalizeStatus(s: string): string {
  return s.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
    return val.toLocaleDateString('pt-BR')
  }
  const s = String(val).trim()
  if (!s || s === '') return null
  return s
}

function buildIndexes() {
  materiaisIndex.clear()
  opsIndex.clear()
  faltasCount = 0

  const byMaterial = new Map<string, Sd4Row[]>()
  for (const row of rows) {
    if (!byMaterial.has(row.codigoMaterial)) byMaterial.set(row.codigoMaterial, [])
    byMaterial.get(row.codigoMaterial)!.push(row)
  }

  for (const [codigo, linhas] of byMaterial) {
    const primeiro = linhas[0]
    const saldoAtual = primeiro.saldoAtual
    const qtdPC = primeiro.qtdPC
    const dataChegada = primeiro.dataChegada
    const descricao = primeiro.descricao
    const totalDisponivel = saldoAtual + qtdPC

    const ops = linhas
      .filter(l => l.codigoOP)
      .sort((a, b) => {
        if (!a.dataPlanejada) return 1
        if (!b.dataPlanejada) return -1
        return a.dataPlanejada.localeCompare(b.dataPlanejada)
      })

    const totalEmpenho = ops.reduce((s, o) => s + o.qtdEmpenho, 0)
    const qtdFalta = Math.max(0, totalEmpenho - totalDisponivel)

    let acumulado = 0
    let opCritica: string | null = null
    for (const op of ops) {
      acumulado += op.qtdEmpenho
      if (acumulado > totalDisponivel && !opCritica) {
        opCritica = op.codigoOP
      }
    }

    if (qtdFalta > 0) faltasCount++

    materiaisIndex.set(codigo, {
      codigo,
      descricao,
      saldoAtual,
      qtdPC,
      dataChegada,
      qtdFalta,
      totalEmpenho,
      opCritica,
      ops: ops.map(o => ({
        codigoOP: o.codigoOP,
        qtdEmpenho: o.qtdEmpenho,
        dataPlanejada: o.dataPlanejada,
      })),
    })

    for (const op of ops) {
      if (!opsIndex.has(op.codigoOP)) {
        opsIndex.set(op.codigoOP, {
          op: op.codigoOP,
          dataPlanejada: op.dataPlanejada,
          materials: [],
        })
      }
      if (qtdFalta > 0) {
        opsIndex.get(op.codigoOP)!.materials.push(materiaisIndex.get(codigo)!)
      }
    }
  }
}

export function processSpreadsheet(buffer: Buffer, filename: string) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

  if (!workbook.SheetNames.includes('SD4')) {
    const err = new Error('Aba SD4 não encontrada na planilha') as any
    err.status = 400
    throw err
  }

  const sheet = workbook.Sheets['SD4']
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: 'A',
    defval: '',
  })

  const dataRows = raw.slice(1)

  let ignoradas = 0
  const parsed: Sd4Row[] = []

  for (const row of dataRows) {
    const codigoMaterial = String(row['B'] ?? '').trim()
    const statusSetor = String(row['K'] ?? '').trim()

    if (!codigoMaterial) { ignoradas++; continue }
    if (STATUSES_IGNORADOS.includes(normalizeStatus(statusSetor))) { ignoradas++; continue }

    parsed.push({
      codigoMaterial,
      descricao: String(row['D'] ?? '').trim(),
      codigoOP: String(row['F'] ?? '').trim(),
      qtdEmpenho: Number(row['G']) || 0,
      dataPlanejada: formatDate(row['H']),
      statusSetor,
      saldoAtual: Number(row['N']) || 0,
      qtdPC: Number(row['O']) || 0,
      dataChegada: formatDate(row['P']),
    })
  }

  rows = parsed
  _filename = filename
  _uploadedAt = new Date()
  _ignoradas = ignoradas

  buildIndexes()

  return {
    ok: true,
    materiais: materiaisIndex.size,
    ops: opsIndex.size,
    faltas: faltasCount,
    ignoradas,
  }
}

export function getMaterialResumo(codigo: string): MaterialResumo | undefined {
  return materiaisIndex.get(codigo)
    ?? Array.from(materiaisIndex.values()).find(m =>
        m.codigo.toLowerCase().includes(codigo.toLowerCase())
      )
}

export function getOpResumo(codigoOP: string) {
  return opsIndex.get(codigoOP)
    ?? Array.from(opsIndex.values()).find(o =>
        o.op.toLowerCase().includes(codigoOP.toLowerCase())
      )
}

export function getMaterialsComFalta() {
  return Array.from(materiaisIndex.values())
    .filter(m => m.qtdFalta > 0)
    .map(m => ({
      material: m.codigo,
      descricao: m.descricao,
      opCritica: m.opCritica ?? '—',
      qtdFalta: m.qtdFalta,
      saldoAtual: m.saldoAtual,
      qtdPC: m.qtdPC,
      dataChegada: m.dataChegada ?? '—',
      previsao: m.dataChegada ?? '—',
      status: m.qtdFalta > 100 ? 'critico' : m.qtdFalta > 20 ? 'atencao' : 'ok',
      criticidade: m.qtdFalta > 100 ? 'Crítico' : m.qtdFalta > 20 ? 'Atenção' : 'OK',
    }))
    .sort((a, b) => b.qtdFalta - a.qtdFalta)
}

export function getSpreadsheetStatus() {
  return {
    loaded: rows.length > 0,
    filename: _filename,
    uploadedAt: _uploadedAt,
    materiais: materiaisIndex.size,
    ops: opsIndex.size,
    faltas: faltasCount,
    ignoradas: _ignoradas,
  }
}

export function getSpreadsheetStats() {
  return {
    loaded: rows.length > 0,
    materiais: materiaisIndex.size,
    ops: opsIndex.size,
    faltas: faltasCount,
  }
}

export function getSpreadsheetPreview(limit = 20) {
  return rows.slice(0, limit)
}

export function reloadLastSpreadsheet() {
  if (rows.length === 0) throw new Error('Nenhuma planilha carregada')
  buildIndexes()
  return { ok: true }
}

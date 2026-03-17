import { getMaterialResumo, getOpResumo, getMaterialsComFalta } from './spreadsheet.js'

interface InterpretacaoResult {
  shouldReply: boolean
  tipo: 'material' | 'op' | 'urgente' | null
  codigo: string
}

export function interpretarMensagem(texto: string): InterpretacaoResult {
  const t = texto.trim()
  const NAO_RESPONDE: InterpretacaoResult = { shouldReply: false, tipo: null, codigo: '' }

  if (/^!urgente/i.test(t)) {
    return { shouldReply: true, tipo: 'urgente', codigo: '!urgente' }
  }

  const opExplicita = t.match(/^op[\s\-]?(\d{4,})/i)
  if (opExplicita) {
    return { shouldReply: true, tipo: 'op', codigo: opExplicita[1] }
  }

  const somenteNumero = t.replace(/\s/g, '')
  if (/^\d{6,}$/.test(somenteNumero)) {
    return { shouldReply: true, tipo: 'op', codigo: somenteNumero }
  }

  const comPontoTraco = t.match(/\b(\d{2,}[\.\-][A-Z0-9]{2,}[\.\-]?[A-Z0-9]*)\b/i)
  if (comPontoTraco) {
    return { shouldReply: true, tipo: 'material', codigo: comPontoTraco[1] }
  }

  if (/^[A-Z]{1,4}\d{3,}$/i.test(t) || /^\d{3,}[A-Z]{1,4}$/i.test(t)) {
    return { shouldReply: true, tipo: 'material', codigo: t }
  }

  return NAO_RESPONDE
}

export async function consultarMaterial(codigo: string): Promise<{ resposta: string; found: boolean }> {
  const m = getMaterialResumo(codigo)
  if (!m) {
    return {
      resposta: `❌ Material *${codigo}* não encontrado na planilha.\n\nVerifique o código e tente novamente.`,
      found: false,
    }
  }

  const linhas: string[] = [
    `📦 *Material: ${m.codigo}*`,
    `📋 ${m.descricao}`,
    ``,
    `🔢 Estoque atual: *${m.saldoAtual}*`,
    `🛒 Qtd. em PC: *${m.qtdPC}*`,
    `📅 Previsão chegada: *${m.dataChegada ?? '—'}*`,
    `⚠️ Total empenho: *${m.totalEmpenho}*`,
    `❗ Falta: *${m.qtdFalta > 0 ? m.qtdFalta : 'Sem falta'}*`,
  ]

  if (m.opCritica) {
    linhas.push(`🚨 OP crítica: *${m.opCritica}*`)
  }

  if (m.ops.length > 0) {
    linhas.push(``, `📋 OPs vinculadas (${m.ops.length}):`)
    m.ops.slice(0, 8).forEach(op => {
      linhas.push(`  • OP ${op.codigoOP} — ${op.qtdEmpenho} un — ${op.dataPlanejada ?? '—'}`)
    })
    if (m.ops.length > 8) linhas.push(`  ... e mais ${m.ops.length - 8} OPs`)
  }

  return { resposta: linhas.join('\n'), found: true }
}

export async function consultarOp(codigoOP: string): Promise<{ resposta: string; found: boolean }> {
  const op = getOpResumo(codigoOP)
  if (!op) {
    return {
      resposta: `❌ OP *${codigoOP}* não encontrada na planilha.\n\nVerifique o número e tente novamente.`,
      found: false,
    }
  }

  const materiais = op.materials
  const linhas: string[] = [
    `🏭 *OP: ${op.op}*`,
    `📅 Data planejada: *${op.dataPlanejada ?? '—'}*`,
    ``,
  ]

  if (materiais.length === 0) {
    linhas.push(`✅ Nenhuma falta crítica nesta OP.`)
  } else {
    linhas.push(`⚠️ Materiais em falta (${materiais.length}):`)
    materiais.slice(0, 8).forEach(m => {
      linhas.push(`  • *${m.codigo}* — ${m.descricao.slice(0, 30)} — Falta: ${m.qtdFalta}`)
    })
    if (materiais.length > 8) linhas.push(`  ... e mais ${materiais.length - 8} itens`)
  }

  return { resposta: linhas.join('\n'), found: true }
}

export async function consultarUrgente(): Promise<{ resposta: string; found: boolean }> {
  const faltas = getMaterialsComFalta()

  if (faltas.length === 0) {
    return {
      resposta: `✅ *Sem faltas críticas no momento.*\n\nTodos os materiais estão disponíveis para as OPs programadas.`,
      found: false,
    }
  }

  const criticos = faltas.filter(f => f.status === 'critico').slice(0, 10)
  const atencao = faltas.filter(f => f.status === 'atencao').slice(0, 5)

  const linhas: string[] = [
    `🚨 *RELATÓRIO DE FALTAS CRÍTICAS*`,
    `📊 Total de materiais em falta: *${faltas.length}*`,
    ``,
  ]

  if (criticos.length > 0) {
    linhas.push(`🔴 *CRÍTICOS (falta > 100):*`)
    criticos.forEach(f => {
      linhas.push(`  • *${f.material}* — ${f.descricao.slice(0, 25)} — Falta: ${f.qtdFalta} — OP: ${f.opCritica}`)
    })
    linhas.push(``)
  }

  if (atencao.length > 0) {
    linhas.push(`🟡 *ATENÇÃO (falta 21-100):*`)
    atencao.forEach(f => {
      linhas.push(`  • *${f.material}* — Falta: ${f.qtdFalta}`)
    })
  }

  return { resposta: linhas.join('\n'), found: true }
}

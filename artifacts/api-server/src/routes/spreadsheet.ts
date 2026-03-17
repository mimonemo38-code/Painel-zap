import { Router, type IRouter } from 'express'
import multer from 'multer'
import {
  processSpreadsheet,
  getSpreadsheetStatus,
  getSpreadsheetPreview,
  reloadLastSpreadsheet,
  getMaterialsComFalta,
  getMaterialResumo,
  getOpResumo,
} from '../lib/spreadsheet.js'

const router: IRouter = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post(
  '/spreadsheet/upload',
  upload.fields([{ name: 'file' }, { name: 'spreadsheet' }]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>
    const file = files?.['file']?.[0] ?? files?.['spreadsheet']?.[0]

    if (!file) {
      res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado' })
      return
    }

    try {
      const result = processSpreadsheet(file.buffer, file.originalname)
      res.json(result)
    } catch (err: any) {
      res.status(err.status ?? 500).json({ ok: false, error: err.message })
    }
  }
)

router.get('/spreadsheet/status', (_req, res) => {
  res.json(getSpreadsheetStatus())
})

router.get('/spreadsheet/preview', (req, res) => {
  const limit = Number(req.query['limit']) || 20
  res.json({ rows: getSpreadsheetPreview(limit) })
})

router.post('/planilha/recarregar', (_req, res) => {
  try {
    res.json(reloadLastSpreadsheet())
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.get('/planilha/preview', (req, res) => {
  const limit = Number(req.query['limit']) || 20
  res.json({ rows: getSpreadsheetPreview(limit) })
})

router.get('/relatorio/faltas', (_req, res) => {
  res.json(getMaterialsComFalta())
})

router.get('/query/material/:codigo', (req, res) => {
  const m = getMaterialResumo(req.params['codigo'])
  if (!m) {
    res.status(404).json({ ok: false, error: 'Material não encontrado' })
    return
  }
  res.json(m)
})

router.get('/query/op/:op', (req, res) => {
  const op = getOpResumo(req.params['op'])
  if (!op) {
    res.status(404).json({ ok: false, error: 'OP não encontrada' })
    return
  }
  res.json(op)
})

export default router

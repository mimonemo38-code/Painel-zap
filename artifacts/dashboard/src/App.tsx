import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'

const BASE = '/api'

async function req(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, error: (err as any).message || `HTTP ${res.status}` }
    }
    return await res.json()
  } catch {
    return { ok: false, error: 'Sem resposta do servidor' }
  }
}

type Screen = 'dashboard' | 'relatorio' | 'planilha' | 'historico' | 'numeros' | 'testar' | 'alertas' | 'config'
const screenTitles: Record<Screen, string> = {
  dashboard: 'Dashboard', relatorio: 'Relatório de Faltas', planilha: 'Planilha / Dados',
  historico: 'Histórico', numeros: 'Números Autorizados', testar: 'Testar Respostas',
  alertas: 'Alertas', config: 'Configurações'
}

type Toast = { id: number; msg: string; type: 'success' | 'error' | 'info' }
let toastId = 0

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [waStatus, setWaStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [waNumber, setWaNumber] = useState('')
  const [time, setTime] = useState('')

  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const pollStatus = useCallback(async () => {
    const r = await req('/whatsapp/status')
    if (r && !r.error && (r.connected || r.status === 'connected' || r.status === 'authenticated')) {
      setWaStatus('connected')
      setWaNumber(r.number || 'Conectado')
    } else {
      setWaStatus('disconnected')
      setWaNumber('')
    }
    setTime(new Date().toLocaleTimeString('pt-BR'))
  }, [])

  useEffect(() => {
    pollStatus()
    const t = setInterval(pollStatus, 15000)
    return () => clearInterval(t)
  }, [pollStatus])

  const navigate = (s: Screen) => {
    setScreen(s)
    document.title = `${screenTitles[s]} — MRP Bot`
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">ZA</div>
          <div>
            <div className="logo-text">ZapAuto</div>
            <div className="logo-sub">MRP Bot v1.0</div>
          </div>
        </div>
        <div className="sidebar-status">
          <div className={`status-dot${waStatus === 'connected' ? ' online' : waStatus === 'connecting' ? ' connecting' : ''}`} />
          <span>{waStatus === 'connected' ? (waNumber || 'Conectado') : waStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavItem icon={<IconDashboard />} label="Dashboard" active={screen === 'dashboard'} onClick={() => navigate('dashboard')} />
          <NavItem icon={<IconFile />} label="Relatório de Faltas" active={screen === 'relatorio'} onClick={() => navigate('relatorio')} />
          <div className="nav-section">Dados</div>
          <NavItem icon={<IconGrid />} label="Planilha / Dados" active={screen === 'planilha'} onClick={() => navigate('planilha')} />
          <NavItem icon={<IconClock />} label="Histórico" active={screen === 'historico'} onClick={() => navigate('historico')} />
          <div className="nav-section">Controle</div>
          <NavItem icon={<IconUsers />} label="Números Autorizados" active={screen === 'numeros'} onClick={() => navigate('numeros')} />
          <NavItem icon={<IconMsg />} label="Testar Respostas" active={screen === 'testar'} onClick={() => navigate('testar')} />
          <NavItem icon={<IconBell />} label="Alertas" active={screen === 'alertas'} onClick={() => navigate('alertas')} />
          <div className="nav-section">Sistema</div>
          <NavItem icon={<IconSettings />} label="Configurações" active={screen === 'config'} onClick={() => navigate('config')} />
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: 2 }}>Backend: <span style={{ color: 'var(--accent2)' }}>replit.dev</span></div>
          <div style={{ color: 'var(--text3)' }}>{time || '—'}</div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span>MRP Bot</span>
            <span className="sep">›</span>
            <span>{screenTitles[screen]}</span>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(screen)}>
              <IconRefresh /> Atualizar
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('config')}>
              <IconPhone /> WhatsApp
            </button>
          </div>
        </div>
        <div className="content">
          {screen === 'dashboard' && <ScreenDashboard onNavigate={navigate} waStatus={waStatus} />}
          {screen === 'relatorio' && <ScreenRelatorio onNavigate={navigate} />}
          {screen === 'planilha' && <ScreenPlanilha addToast={addToast} />}
          {screen === 'historico' && <ScreenHistorico />}
          {screen === 'numeros' && <ScreenNumeros addToast={addToast} />}
          {screen === 'testar' && <ScreenTestar />}
          {screen === 'alertas' && <ScreenAlertas addToast={addToast} />}
          {screen === 'config' && <ScreenConfig addToast={addToast} waStatus={waStatus} waNumber={waNumber} onStatusChange={pollStatus} />}
        </div>
      </div>

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.msg}</span>
            <button className="toast-close" onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <div className={`nav-item${active ? ' active' : ''}`} onClick={onClick}>
      {icon}{label}
      {badge ? <span className="nav-badge">{badge}</span> : null}
    </div>
  )
}

/* ==================== DASHBOARD ==================== */
function ScreenDashboard({ onNavigate, waStatus }: { onNavigate: (s: Screen) => void; waStatus: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    req('/history?limit=8').then(r => {
      if (Array.isArray(r)) setHistory(r)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <div className="cards-grid">
        <div className="card" onClick={() => onNavigate('relatorio')}>
          <div className="card-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="card-label">Faltas Críticas</div>
          <div className="card-value">—</div>
          <div className="card-sub">aguardando dados</div>
        </div>
        <div className="card" onClick={() => onNavigate('planilha')}>
          <div className="card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/></svg>
          </div>
          <div className="card-label">Planilha</div>
          <div className="card-value">—</div>
          <div className="card-sub">nenhum arquivo</div>
        </div>
        <div className="card" onClick={() => onNavigate('config')}>
          <div className={`card-icon ${waStatus === 'connected' ? 'green' : 'red'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div className="card-label">Status do Bot</div>
          <div className="card-value" style={{ color: waStatus === 'connected' ? 'var(--green)' : undefined }}>
            {waStatus === 'connected' ? 'Online' : 'Offline'}
          </div>
          <div className="card-sub">{waStatus === 'connected' ? 'WhatsApp conectado' : 'desconectado'}</div>
        </div>
        <div className="card" onClick={() => onNavigate('historico')}>
          <div className="card-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="card-label">Mensagens Hoje</div>
          <div className="card-value">{history.length || '—'}</div>
          <div className="card-sub">consultas recebidas</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">Atividade Recente <span className="table-title-sub">últimas consultas</span></div>
          </div>
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : history.length === 0 ? (
            <div className="empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <div className="empty-title">Aguardando dados</div>
              <div className="empty-sub">Conecte o WhatsApp e carregue a planilha para começar.</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>Número</th><th>Consulta</th><th>Horário</th><th>Tipo</th></tr></thead>
              <tbody>
                {history.map((h: any, i: number) => (
                  <tr key={i}>
                    <td className="main">{h.phoneNumber || '—'}</td>
                    <td>{(h.query || h.message || '—').slice(0, 30)}</td>
                    <td>{h.createdAt ? new Date(h.createdAt).toLocaleTimeString('pt-BR') : '—'}</td>
                    <td><span className={`badge badge-${h.type === 'urgente' ? 'red' : h.type === 'material' ? 'blue' : 'gray'}`}>{h.type || 'consulta'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-title">Faltas Críticas <span className="table-title-sub">materiais em risco</span></div>
          </div>
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div className="empty-title">Nenhuma falta identificada</div>
            <div className="empty-sub">Carregue a planilha para gerar o relatório.</div>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('planilha')}>Ir para Planilha</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ==================== RELATÓRIO ==================== */
function ScreenRelatorio({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="table-wrap">
      <div className="table-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="table-title">Relatório de Faltas</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" className="search-input" placeholder="Material, OP..." />
          </div>
          <select className="form-select" style={{ width: 'auto', fontSize: 11, padding: '5px 8px' }}>
            <option value="">Todos status</option>
            <option value="critico">Crítico</option>
            <option value="atencao">Atenção</option>
            <option value="ok">OK</option>
          </select>
        </div>
      </div>
      <div className="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
        <div className="empty-title">Nenhuma falta identificada</div>
        <div className="empty-sub">Carregue a planilha em "Planilha / Dados" para gerar o relatório.</div>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('planilha')}>Ir para Planilha / Dados</button>
      </div>
    </div>
  )
}

/* ==================== PLANILHA ==================== */
function ScreenPlanilha({ addToast }: { addToast: (m: string, t?: any) => void }) {
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File) => {
    if (!file) return
    setUploading(true)
    setProgress(10)
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 100)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/spreadsheet/upload', { method: 'POST', body: form })
      const r = await res.json()
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => { setUploading(false); setProgress(0) }, 800)
      if (r && !r.error) addToast('Planilha carregada com sucesso!', 'success')
      else addToast(r?.error || 'Erro ao carregar planilha', 'error')
    } catch {
      clearInterval(interval)
      setUploading(false)
      addToast('Erro ao enviar arquivo', 'error')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div
          className={`upload-area${drag ? ' drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]) }}
        >
          <input type="file" accept=".xlsx,.xls" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div className="upload-area-title">Arraste o arquivo .xlsx aqui ou clique para selecionar</div>
          <div className="upload-area-sub">Planilha SD4 — colunas B, D, F, G, H, K, N, O, P</div>
        </div>
        {uploading && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginBottom: 4 }}>Carregando planilha...</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>
      <div className="table-wrap">
        <div className="table-header">
          <div className="table-title">Preview <span className="table-title-sub">dados carregados</span></div>
        </div>
        <div className="empty">
          <div className="empty-sub">Preview dos dados carregados aparece aqui</div>
        </div>
      </div>
    </div>
  )
}

/* ==================== HISTÓRICO ==================== */
function ScreenHistorico() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    req('/history?limit=100').then(r => {
      if (Array.isArray(r)) setHistory(r)
      setLoading(false)
    })
  }, [])

  const filtered = history.filter(h =>
    !search || (h.phoneNumber || '').includes(search) || (h.query || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="table-wrap">
      <div className="table-header" style={{ justifyContent: 'space-between' }}>
        <div className="table-title">Histórico de Consultas</div>
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" className="search-input" placeholder="Código, número..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <div className="empty"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div className="empty-title">Nenhuma consulta registrada</div>
          <div className="empty-sub">As consultas do WhatsApp e manuais aparecerão aqui.</div>
        </div>
      ) : (
        <table>
          <thead><tr><th>Número</th><th>Consulta</th><th>Tipo</th><th>Data/Hora</th></tr></thead>
          <tbody>
            {filtered.map((h: any, i: number) => (
              <tr key={i}>
                <td className="main">{h.phoneNumber || '—'}</td>
                <td>{(h.query || h.message || '—').slice(0, 40)}</td>
                <td><span className={`badge badge-${h.type === 'urgente' ? 'red' : h.type === 'material' ? 'blue' : h.type === 'op' ? 'yellow' : 'gray'}`}>{h.type || 'consulta'}</span></td>
                <td>{h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/* ==================== NÚMEROS ==================== */
function ScreenNumeros({ addToast }: { addToast: (m: string, t?: any) => void }) {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [form, setForm] = useState({ phoneNumber: '', name: '', role: 'Comprador' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const r = await req('/whitelist')
    if (Array.isArray(r)) setList(r)
    else if (r?.data && Array.isArray(r.data)) setList(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = list.filter(n =>
    !search || (n.phoneNumber || '').includes(search) || (n.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = async (item: any) => {
    await req(`/whitelist/${item.id}`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) })
    load()
  }

  const save = async () => {
    if (!form.phoneNumber.trim()) { addToast('Número é obrigatório', 'error'); return }
    setSaving(true)
    const r = await req('/whitelist', { method: 'POST', body: JSON.stringify(form) })
    setSaving(false)
    if (r && !r.error && r.id) {
      addToast('Número adicionado!', 'success')
      setShowModal(false)
      setForm({ phoneNumber: '', name: '', role: 'Comprador' })
      load()
    } else {
      addToast(r?.error || 'Erro ao salvar', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await req(`/whitelist/${deleteTarget.id}`, { method: 'DELETE' })
    addToast('Número removido', 'info')
    setDeleteTarget(null)
    load()
  }

  return (
    <>
      <div className="table-wrap">
        <div className="table-header" style={{ justifyContent: 'space-between' }}>
          <div className="table-title">Números Autorizados</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" className="search-input" placeholder="Nome, número..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar
            </button>
          </div>
        </div>
        {loading ? (
          <div className="empty"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div className="empty-title">Nenhum número autorizado</div>
            <div className="empty-sub">Adicione os números que podem consultar o bot.</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>Adicionar Número</button>
          </div>
        ) : (
          <table>
            <thead><tr><th>Número</th><th>Nome</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map((n: any) => (
                <tr key={n.id}>
                  <td className="main">{n.phoneNumber}</td>
                  <td>{n.name || '—'}</td>
                  <td><span className="badge badge-blue">{n.role || 'Usuário'}</span></td>
                  <td><span className={`badge badge-${n.active ? 'green' : 'gray'}`}>{n.active ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggle(n)}>{n.active ? 'Desativar' : 'Ativar'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(n)}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-title">Adicionar Número</div>
            <div className="modal-sub">Configure o acesso ao bot para este contato</div>
            <div className="form-group">
              <label className="form-label">Número WhatsApp</label>
              <input type="text" className="form-input" placeholder="+55 11 99999-9999"
                value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome / Apelido</label>
                <input type="text" className="form-input" placeholder="João da Silva"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option>Comprador</option>
                  <option>PCP</option>
                  <option>Chão de Fábrica</option>
                  <option>Gerência</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Permissões</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['Consultar material', 'Consultar OP', 'Ver relatório', 'Usar !urgente'].map(p => (
                  <label key={p} style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)', cursor: 'pointer', alignItems: 'center' }}>
                    <input type="checkbox" defaultChecked={p !== 'Ver relatório' && p !== 'Usar !urgente'} /> {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" /> : null} Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal">
            <div className="modal-title" style={{ color: 'var(--red)' }}>Remover Número</div>
            <div className="modal-sub">Tem certeza que deseja remover {deleteTarget.name || deleteTarget.phoneNumber}?</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ==================== TESTAR ==================== */
function ScreenTestar() {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'bot'; text: string; time: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMsgs(m => [...m, { role: 'user', text, time: now }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const nowBot = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMsgs(m => [...m, { role: 'bot', text: `Consulta recebida: "${text}"\n\n[Simulador] Conecte a planilha e o WhatsApp para respostas reais.`, time: nowBot }])
    setLoading(false)
  }

  const suggestions = ['estoque 100', 'op 12345', '!urgente material X', 'ajuda', 'relatorio']

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)', boxShadow: '0 0 6px var(--yellow)' }} />
          Simulador — modo teste (sem envio real)
        </div>
        <div style={{ margin: '4px 14px 0', background: 'var(--yellow-dim)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--yellow)', textAlign: 'center' }}>
          AMBIENTE DE TESTES — Respostas não são enviadas pelo WhatsApp
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {msgs.length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: 40 }}>
              Digite uma consulta para testar o bot
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, lineHeight: 1.5, ...(m.role === 'user' ? { background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,.2)', color: 'var(--text)', alignSelf: 'flex-end', fontFamily: 'var(--font-mono)' } : { background: 'var(--bg4)', border: '1px solid var(--border2)', color: 'var(--text2)', alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }) }}>
              {m.text}
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3, textAlign: 'right' }}>{m.time}</div>
            </div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)' }}><div className="spinner" style={{ color: 'var(--text3)' }} /></div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} style={{ background: 'var(--bg4)', border: '1px solid var(--border2)', borderRadius: 10, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', cursor: 'pointer', transition: 'all .15s' }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input type="text" className="form-input" placeholder="Digite uma consulta..." value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => send(input)} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Enviar'}
          </button>
        </div>
      </div>
      <div style={{ width: 320, background: 'var(--bg3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#22c55e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'rgba(34,197,94,.5)' }}>
          <span>console.log</span><span>sistema</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: 11, lineHeight: 1.7 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ opacity: .85 }}>
              <span style={{ color: 'rgba(34,197,94,.5)' }}>[{m.time}] </span>
              <span style={{ color: '#60a5fa' }}>{m.role === 'user' ? 'IN' : 'OUT'}</span>
              <span style={{ color: 'rgba(34,197,94,.7)' }}> {m.text.slice(0, 40)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== ALERTAS ==================== */
function ScreenAlertas({ addToast }: { addToast: (m: string, t?: any) => void }) {
  const [toggles, setToggles] = useState({ faltas: true, desatualizada: false, resumo: false })
  return (
    <div>
      <div className="settings-card">
        <div className="settings-card-header">Configuração de Alertas</div>
        <div className="settings-card-body">
          <div className="toggle-row">
            <div><div className="toggle-label">Alertas automáticos de falta</div><div className="toggle-sub">Envia mensagem quando material está crítico</div></div>
            <div className={`toggle${toggles.faltas ? ' on' : ''}`} onClick={() => setToggles(t => ({ ...t, faltas: !t.faltas }))} />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">Alerta de planilha desatualizada</div><div className="toggle-sub">Notifica quando planilha tem mais de 24h</div></div>
            <div className={`toggle${toggles.desatualizada ? ' on' : ''}`} onClick={() => setToggles(t => ({ ...t, desatualizada: !t.desatualizada }))} />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">Resumo diário</div><div className="toggle-sub">Envio automático às 08:00</div></div>
            <div className={`toggle${toggles.resumo ? ' on' : ''}`} onClick={() => setToggles(t => ({ ...t, resumo: !t.resumo }))} />
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => addToast('Configurações salvas!', 'success')}>
              Salvar configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==================== CONFIG / WhatsApp ==================== */
function ScreenConfig({ addToast, waStatus, waNumber, onStatusChange }: {
  addToast: (m: string, t?: any) => void;
  waStatus: string;
  waNumber: string;
  onStatusChange: () => Promise<void>;
}) {
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrTimer, setQrTimer] = useState(60)
  const [connecting, setConnecting] = useState(false)
  const [config, setConfig] = useState({ autoRespond: true, welcomeMessage: '', dailyLimit: 100 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    req('/config').then(r => { if (r && !r.error) setConfig(c => ({ ...c, ...r })) })
    return clearTimers
  }, [])

  const startQrPolling = () => {
    clearTimers()
    let t = 60
    setQrTimer(60)
    timerRef.current = setInterval(() => {
      t--
      setQrTimer(t)
      if (t <= 0) {
        clearTimers()
        setQrData(null)
        setQrLoading(false)
        addToast('QR Code expirado. Gere novamente.', 'error')
      }
    }, 1000)
    pollRef.current = setInterval(async () => {
      const r = await req('/whatsapp/status')
      if (r && (r.connected || r.status === 'connected' || r.status === 'authenticated')) {
        clearTimers()
        setQrData(null)
        setQrLoading(false)
        addToast('WhatsApp conectado com sucesso! ✅', 'success')
        onStatusChange()
      } else {
        const qr = await req('/whatsapp/qr')
        if (qr && qr.qr) setQrData(qr.qr)
      }
    }, 3000)
  }

  const gerarQR = async () => {
    clearTimers()
    setQrLoading(true)
    setQrData(null)
    setConnecting(true)
    const r = await req('/whatsapp/connect', { method: 'POST' })
    setConnecting(false)
    if (r && r.error && !r.ok) {
      addToast(r.error, 'error')
      setQrLoading(false)
      return
    }
    await new Promise(res => setTimeout(res, 2500))
    const qr = await req('/whatsapp/qr')
    setQrLoading(false)
    if (qr && qr.qr) {
      setQrData(qr.qr)
      startQrPolling()
    } else {
      const status = await req('/whatsapp/status')
      if (status?.connected || status?.status === 'connected') {
        addToast('WhatsApp já está conectado! ✅', 'success')
        onStatusChange()
      } else {
        addToast('QR Code não disponível. Aguarde alguns segundos e tente novamente.', 'info')
      }
    }
  }

  const desconectar = async () => {
    clearTimers()
    setQrData(null)
    await req('/whatsapp/disconnect', { method: 'POST' })
    addToast('WhatsApp desconectado', 'info')
    onStatusChange()
  }

  const salvarConfig = async () => {
    const r = await req('/config', { method: 'PUT', body: JSON.stringify(config) })
    if (r && !r.error) addToast('Configurações salvas!', 'success')
    else addToast('Erro ao salvar', 'error')
  }

  return (
    <div>
      {/* WhatsApp */}
      <div className="settings-card">
        <div className="settings-card-header">Conectar WhatsApp</div>
        <div className="settings-card-body">
          {waStatus === 'connected' ? (
            <div className="connected-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12"/></svg>
              <span>{waNumber ? `✅ Conectado | ${waNumber}` : '✅ Conectado'}</span>
              <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={desconectar}>Desconectar</button>
            </div>
          ) : (
            <>
              <button className="btn btn-primary" onClick={gerarQR} disabled={qrLoading || connecting} style={{ marginBottom: 14 }}>
                {(qrLoading || connecting) ? (
                  <span className="spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="14" y="14" width="7" height="7"/></svg>
                )}
                {connecting ? 'Iniciando conexão...' : qrLoading ? 'Aguardando QR Code...' : 'Gerar QR Code'}
              </button>
              {qrData && (
                <div className="qr-wrap">
                  <div className="qr-img">
                    <img src={qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`} alt="QR Code WhatsApp" />
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)', marginBottom: 6 }}>
                    Abra WhatsApp → Menu → Aparelhos conectados → Conectar
                  </div>
                  <div className="qr-countdown">QR expira em <span>{qrTimer}s</span></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bot Config */}
      <div className="settings-card">
        <div className="settings-card-header">Configuração do Bot</div>
        <div className="settings-card-body">
          <div className="section-title" style={{ marginTop: 0 }}>Dados a exibir nas respostas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {['Estoque atual', 'Número do PC', 'Previsão de chegada', 'Fornecedor', 'Lista de OPs', 'Cliente da OP', 'Comparar prazo PC vs falta'].map(label => (
              <label key={label} style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)', cursor: 'pointer', alignItems: 'center' }}>
                <input type="checkbox" defaultChecked /> {label}
              </label>
            ))}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Máx. OPs por material</label>
              <input type="number" className="form-input" defaultValue={10} min={1} max={50} />
            </div>
            <div className="form-group">
              <label className="form-label">Alertar se falta em menos de (dias)</label>
              <input type="number" className="form-input" defaultValue={3} min={1} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="toggle-row">
              <div><div className="toggle-label">Auto-responder mensagens</div><div className="toggle-sub">Responde automaticamente quando recebe mensagem</div></div>
              <div className={`toggle${config.autoRespond ? ' on' : ''}`} onClick={() => setConfig(c => ({ ...c, autoRespond: !c.autoRespond }))} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={salvarConfig}>Salvar configurações</button>
        </div>
      </div>

      {/* Mensagens */}
      <div className="settings-card">
        <div className="settings-card-header">Mensagens Personalizadas</div>
        <div className="settings-card-body">
          <div className="form-group">
            <label className="form-label">Saudação inicial</label>
            <textarea className="form-input form-textarea" placeholder="Olá! Sou o MRP Bot..."
              value={config.welcomeMessage} onChange={e => setConfig(c => ({ ...c, welcomeMessage: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Material não encontrado</label>
            <textarea className="form-input form-textarea" style={{ minHeight: 60 }} placeholder="Material não encontrado na planilha..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">OP não encontrada</label>
              <textarea className="form-input form-textarea" style={{ minHeight: 60 }} placeholder="OP não encontrada..." />
            </div>
            <div className="form-group">
              <label className="form-label">Dados desatualizados</label>
              <textarea className="form-input form-textarea" style={{ minHeight: 60 }} placeholder="Atenção: planilha desatualizada..." />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => addToast('Mensagens salvas!', 'success')}>Salvar mensagens</button>
        </div>
      </div>
    </div>
  )
}

/* ==================== ICONS ==================== */
function IconDashboard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconFile() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IconGrid() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="3"/></svg> }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconUsers() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconMsg() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconBell() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function IconSettings() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> }
function IconRefresh() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function IconPhone() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> }

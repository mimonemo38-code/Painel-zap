import React, { useState, useEffect } from 'react'

interface Message {
  id: number
  text: string
  timestamp: string
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch messages
    fetch('http://localhost:3000/api/messages')
      .then(r => r.json())
      .then(data => setMessages(data.messages))
      .catch(e => console.error('Erro ao buscar mensagens:', e))
      .finally(() => setLoading(false))

    // Fetch status
    fetch('http://localhost:3000/api/status')
      .then(r => r.json())
      .then(data => setStatus(data))
      .catch(e => console.error('Erro ao buscar status:', e))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 ZapAuto Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Sistema MRP via WhatsApp</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium">API Server</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {status?.api === 'running' ? '✅ Online' : '❌ Offline'}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Uptime: {status?.uptime?.toFixed(1)}s
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium">Mensagens</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {messages.length}
            </p>
            <p className="text-gray-500 text-xs mt-2">Total processadas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-600 text-sm font-medium">Versão</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {status?.version || 'N/A'}
            </p>
            <p className="text-gray-500 text-xs mt-2">ZapAuto v{status?.version}</p>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Mensagens Recentes</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : messages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {messages.map((msg) => (
                <div key={msg.id} className="p-6 hover:bg-gray-50">
                  <p className="text-gray-900 font-medium">{msg.text}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {new Date(msg.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Nenhuma mensagem ainda
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">ℹ️ Informações do Sistema</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>✅ API Server rodando em <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:3000</code></li>
            <li>✅ Dashboard rodando em <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:5173</code></li>
            <li>📊 Health check em <code className="bg-blue-100 px-2 py-1 rounded">/health</code></li>
            <li>🔗 API status em <code className="bg-blue-100 px-2 py-1 rounded">/api/status</code></li>
          </ul>
        </div>
      </main>
    </div>
  )
}

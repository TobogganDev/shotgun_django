import { useEffect, useState } from 'react'
import api from '../api/axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const STATUS_STYLES = {
  confirmed: { color: '#22c55e', label: 'Confirmé' },
  pending:   { color: '#f97316', label: 'En attente' },
  cancelled: { color: '#ef4444', label: 'Annulé' },
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tickets/mine/')
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" />Chargement…</div>

  return (
    <main style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Mes billets</h1>

      {tickets.length === 0 ? (
        <p style={{ color: 'var(--text)' }}>Tu n'as pas encore de billets.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map(ticket => {
            const s = STATUS_STYLES[ticket.status] ?? { color: '#fff', label: ticket.status }
            return (
              <div key={ticket.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{ticket.event.title}</h2>
                  <span style={{
                    color: s.color,
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}44`,
                    borderRadius: 6,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}>{s.label}</span>
                </div>
                <p style={{ color: 'var(--purple)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                  {formatDate(ticket.event.date)}
                </p>
                <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>{ticket.event.location}</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <img
                    src={`${API_BASE}/api/tickets/${ticket.ticket_code}/qr/`}
                    alt="QR code billet"
                    style={{ width: 96, height: 96, borderRadius: 8, background: '#fff', padding: 4 }}
                  />
                  <code style={{
                    alignSelf: 'center',
                    fontSize: '0.78rem',
                    color: 'var(--text)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '0.4rem 0.75rem',
                    letterSpacing: '0.5px',
                    wordBreak: 'break-all',
                  }}>{ticket.ticket_code}</code>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

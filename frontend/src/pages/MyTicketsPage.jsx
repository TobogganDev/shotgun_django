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
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    api.get('/api/tickets/mine/')
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(ticketId) {
    if (!confirm('Annuler cette inscription ? Cette action est irréversible.')) return
    setCancelling(ticketId)
    try {
      await api.patch(`/api/tickets/${ticketId}/cancel/`)
      setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, status: 'cancelled' } : t))
    } catch {
      alert("Impossible d'annuler cette inscription.")
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="spinner" /> Chargement…
    </div>
  )

  return (
    <main style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Mes billets</h1>

      {tickets.length === 0 ? (
        <p style={{ color: 'var(--text)' }}>Tu n'as pas encore de billets.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map(ticket => {
            const s = STATUS_STYLES[ticket.status] ?? { color: '#fff', label: ticket.status }
            const isConfirmed = ticket.status === 'confirmed'

            return (
              <div key={ticket.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{ticket.event.title}</h2>
                    <span style={{
                      color: s.color, background: `${s.color}18`,
                      border: `1px solid ${s.color}44`,
                      borderRadius: 6, padding: '0.2rem 0.6rem',
                      fontSize: '0.78rem', fontWeight: 600, flexShrink: 0,
                    }}>{s.label}</span>
                  </div>
                  <p style={{ color: 'var(--purple)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {formatDate(ticket.event.date)}
                  </p>
                  <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>{ticket.event.location}</p>
                </div>

                {/* QR + code + cancel */}
                <div style={{
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  padding: '1rem 1.5rem',
                  display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
                }}>
                  <img
                    src={`${API_BASE}/api/tickets/${ticket.ticket_code}/qr/`}
                    alt="QR code billet"
                    style={{
                      width: 88, height: 88, borderRadius: 8,
                      background: '#fff', padding: 4, flexShrink: 0,
                      opacity: ticket.status === 'cancelled' ? 0.35 : 1,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <code style={{
                      fontSize: '0.78rem', color: 'var(--text)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '0.4rem 0.75rem',
                      letterSpacing: '0.5px', wordBreak: 'break-all', display: 'block',
                    }}>{ticket.ticket_code}</code>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancel(ticket.id)}
                        disabled={cancelling === ticket.id}
                        style={{
                          alignSelf: 'flex-start',
                          background: 'transparent', border: '1px solid #ef444455', color: '#ef4444',
                          borderRadius: 6, padding: '0.3rem 0.875rem',
                          fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600,
                          cursor: cancelling === ticket.id ? 'not-allowed' : 'pointer',
                          opacity: cancelling === ticket.id ? 0.6 : 1,
                        }}
                      >
                        {cancelling === ticket.id ? 'Annulation…' : "Se désinscrire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

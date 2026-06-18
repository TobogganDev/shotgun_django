import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  title: '', description: '', date: '', end_date: '', location: '',
  capacity: '', price: '0', is_published: false, cover_image: null,
}

const STATUS_LABEL = { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé' }
const STATUS_COLOR = { confirmed: '#22c55e', pending: '#f97316', cancelled: '#ef4444' }

function formatDateRange(start, end) {
  const fmt = (d) => new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
  const fmtTime = (d) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  if (!end) return fmt(start)
  return `${fmt(start)} → ${fmtTime(end)}`
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function AttendeePanel({ eventId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/events/${eventId}/attendees/`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: '#111',
      padding: '1rem 1.25rem',
    }}>
      {loading && <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Chargement…</p>}

      {!loading && data && (
        <>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.875rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{data.total}</strong> inscrit{data.total > 1 ? 's' : ''}
            </span>
            <span style={{ color: '#22c55e' }}>
              <strong>{data.confirmed}</strong> confirmé{data.confirmed > 1 ? 's' : ''}
            </span>
            <span style={{ color: '#f97316' }}>
              <strong>{data.total - data.confirmed}</strong> en attente / annulé
            </span>
          </div>

          {data.attendees.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Aucune inscription pour cet événement.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text)', textAlign: 'left' }}>
                    <th style={thStyle}>Participant</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Statut</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Qté</th>
                    <th style={thStyle}>Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attendees.map((a, i) => (
                    <tr key={a.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{a.full_name}</span>
                        <span style={{ color: 'var(--text)', marginLeft: '0.4rem' }}>@{a.username}</span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text)' }}>{a.email}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: STATUS_COLOR[a.status] + '22',
                          color: STATUS_COLOR[a.status],
                          border: `1px solid ${STATUS_COLOR[a.status]}44`,
                          borderRadius: 4,
                          padding: '0.15rem 0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-primary)' }}>{a.quantity}</td>
                      <td style={{ ...tdStyle, color: 'var(--text)' }}>{formatShortDate(a.registered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const thStyle = { padding: '0.35rem 0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.5rem 0.5rem' }

export default function OrganizerDashboard() {
  const { user } = useAuth()
  const { hash } = useLocation()
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [openAttendees, setOpenAttendees] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (hash === '#create') {
      setTimeout(() => document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [hash])

  function fetchEvents() {
    api.get('/api/events/').then(({ data }) => {
      setEvents(data.filter(e => e.organizer === user.username))
    })
  }

  useEffect(() => { fetchEvents() }, [])

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') setForm(f => ({ ...f, cover_image: files[0] ?? null }))
    else if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }))
    else setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'cover_image') { if (v) body.append(k, v) }
        else if (k === 'end_date' && !v) { /* skip empty end_date */ }
        else body.append(k, v)
      })
      await api.post('/api/events/', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(EMPTY_FORM)
      if (fileRef.current) fileRef.current.value = ''
      fetchEvents()
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePublish(ev) {
    await api.patch(`/api/events/${ev.id}/`, { is_published: !ev.is_published })
    fetchEvents()
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet événement ?')) return
    await api.delete(`/api/events/${id}/`)
    fetchEvents()
  }

  function toggleAttendees(id) {
    setOpenAttendees(prev => prev === id ? null : id)
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '0.6rem 0.875rem', color: 'var(--text-primary)',
    fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
  }

  return (
    <main style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* Mes événements */}
      <section>
        <h1 style={{ marginBottom: '1.25rem' }}>Mes événements</h1>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text)' }}>Aucun événement créé pour l'instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', overflow: 'hidden',
              }}>
                {/* Event row */}
                <div style={{
                  padding: '1rem 1.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--purple)', textTransform: 'capitalize' }}>
                      {formatDateRange(ev.date, ev.end_date)}
                    </span>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text)' }}>
                      <span>{ev.spots_left} places restantes</span>
                      <span style={{ color: ev.is_published ? '#22c55e' : '#f97316' }}>
                        {ev.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                    {/* Attendees toggle */}
                    <button
                      onClick={() => toggleAttendees(ev.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: openAttendees === ev.id ? '#8b5cf622' : 'transparent',
                        border: `1px solid ${openAttendees === ev.id ? 'var(--purple)' : 'var(--border)'}`,
                        color: openAttendees === ev.id ? 'var(--purple)' : 'var(--text)',
                        borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
                      }}
                    >
                      <Users size={13} />
                      Inscrits
                      {openAttendees === ev.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    <button
                      onClick={() => handleTogglePublish(ev)}
                      style={{
                        background: ev.is_published ? 'transparent' : '#22c55e22',
                        border: `1px solid ${ev.is_published ? '#f9731655' : '#22c55e55'}`,
                        color: ev.is_published ? '#f97316' : '#22c55e',
                        borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
                      }}
                    >{ev.is_published ? 'Dépublier' : 'Publier'}</button>

                    <button
                      onClick={() => handleDelete(ev.id)}
                      style={{
                        background: 'transparent', border: '1px solid #ef444455', color: '#ef4444',
                        borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
                      }}
                    >Supprimer</button>
                  </div>
                </div>

                {/* Attendee panel */}
                {openAttendees === ev.id && <AttendeePanel eventId={ev.id} />}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Créer un événement */}
      <section id="create">
        <h2 style={{ marginBottom: '1.25rem' }}>Créer un événement</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Titre *</label>
              <input name="title" value={form.title} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Lieu *</label>
              <input name="location" value={form.location} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Début *</label>
              <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Fin</label>
              <input name="end_date" type="datetime-local" value={form.end_date} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Capacité *</label>
              <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Prix (€)</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Image de couverture</label>
              <input ref={fileRef} name="cover_image" type="file" accept="image/*" onChange={handleChange} style={{ ...inputStyle, padding: '0.45rem 0.875rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input name="is_published" type="checkbox" checked={form.is_published} onChange={handleChange} />
            Publier immédiatement
          </label>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

          <button type="submit" disabled={submitting} style={{
            alignSelf: 'flex-start', background: 'var(--gradient)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '0.7rem 1.75rem',
            fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? 'Création…' : 'Créer l\'événement'}
          </button>
        </form>
      </section>

    </main>
  )
}

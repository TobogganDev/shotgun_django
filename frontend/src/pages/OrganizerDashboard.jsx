import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  title: '', description: '', date: '', location: '',
  capacity: '', price: '0', is_published: false, cover_image: null,
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function OrganizerDashboard() {
  const { user } = useAuth()
  const { hash } = useLocation()
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
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
                borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 700 }}>{ev.title}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--purple)', textTransform: 'capitalize' }}>
                    {formatDate(ev.date)}
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text)' }}>
                    <span>{ev.spots_left} places restantes</span>
                    <span style={{ color: ev.is_published ? '#22c55e' : '#f97316' }}>
                      {ev.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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
              <label style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>Date *</label>
              <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required style={inputStyle} />
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

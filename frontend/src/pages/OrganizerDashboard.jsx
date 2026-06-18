import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  title: '', description: '', date: '', end_date: '', location: '',
  capacity: '', price: '0', is_published: false, cover_image: null,
}

const inputStyle = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0.6rem 0.875rem', color: 'var(--text-primary)',
  fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
}

function toDatetimeLocal(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateRange(start, end) {
  const fmt = d => new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
  const fmtTime = d => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  if (!end) return fmt(start)
  return `${fmt(start)} → ${fmtTime(end)}`
}

const STATUS_LABELS = {
  confirmed: { label: 'Confirmé', color: '#22c55e' },
  pending:   { label: 'En attente', color: '#f97316' },
  cancelled: { label: 'Annulé', color: '#ef4444' },
}

function btnOutline(color) {
  return {
    background: 'transparent', border: `1px solid ${color}55`, color,
    borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.82rem',
    fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer',
  }
}

function label(text) {
  return { fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }
}

function FormFields({ values, onChange, fileInputRef }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Titre *</span>
          <input name="title" value={values.title} onChange={onChange} required style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Lieu *</span>
          <input name="location" value={values.location} onChange={onChange} required style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Début *</span>
          <input name="date" type="datetime-local" value={values.date} onChange={onChange} required style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Fin</span>
          <input name="end_date" type="datetime-local" value={values.end_date} onChange={onChange} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Capacité *</span>
          <input name="capacity" type="number" min="1" value={values.capacity} onChange={onChange} required style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={label()}>Prix (€)</span>
          <input name="price" type="number" min="0" step="0.01" value={values.price} onChange={onChange} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: '1 / -1' }}>
          <span style={label()}>Image de couverture</span>
          <input ref={fileInputRef} name="cover_image" type="file" accept="image/*" onChange={onChange}
            style={{ ...inputStyle, padding: '0.45rem 0.875rem' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={label()}>Description *</span>
        <textarea name="description" value={values.description} onChange={onChange} required rows={4}
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
        <input name="is_published" type="checkbox" checked={values.is_published} onChange={onChange} />
        Publier immédiatement
      </label>
    </>
  )
}

function buildFormData(values) {
  const body = new FormData()
  Object.entries(values).forEach(([k, v]) => {
    if (k === 'cover_image') { if (v) body.append(k, v) }
    else if (k === 'end_date' && !v) { /* skip empty */ }
    else body.append(k, v)
  })
  return body
}

export default function OrganizerDashboard() {
  const { user } = useAuth()
  const { hash } = useLocation()

  const [events, setEvents] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState(null)
  const editFileRef = useRef(null)

  const [expandedId, setExpandedId] = useState(null)
  const [registrantsMap, setRegistrantsMap] = useState({})
  const [loadingRegistrants, setLoadingRegistrants] = useState(false)

  function fetchEvents() {
    api.get('/api/events/').then(({ data }) =>
      setEvents(data.filter(e => e.organizer === user.username))
    )
  }

  useEffect(() => { fetchEvents() }, [])

  useEffect(() => {
    if (hash === '#create')
      setTimeout(() => document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [hash])

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') setForm(f => ({ ...f, cover_image: files[0] ?? null }))
    else if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }))
    else setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      await api.post('/api/events/', buildFormData(form), { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(EMPTY_FORM)
      if (fileRef.current) fileRef.current.value = ''
      fetchEvents()
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Une erreur est survenue.')
    } finally { setSubmitting(false) }
  }

  function startEdit(ev) {
    setEditingId(ev.id)
    setExpandedId(null)
    setEditError(null)
    setEditForm({
      title: ev.title, description: ev.description,
      date: toDatetimeLocal(ev.date), end_date: toDatetimeLocal(ev.end_date),
      location: ev.location, capacity: String(ev.capacity),
      price: String(ev.price), is_published: ev.is_published, cover_image: null,
    })
  }

  function handleEditChange(e) {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') setEditForm(f => ({ ...f, cover_image: files[0] ?? null }))
    else if (type === 'checkbox') setEditForm(f => ({ ...f, [name]: checked }))
    else setEditForm(f => ({ ...f, [name]: value }))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setEditSubmitting(true); setEditError(null)
    try {
      await api.patch(`/api/events/${editingId}/`, buildFormData(editForm), { headers: { 'Content-Type': 'multipart/form-data' } })
      setEditingId(null)
      if (editFileRef.current) editFileRef.current.value = ''
      fetchEvents()
    } catch (err) {
      const data = err.response?.data
      setEditError(data ? Object.values(data).flat().join(' ') : 'Une erreur est survenue.')
    } finally { setEditSubmitting(false) }
  }

  async function toggleRegistrants(ev) {
    if (expandedId === ev.id) { setExpandedId(null); return }
    setExpandedId(ev.id)
    setEditingId(null)
    if (registrantsMap[ev.id] !== undefined) return
    setLoadingRegistrants(true)
    try {
      const { data } = await api.get(`/api/events/${ev.id}/registrants/`)
      setRegistrantsMap(m => ({ ...m, [ev.id]: data }))
    } catch {
      setRegistrantsMap(m => ({ ...m, [ev.id]: [] }))
    } finally { setLoadingRegistrants(false) }
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

  const confirmedCount = ev => ev.capacity - ev.spots_left

  return (
    <main style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* Liste événements */}
      <section>
        <h1 style={{ marginBottom: '1.25rem' }}>Mes événements</h1>

        {events.length === 0 ? (
          <p style={{ color: 'var(--text)' }}>Aucun événement créé pour l'instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.map(ev => (
              <div key={ev.id}>

                {editingId === ev.id ? (
                  /* ── Edit form ── */
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--purple)',
                    borderRadius: 'var(--radius)', padding: '1.25rem',
                  }}>
                    <p style={{ fontWeight: 700, marginBottom: '1rem' }}>Modifier « {ev.title} »</p>
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <FormFields values={editForm} onChange={handleEditChange} fileInputRef={editFileRef} />
                      {editError && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{editError}</p>}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" disabled={editSubmitting} style={{
                          background: 'var(--gradient)', color: '#fff', border: 'none',
                          borderRadius: 8, padding: '0.65rem 1.5rem', fontFamily: 'inherit',
                          fontSize: '0.9rem', fontWeight: 700,
                          cursor: editSubmitting ? 'not-allowed' : 'pointer', opacity: editSubmitting ? 0.6 : 1,
                        }}>
                          {editSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} style={{
                          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
                          borderRadius: 8, padding: '0.65rem 1.5rem', fontFamily: 'inherit',
                          fontSize: '0.9rem', cursor: 'pointer',
                        }}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ── Event card ── */
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '1rem 1.25rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                    }}>
                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{ev.title}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--purple)', textTransform: 'capitalize' }}>
                          {formatDateRange(ev.date, ev.end_date)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                            {confirmedCount(ev)} inscrit{confirmedCount(ev) !== 1 ? 's' : ''}
                          </span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                            {ev.spots_left} place{ev.spots_left !== 1 ? 's' : ''} restante{ev.spots_left !== 1 ? 's' : ''}
                          </span>
                          <span style={{
                            color: ev.is_published ? '#22c55e' : '#f97316',
                            background: ev.is_published ? '#22c55e18' : '#f9731618',
                            border: `1px solid ${ev.is_published ? '#22c55e44' : '#f9731644'}`,
                            borderRadius: 4, padding: '0.1rem 0.5rem',
                            fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            {ev.is_published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => toggleRegistrants(ev)} style={btnOutline('#6366f1')}>
                          Inscrits ({confirmedCount(ev)})
                        </button>
                        <button onClick={() => startEdit(ev)} style={btnOutline('#3b82f6')}>
                          Modifier
                        </button>
                        <button onClick={() => handleTogglePublish(ev)} style={btnOutline(ev.is_published ? '#f97316' : '#22c55e')}>
                          {ev.is_published ? 'Dépublier' : 'Publier'}
                        </button>
                        <button onClick={() => handleDelete(ev.id)} style={btnOutline('#ef4444')}>
                          Supprimer
                        </button>
                      </div>
                    </div>

                    {/* Registrants panel */}
                    {expandedId === ev.id && (
                      <div style={{
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg-input)',
                        padding: '1rem 1.25rem',
                      }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                          Inscrits
                        </p>
                        {loadingRegistrants ? (
                          <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Chargement…</p>
                        ) : !registrantsMap[ev.id]?.length ? (
                          <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>Aucun inscrit pour le moment.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {registrantsMap[ev.id].map(r => {
                              const s = STATUS_LABELS[r.status] ?? { label: r.status, color: '#fff' }
                              return (
                                <div key={r.id} style={{
                                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                                  padding: '0.6rem 0.875rem',
                                  background: 'var(--bg-card)',
                                  borderRadius: 8, border: '1px solid var(--border)',
                                }}>
                                  <div style={{
                                    width: 30, height: 30, borderRadius: 6,
                                    background: 'var(--gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                                  }}>
                                    {r.username[0].toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.username}</div>
                                    {r.email && <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{r.email}</div>}
                                  </div>
                                  <span style={{
                                    color: s.color, background: `${s.color}18`,
                                    border: `1px solid ${s.color}44`,
                                    borderRadius: 4, padding: '0.15rem 0.5rem',
                                    fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                                  }}>{s.label}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text)', flexShrink: 0 }}>
                                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(r.registered_at))}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Créer un événement */}
      <section id="create">
        <h2 style={{ marginBottom: '1.25rem' }}>Créer un événement</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormFields values={form} onChange={handleChange} fileInputRef={fileRef} />
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" disabled={submitting} style={{
            alignSelf: 'flex-start', background: 'var(--gradient)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '0.7rem 1.75rem',
            fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? 'Création…' : "Créer l'événement"}
          </button>
        </form>
      </section>

    </main>
  )
}

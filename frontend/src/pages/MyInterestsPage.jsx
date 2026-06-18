import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import api from '../api/axios'
import EventCard from '../components/EventCard'
import styles from './HomePage.module.css'

export default function MyInterestsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  function fetchInterests() {
    api.get('/api/events/my_interests/')
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInterests() }, [])

  async function handleToggleInterest(eventId) {
    await api.post(`/api/events/${eventId}/interest/`)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Mes coups de <span className={styles.accent}>cœur</span></h1>
        <p>Les événements que tu as sauvegardés.</p>
      </header>

      {loading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className={styles.emptyState}>
          <Heart size={40} style={{ color: 'var(--text)', marginBottom: '0.75rem' }} />
          <p className={styles.empty}>Tu n'as encore sauvegardé aucun événement.</p>
          <p style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
            Clique sur le cœur d'une carte depuis la page d'accueil pour l'ajouter ici.
          </p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <>
          <p className={styles.resultCount}>
            {events.length} événement{events.length > 1 ? 's' : ''} sauvegardé{events.length > 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isInterested={true}
                onToggleInterest={handleToggleInterest}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

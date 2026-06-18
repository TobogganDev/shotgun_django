import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [interests, setInterests] = useState({})

  const [selectedCity, setSelectedCity] = useState(null)
  const [onlyFree, setOnlyFree] = useState(false)
  const [onlyUpcoming, setOnlyUpcoming] = useState(true)

  useEffect(() => {
    api.get('/api/events/')
      .then(({ data }) => {
        setEvents(data)
        const map = {}
        data.forEach(e => { map[e.id] = e.is_interested ?? false })
        setInterests(map)
      })
      .catch(() => setError('Impossible de charger les événements.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggleInterest(eventId) {
    if (!user) return
    const prev = interests[eventId] ?? false
    setInterests(m => ({ ...m, [eventId]: !prev }))
    try {
      await api.post(`/api/events/${eventId}/interest/`)
    } catch {
      setInterests(m => ({ ...m, [eventId]: prev }))
    }
  }

  const cities = useMemo(() => {
    const set = new Set(events.map(e => e.location.split(',')[0].trim()))
    return [...set].sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    const now = new Date()
    return events.filter(e => {
      if (selectedCity && !e.location.startsWith(selectedCity)) return false
      if (onlyFree && parseFloat(e.price) !== 0) return false
      if (onlyUpcoming && new Date(e.date) < now) return false
      return true
    })
  }, [events, selectedCity, onlyFree, onlyUpcoming])

  const activeFilterCount = (selectedCity ? 1 : 0) + (onlyFree ? 1 : 0) + (!onlyUpcoming ? 1 : 0)

  function clearFilters() {
    setSelectedCity(null)
    setOnlyFree(false)
    setOnlyUpcoming(true)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1>Les meilleurs événements<br /><span className={styles.accent}>près de chez toi</span></h1>
        <p>Découvre, réserve, profite.</p>
      </header>

      {!loading && !error && (
        <section className={styles.filters}>
          <div className={styles.chips}>
            <button
              className={`${styles.chip} ${onlyUpcoming ? styles.chipActive : ''}`}
              onClick={() => setOnlyUpcoming(v => !v)}
            >
              À venir
            </button>
            <button
              className={`${styles.chip} ${onlyFree ? styles.chipActive : ''}`}
              onClick={() => setOnlyFree(v => !v)}
            >
              Gratuit
            </button>
            <div className={styles.chipDivider} />
            {cities.map(city => (
              <button
                key={city}
                className={`${styles.chip} ${selectedCity === city ? styles.chipActive : ''}`}
                onClick={() => setSelectedCity(selectedCity === city ? null : city)}
              >
                {city}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button className={styles.chipReset} onClick={clearFilters}>
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
        </section>
      )}

      {loading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && filteredEvents.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.empty}>
            {events.length === 0
              ? 'Aucun événement disponible pour le moment.'
              : 'Aucun événement ne correspond à tes filtres.'}
          </p>
          {events.length > 0 && activeFilterCount > 0 && (
            <button className={styles.chip} onClick={clearFilters}>Voir tous les événements</button>
          )}
        </div>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <>
          <p className={styles.resultCount}>
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
          </p>
          <div className={styles.grid}>
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isInterested={interests[event.id] ?? false}
                onToggleInterest={user ? handleToggleInterest : undefined}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

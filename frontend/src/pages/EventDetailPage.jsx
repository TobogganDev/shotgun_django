import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import styles from './EventDetailPage.module.css'

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [registerError, setRegisterError] = useState(null)

  useEffect(() => {
    api.get(`/api/events/${id}/`)
      .then(({ data }) => setEvent(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleRegister() {
    if (!user) {
      navigate('/login')
      return
    }
    setRegistering(true)
    setRegisterError(null)
    try {
      const { data } = await api.post(`/api/events/${id}/register/`)
      setConfirmation(data.ticket_code)
    } catch (err) {
      const detail = err.response?.data?.detail
      setRegisterError(detail || "Une erreur est survenue.")
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!event) return null

  const imageUrl = event.cover_image
    ? `http://localhost:8000${event.cover_image}`
    : null

  return (
    <main className={styles.page}>
      <div className={styles.cover}>
        {imageUrl
          ? <img src={imageUrl} alt={event.title} />
          : <div className={styles.coverFallback} />
        }
        <div className={styles.coverOverlay} />
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.metaDate}>{formatDate(event.date)}</span>
          <span className={styles.metaLocation}>{event.location}</span>
        </div>

        <h1 className={styles.title}>{event.title}</h1>

        <div className={styles.infoRow}>
          <span className={styles.price}>
            {event.price === '0.00' || event.price === 0 ? 'Gratuit' : `${event.price} €`}
          </span>
          <span className={event.is_sold_out ? styles.spotsOut : styles.spotsLeft}>
            {event.is_sold_out ? 'Événement complet' : `${event.spots_left} places restantes`}
          </span>
        </div>

        <p className={styles.description}>{event.description}</p>

        <div className={styles.registerSection}>
          {confirmation ? (
            <div className={styles.confirmBox}>
              <p className={styles.confirmTitle}>Inscription confirmée !</p>
              <p className={styles.confirmSub}>Ton code billet :</p>
              <code className={styles.ticketCode}>{confirmation}</code>
            </div>
          ) : (
            <>
              <button
                className={styles.registerBtn}
                onClick={handleRegister}
                disabled={event.is_sold_out || registering}
              >
                {event.is_sold_out ? 'Complet' : registering ? 'Inscription…' : "S'inscrire"}
              </button>
              {registerError && <p className={styles.registerError}>{registerError}</p>}
              {!user && (
                <p className={styles.loginHint}>
                  Tu dois être <span onClick={() => navigate('/login')} className={styles.loginLink}>connecté</span> pour t'inscrire.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

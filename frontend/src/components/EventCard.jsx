import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import styles from './EventCard.module.css'

function formatDate(start, end) {
  const base = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(start))
  const startTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(start))
  if (!end) return `${base} à ${startTime}`
  const endTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(end))
  return `${base} · ${startTime} → ${endTime}`
}

export default function EventCard({ event, isInterested, onToggleInterest }) {
  const navigate = useNavigate()
  const imageUrl = event.cover_image || null
  const liked = isInterested ?? event.is_interested ?? false

  function handleHeartClick(e) {
    e.stopPropagation()
    onToggleInterest?.(event.id)
  }

  return (
    <article className={styles.card} onClick={() => navigate(`/events/${event.id}`)}>
      <div className={styles.cardImage}>
        {imageUrl
          ? <img src={imageUrl} alt={event.title} />
          : <div className={styles.cardImageFallback} />
        }
        {event.is_sold_out && <span className={styles.soldOutBadge}>COMPLET</span>}

        {onToggleInterest && (
          <button
            className={`${styles.heartBtn} ${liked ? styles.heartBtnActive : ''}`}
            onClick={handleHeartClick}
            aria-label={liked ? 'Retirer des intérêts' : 'Marquer comme intéressé'}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{event.title}</h2>
        <p className={styles.cardDate}>{formatDate(event.date, event.end_date)}</p>
        <p className={styles.cardLocation}>{event.location}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>
            {event.price === '0.00' || event.price === 0 ? 'Gratuit' : `${event.price} €`}
          </span>
          <span className={event.is_sold_out ? styles.spotsOut : styles.spotsLeft}>
            {event.is_sold_out ? 'Complet' : `${event.spots_left} places restantes`}
          </span>
        </div>
      </div>
    </article>
  )
}

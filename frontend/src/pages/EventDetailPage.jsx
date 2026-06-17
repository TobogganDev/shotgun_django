import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, House, Heart } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import styles from "./EventDetailPage.module.css";

function formatShortDate(start, end) {
	const d = new Date(start);
	const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d);
	const day = d.getDate();
	const month = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
	const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
	if (!end) return `${weekday} ${day} ${month}. à ${time}`;
	const endTime = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(end));
	return `${weekday} ${day} ${month}. de ${time} à ${endTime}`;
}

function formatPrice(price) {
	if (!price || price === "0.00" || price === 0) return "GRATUIT";
	return `MAINTENANT À ${parseFloat(price).toFixed(2).replace(".", ",")} €`;
}

export default function EventDetailPage() {
	const { id } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();

	const [event, setEvent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [registering, setRegistering] = useState(false);
	const [confirmation, setConfirmation] = useState(null);
	const [registerError, setRegisterError] = useState(null);

	useEffect(() => {
		api.get(`/api/events/${id}/`)
			.then(({ data }) => setEvent(data))
			.catch(() => navigate("/"))
			.finally(() => setLoading(false));
	}, [id, navigate]);

	async function handleRegister() {
		if (!user) {
			navigate("/login");
			return;
		}
		setRegistering(true);
		setRegisterError(null);
		try {
			const { data } = await api.post(`/api/events/${id}/register/`);
			setConfirmation(data.ticket_code);
		} catch (err) {
			const detail = err.response?.data?.detail;
			setRegisterError(detail || "Une erreur est survenue.");
		} finally {
			setRegistering(false);
		}
	}

	if (loading) {
		return (
			<div className={styles.center}>
				<div className={styles.spinner} />
			</div>
		);
	}

	if (!event) return null;

	const imageUrl = event.cover_image || null;
	const isFree = !event.price || event.price === "0.00" || event.price === 0;

	return (
		<main className={styles.page}>
			<nav className={styles.breadcrumb}>
				<button className={styles.breadcrumbLink} onClick={() => navigate("/")}>
					Accueil
				</button>
				<span className={styles.breadcrumbSep}>›</span>
				<span className={styles.breadcrumbCurrent}>{event.title}</span>
			</nav>

			<div className={styles.hero}>
				<div className={styles.info}>
					<h1 className={styles.title}>{event.title}</h1>

					<div className={styles.metaBlock}>
						<div className={styles.metaRow}>
							<Calendar className={styles.icon} size={18} />
							<span className={styles.metaText}>Le {formatShortDate(event.date, event.end_date)}</span>
						</div>
					</div>

					<hr className={styles.divider} />

					<div className={styles.metaBlock}>
						<div className={styles.metaRow}>
							<House className={styles.icon} size={18} />
							<span className={styles.metaText}>{event.location}</span>
						</div>
					</div>

					<div className={styles.actions}>
						{confirmation ? (
							<div className={styles.confirmBox}>
								<p className={styles.confirmTitle}>Inscription confirmée !</p>
								<p className={styles.confirmSub}>Ton code billet :</p>
								<code className={styles.ticketCode}>{confirmation}</code>
							</div>
						) : (
							<>
								<button className={styles.buyBtn} onClick={handleRegister} disabled={event.is_sold_out || registering}>
									{event.is_sold_out ? "COMPLET" : registering ? "INSCRIPTION…" : isFree ? "GRATUIT" : formatPrice(event.price)}
								</button>
								<button className={styles.interestedBtn}>
									<Heart className={styles.heartIcon} size={15} />
									INTÉRESSÉ·E
								</button>
							</>
						)}
					</div>

					{registerError && <p className={styles.registerError}>{registerError}</p>}

					{!event.is_sold_out && event.spots_left > 0 && !confirmation && <p className={styles.spotsText}>{event.spots_left} places restantes</p>}

					{!user && !confirmation && (
						<p className={styles.loginHint}>
							Tu dois être{" "}
							<span className={styles.loginLink} onClick={() => navigate("/login")}>
								connecté
							</span>{" "}
							pour t'inscrire.
						</p>
					)}
				</div>

				<div className={styles.imageWrapper}>{imageUrl ? <img src={imageUrl} alt={event.title} className={styles.eventImage} /> : <div className={styles.imageFallback} />}</div>
			</div>

			{event.description && (
				<section className={styles.descSection}>
					<p className={styles.description}>{event.description}</p>
				</section>
			)}
		</main>
	);
}

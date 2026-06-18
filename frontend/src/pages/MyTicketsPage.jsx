import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const STATUS_STYLES = {
	confirmed: { color: "#22c55e", label: "Confirmé" },
	pending: { color: "#f97316", label: "En attente" },
	cancelled: { color: "#ef4444", label: "Annulé" },
};

function formatDate(dateStr) {
	return new Intl.DateTimeFormat("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(dateStr));
}

export default function MyTicketsPage() {
	const navigate = useNavigate();
	const [tickets, setTickets] = useState([]);
	const [waitlist, setWaitlist] = useState([]);
	const [loading, setLoading] = useState(true);
	const [cancelling, setCancelling] = useState(null);
	const [leavingWaitlist, setLeavingWaitlist] = useState(null);

	useEffect(() => {
		Promise.all([api.get("/api/tickets/mine/"), api.get("/api/tickets/waitlist/")])
			.then(([ticketsRes, waitlistRes]) => {
				setTickets(ticketsRes.data);
				setWaitlist(waitlistRes.data);
			})
			.finally(() => setLoading(false));
	}, []);

	async function handleCancel(ticketId) {
		if (!confirm("Annuler cette inscription ? Cette action est irréversible.")) return;
		setCancelling(ticketId);
		try {
			await api.patch(`/api/tickets/${ticketId}/cancel/`);
			setTickets((ts) => ts.map((t) => (t.id === ticketId ? { ...t, status: "cancelled" } : t)));
		} catch {
			alert("Impossible d'annuler cette inscription.");
		} finally {
			setCancelling(null);
		}
	}

	async function handleLeaveWaitlist(eventId, entryId) {
		if (!confirm("Quitter la liste d'attente pour cet événement ?")) return;
		setLeavingWaitlist(entryId);
		try {
			await api.delete(`/api/events/${eventId}/leave_waitlist/`);
			setWaitlist((ws) => ws.filter((w) => w.id !== entryId));
		} catch {
			alert("Impossible de quitter la liste d'attente.");
		} finally {
			setLeavingWaitlist(null);
		}
	}

	if (loading)
		return (
			<div style={{ padding: "4rem", textAlign: "center" }}>
				<div className="spinner" /> Chargement…
			</div>
		);

	return (
		<main style={{ padding: "2rem 0" }}>
			{/* Waitlist section */}
			{waitlist.length > 0 && (
				<section style={{ marginBottom: "3rem" }}>
					<h2 style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 700, color: "#f97316" }}>Liste d'attente</h2>
					<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
						{waitlist.map((entry) => (
							<div
								key={entry.id}
								style={{
									background: "var(--bg-card)",
									border: "1px solid rgba(249, 115, 22, 0.3)",
									borderRadius: "var(--radius)",
									padding: "1.25rem 1.5rem",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: "1rem",
									flexWrap: "wrap",
								}}
							>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
										<h3 style={{ fontSize: "1rem", fontWeight: 700, cursor: "pointer" }} onClick={() => navigate(`/events/${entry.event.id}`)}>
											{entry.event.title}
										</h3>
										<span
											style={{
												color: "#f97316",
												background: "rgba(249, 115, 22, 0.12)",
												border: "1px solid rgba(249, 115, 22, 0.35)",
												borderRadius: 6,
												padding: "0.15rem 0.55rem",
												fontSize: "0.75rem",
												fontWeight: 700,
												flexShrink: 0,
											}}
										>
											#{entry.position} en attente
										</span>
									</div>
									<p style={{ color: "var(--purple)", fontSize: "0.85rem", textTransform: "capitalize" }}>{formatDate(entry.event.date)}</p>
									<p style={{ color: "var(--text)", fontSize: "0.85rem" }}>{entry.event.location}</p>
								</div>

								<button
									onClick={() => handleLeaveWaitlist(entry.event.id, entry.id)}
									disabled={leavingWaitlist === entry.id}
									style={{
										background: "transparent",
										border: "1px solid rgba(249, 115, 22, 0.4)",
										color: "#f97316",
										borderRadius: 6,
										padding: "0.35rem 0.875rem",
										fontSize: "0.8rem",
										fontFamily: "inherit",
										fontWeight: 600,
										cursor: leavingWaitlist === entry.id ? "not-allowed" : "pointer",
										opacity: leavingWaitlist === entry.id ? 0.5 : 1,
										flexShrink: 0,
									}}
								>
									{leavingWaitlist === entry.id ? "Chargement…" : "Quitter la liste"}
								</button>
							</div>
						))}
					</div>
				</section>
			)}

			{/* Tickets section */}
			<h1 style={{ marginBottom: "2rem" }}>Mes billets</h1>

			{tickets.length === 0 ? (
				<p style={{ color: "var(--text)" }}>Tu n'as pas encore de billets.</p>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					{tickets.map((ticket) => {
						const s = STATUS_STYLES[ticket.status] ?? { color: "#fff", label: ticket.status };
						const isConfirmed = ticket.status === "confirmed";

						return (
							<div
								key={ticket.id}
								style={{
									background: "var(--bg-card)",
									border: "1px solid var(--border)",
									borderRadius: "var(--radius)",
									overflow: "hidden",
								}}
							>
								{/* Header */}
								<div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
										<h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{ticket.event.title}</h2>
										<span
											style={{
												color: s.color,
												background: `${s.color}18`,
												border: `1px solid ${s.color}44`,
												borderRadius: 6,
												padding: "0.2rem 0.6rem",
												fontSize: "0.78rem",
												fontWeight: 600,
												flexShrink: 0,
											}}
										>
											{s.label}
										</span>
									</div>
									<p style={{ color: "var(--purple)", fontSize: "0.85rem", textTransform: "capitalize" }}>{formatDate(ticket.event.date)}</p>
									<p style={{ color: "var(--text)", fontSize: "0.85rem" }}>{ticket.event.location}</p>
								</div>

								{/* QR + code + cancel */}
								<div
									style={{
										borderTop: "1px solid var(--border)",
										background: "var(--bg-input)",
										padding: "1rem 1.5rem",
										display: "flex",
										alignItems: "center",
										gap: "1.25rem",
										flexWrap: "wrap",
									}}
								>
									<img
										src={`${API_BASE}/api/tickets/${ticket.ticket_code}/qr/`}
										alt="QR code billet"
										style={{
											width: 88,
											height: 88,
											borderRadius: 8,
											background: "#fff",
											padding: 4,
											flexShrink: 0,
											opacity: ticket.status === "cancelled" ? 0.35 : 1,
										}}
									/>
									<div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
										<code
											style={{
												fontSize: "0.78rem",
												color: "var(--text)",
												background: "var(--bg-card)",
												border: "1px solid var(--border)",
												borderRadius: 6,
												padding: "0.4rem 0.75rem",
												letterSpacing: "0.5px",
												wordBreak: "break-all",
												display: "block",
											}}
										>
											{ticket.ticket_code}
										</code>

										{isConfirmed && (
											<button
												onClick={() => handleCancel(ticket.id)}
												disabled={cancelling === ticket.id}
												style={{
													alignSelf: "flex-start",
													background: "transparent",
													border: "1px solid #ef444455",
													color: "#ef4444",
													borderRadius: 6,
													padding: "0.3rem 0.875rem",
													fontSize: "0.8rem",
													fontFamily: "inherit",
													fontWeight: 600,
													cursor: cancelling === ticket.id ? "not-allowed" : "pointer",
													opacity: cancelling === ticket.id ? 0.6 : 1,
												}}
											>
												{cancelling === ticket.id ? "Annulation…" : "Se désinscrire"}
											</button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</main>
	);
}

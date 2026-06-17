import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function UserMenu({ user, onLogout }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		function handleClickOutside(e) {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="user-menu" ref={ref}>
			<button className="user-trigger" onClick={() => setOpen((o) => !o)}>
				<span className="user-avatar">{user.username[0].toUpperCase()}</span>
				<span className="user-name">{user.username}</span>
				<svg className={`user-chevron ${open ? "open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{open && (
				<div className="user-dropdown">
					<Link to="/my-tickets" onClick={() => setOpen(false)}>Mes billets</Link>
					<Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
					<div className="user-dropdown-divider" />
					<button onClick={onLogout}>Se déconnecter</button>
				</div>
			)}
		</div>
	);
}

export default function Navbar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	function handleLogout() {
		logout();
		navigate("/");
	}

	return (
		<nav className="navbar">
			<div className="navbar-left">
				<Link to="/" className="navbar-logo">
					<svg viewBox="0 0 666 123" height="24" fill="currentColor">
						<path d="m57.2 51.8 24.4-35.2a9.6 9.6 0 0 0 0-11A12.8 12.8 0 0 0 71 .1H12.4A12.7 12.7 0 0 0 2 5.5a9.7 9.7 0 0 0 0 11l62.4 90.7H19.1l15.9-23L26 71 2 105.7a9.7 9.7 0 0 0 0 11 12.7 12.7 0 0 0 10.4 5.5H71a12.7 12.7 0 0 0 10.4-5.5 9.7 9.7 0 0 0 0-11L19.1 15.2h45.4L48.2 38.6l9 13.2Zm96-22.8c11 0 19.5 1.6 25.5 4.9 6 3.3 9.7 8.7 11.2 16.4H174a9.7 9.7 0 0 0-6.7-7.6A47.5 47.5 0 0 0 153 41c-6 0-10 .7-12.3 1.9-2.3 1.2-3.4 3-3.4 5 0 1.2.2 2 .6 2.8.5.8 1.4 1.4 2.8 1.9s3.4 1 6.1 1.3c2.7.3 6.3.6 10.7.8A125.8 125.8 0 0 1 176 57c4.7 1.2 8.3 3 10.5 5.6 2.2 2.5 3.3 5.8 3.3 10 0 6.5-2.6 11.6-7.8 15.2-5.2 3.7-13.4 5.5-24.4 5.5-4.2 0-8-.2-11.3-.6a49 49 0 0 1-9.1-1.9 25 25 0 0 1-12.2-7.6 30.1 30.1 0 0 1-6-13.3h16.2c1 4.2 3.5 7 7.4 8.6 3.9 1.5 9 2.3 15.3 2.3 5.8 0 10-.6 12.8-1.7 2.7-1.1 4.1-3 4.1-5.5 0-1-.2-1.8-.5-2.5a4 4 0 0 0-1.5-1.7c-1.5-.9-4-1.5-7.4-1.8-3.5-.4-8.5-.7-15-1a93.3 93.3 0 0 1-16-2.5 18 18 0 0 1-9.3-5.6c-2-2.5-3-6-3-10.2a16 16 0 0 1 7.8-14 41 41 0 0 1 23.2-5.3Zm162.2 0c3.7 0 7.2.3 10.4 1a44.2 44.2 0 0 1 9.2 2.7 29.5 29.5 0 0 1 18.5 28.4v.6a37 37 0 0 1-1.3 9.7c-.8 3-2 5.6-3.6 8a29 29 0 0 1-13.4 10.3 52.1 52.1 0 0 1-19.7 3.5 66 66 0 0 1-10.6-.8c-3.3-.5-6.4-1.4-9.3-2.5-5.6-2.2-10-5.7-13.2-10.3a31.4 31.4 0 0 1-4.7-18v-.4A29.1 29.1 0 0 1 296 32.7a47.3 47.3 0 0 1 19.4-3.7ZM532 30.5v26.9a41.8 41.8 0 0 0 2.2 13.1c1.4 3.2 3.5 5.5 6.3 6.8a28.7 28.7 0 0 0 16 1.6 17 17 0 0 0 4.5-1.5c2.7-1.3 4.7-3.6 6-6.8a34 34 0 0 0 2-13.2V30.5h15.7v27.3c0 4.3-.4 8.1-1 11.6a34 34 0 0 1-3.1 9c-2.7 5.2-6.6 9-11.7 11.3a54.5 54.5 0 0 1-28.5 2.6c-3.2-.6-6-1.5-8.6-2.6-5-2.3-8.9-6-11.5-11.3-2.6-5.2-3.9-12-3.9-20.6V30.5H532ZM467.4 29c10.3 0 18.6 1.8 25 5.5a23.7 23.7 0 0 1 11.9 17.4h-16.5c-.7-3.3-3.2-5.8-6.3-7.5A29.2 29.2 0 0 0 468 42a27 27 0 0 0-17.1 4.7c-4 3-6 8.1-6 15v.1c.3 8.1 2.8 11 5.6 13.7 6.3 5.9 34.1 8.8 37.3-5H467V58.6h37.4V69c0 8-7.8 24-33.8 24-3.4 0-13.3.8-23.6-4a30 30 0 0 1-17.6-27.3v-.4c0-3.4.5-6.6 1.3-9.5a28 28 0 0 1 3.6-8c3.3-4.8 7.9-8.5 13.6-11a47.6 47.6 0 0 1 19.6-4Zm145.2 1.5L651 72l.6.8V30.5h14.3v61h-14.3l-39-41.8-.5-.9v42.7h-14.4v-61h14.9Zm-190.3 0v12.3h-23.8v48.7h-15.3V42.8h-22.7V30.5h61.8Zm-207.3 0v23.7h36.8V30.5h14.8v61h-14.8V67.9H215v23.6h-15v-61h15ZM315.5 42c-7 0-12.5 1.5-16.5 4.6-4 3-6 8-6 15 0 6.5 2 11.2 6 14.2s9.5 4.5 16.4 4.5a45 45 0 0 0 6.6-.4c2-.3 3.9-.8 5.5-1.4 3.4-1.1 6-3 7.8-5.8 1.9-2.7 2.8-6.4 2.8-11a26 26 0 0 0-.7-6.5 15.6 15.6 0 0 0-9.9-11.3c-3.3-1.3-7.3-2-12-2Z"></path>
					</svg>
				</Link>

				<div className="navbar-search">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
					<input type="search" placeholder="Rechercher un événement…" />
				</div>

				<div className="navbar-links">
					<Link to="/">Événements</Link>
					{user?.role === 'organizer' && (
						<Link to="/dashboard">Dashboard</Link>
					)}
				</div>
			</div>

			<div className="navbar-auth">
				{user ? (
					<>
						{user.role === 'organizer' && (
							<Link to="/dashboard#create" className="btn-primary">+ Créer</Link>
						)}
						<UserMenu user={user} onLogout={handleLogout} />
					</>
				) : (
					<>
						<Link to="/login" className="btn-login">Login</Link>
						<Link to="/register" className="btn-primary">Register</Link>
					</>
				)}
			</div>
		</nav>
	);
}

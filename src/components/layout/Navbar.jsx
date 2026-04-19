import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";

function getNavLinkClass({ isActive }) {
  return `navbar__link${isActive ? " navbar__link--active" : ""}`;
}

function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="navbar__brand" to={user ? "/dashboard" : "/login"}>
          <span className="navbar__brand-mark">
            <img alt="Dream Squad FC" src={logo} />
          </span>
          <span className="navbar__brand-copy">
            <span className="navbar__brand-title">Dream Squad FC</span>
            <span className="navbar__brand-subtitle">Packs. Clubs. Simulated Matchday.</span>
          </span>
        </Link>

        <button
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          className={`navbar__toggle${menuOpen ? " is-open" : ""}`}
          onClick={() => setMenuOpen((currentValue) => !currentValue)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar__nav${menuOpen ? " is-open" : ""}`}>
          <nav className="navbar__links">
            {user ? (
              <>
                <NavLink className={getNavLinkClass} to="/dashboard">
                  Dashboard
                </NavLink>
                <NavLink className={getNavLinkClass} to="/packs">
                  Packs
                </NavLink>
                <NavLink className={getNavLinkClass} to="/collection">
                  Collection
                </NavLink>
                <NavLink className={getNavLinkClass} to="/squad">
                  Squad
                </NavLink>
                <NavLink className={getNavLinkClass} to="/matches">
                  Play
                </NavLink>
              </>
            ) : (
              <>
                <NavLink className={getNavLinkClass} to="/login">
                  Login
                </NavLink>
                <NavLink className={getNavLinkClass} to="/register">
                  Register
                </NavLink>
              </>
            )}
          </nav>

          <div className="navbar__actions">
            {user ? (
              <>
                <div className="navbar__profile">
                  <span className="navbar__profile-label">Club</span>
                  <strong>{user.teamName || `${user.username} FC`}</strong>
                  <span className="navbar__profile-manager">@{user.username || "coach"}</span>
                  <span className="navbar__profile-coins">{Number(user.coins || 0).toLocaleString()} coins</span>
                </div>
                <button className="btn btn--ghost" onClick={logout} type="button">
                  Logout
                </button>
              </>
            ) : (
              <Link className="btn btn--primary" to="/register">
                Join The Club
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

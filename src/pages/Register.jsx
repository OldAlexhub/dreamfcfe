import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import authArt from "../assets/2.png";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();
  const [formValues, setFormValues] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(formValues);
      navigate("/dashboard", { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div
        className="auth-screen__media"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0, 18, 20, 0.2), rgba(0, 14, 16, 0.84)), url(${authArt})`
        }}
      >
        <div className="auth-screen__media-content">
          <span className="auth-screen__eyebrow">New Club</span>
          <h1>Launch a squad kids can grow with.</h1>
          <p>Every new account starts with coins, fresh packs, and room to chase dream players.</p>

          <div className="auth-screen__feature-list">
            <div>
              <strong>Starter Coins</strong>
              <span>Jump straight into your first pack openings</span>
            </div>
            <div>
              <strong>Own Collection</strong>
              <span>Each account keeps its own football journey</span>
            </div>
            <div>
              <strong>Safe Economy</strong>
              <span>No real-money purchases, only in-game coins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-screen__panel">
        <div className="auth-card">
          <div className="auth-card__brand">
            <img alt="Dream Squad FC" src={logo} />
          </div>

          <div className="auth-card__header">
            <span className="auth-card__eyebrow">Create Account</span>
            <h2>Register</h2>
            <p>Pick a manager name and start building your dream squad.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                autoComplete="username"
                onChange={(event) =>
                  setFormValues((currentValue) => ({
                    ...currentValue,
                    username: event.target.value
                  }))
                }
                placeholder="younglegend"
                required
                type="text"
                value={formValues.username}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete="new-password"
                onChange={(event) =>
                  setFormValues((currentValue) => ({
                    ...currentValue,
                    password: event.target.value
                  }))
                }
                placeholder="password123"
                required
                type="password"
                value={formValues.password}
              />
            </label>

            {error ? <div className="form-message form-message--error">{error}</div> : null}

            <button className="btn btn--primary btn--full" disabled={submitting || loading} type="submit">
              {submitting ? "Creating Account..." : "Start My Club"}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have a club? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

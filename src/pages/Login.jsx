import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import authArt from "../assets/1.png";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
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
      await login(formValues);
      navigate(location.state?.from || "/dashboard", { replace: true });
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
          backgroundImage: `linear-gradient(180deg, rgba(2, 17, 18, 0.18), rgba(2, 17, 18, 0.82)), url(${authArt})`
        }}
      >
        <div className="auth-screen__media-content">
          <span className="auth-screen__eyebrow">Dream Squad FC</span>
          <h1>Build your brightest football club.</h1>
          <p>Open glowing packs, collect your heroes, and shape the squad that owns the pitch.</p>

          <div className="auth-screen__feature-list">
            <div>
              <strong>Collect</strong>
              <span>Football cards with rich player stats</span>
            </div>
            <div>
              <strong>Build</strong>
              <span>Auto-build or craft a clever starting XI</span>
            </div>
            <div>
              <strong>Come Back</strong>
              <span>Claim refill coins when your club needs a boost</span>
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
            <span className="auth-card__eyebrow">Welcome Back</span>
            <h2>Login</h2>
            <p>Step back into your club and chase the next big pull.</p>
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
                placeholder="child1"
                required
                type="text"
                value={formValues.username}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete="current-password"
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
              {submitting ? "Logging In..." : "Enter The Club"}
            </button>
          </form>

          <p className="auth-card__footer">
            New manager? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

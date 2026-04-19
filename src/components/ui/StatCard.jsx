import React from "react";

function StatCard({ label, value, hint, icon, accent = "cyan", className = "" }) {
  return (
    <article className={`stat-card stat-card--${accent} ${className}`.trim()}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon ? <span className="stat-card__icon">{icon}</span> : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </article>
  );
}

export default StatCard;

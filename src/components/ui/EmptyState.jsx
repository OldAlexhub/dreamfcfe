import React from "react";

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <section className="empty-state">
      <div className="empty-state__badge">Dream Squad FC</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <button className="btn btn--primary" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export default EmptyState;

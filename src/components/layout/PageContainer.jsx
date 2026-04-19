import React from "react";

function PageContainer({
  eyebrow,
  title,
  description,
  actions,
  backgroundImage,
  children,
  className = ""
}) {
  const heroStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(2, 18, 18, 0.9), rgba(4, 10, 14, 0.58)), url(${backgroundImage})`
      }
    : undefined;

  return (
    <section className={`page-shell ${className}`.trim()}>
      <header className="page-hero" style={heroStyle}>
        <div className="page-hero__inner">
          <div className="page-hero__copy">
            {eyebrow ? <span className="page-hero__eyebrow">{eyebrow}</span> : null}
            <h1 className="page-hero__title">{title}</h1>
            {description ? <p className="page-hero__description">{description}</p> : null}
          </div>

          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </div>
      </header>

      <div className="page-content">{children}</div>
    </section>
  );
}

export default PageContainer;

import React from "react";

function LoadingSpinner({ fullScreen = false, text = "Loading...", size = "medium" }) {
  return (
    <div className={`spinner-wrap${fullScreen ? " spinner-wrap--fullscreen" : ""}`}>
      <div className={`spinner spinner--${size}`}>
        <span className="spinner__ring spinner__ring--one" />
        <span className="spinner__ring spinner__ring--two" />
        <span className="spinner__core" />
      </div>
      {text ? <p className="spinner__text">{text}</p> : null}
    </div>
  );
}

export default LoadingSpinner;

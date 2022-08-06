import React from "react";
import "../css/spinner.css";

export default function LoadingSpinner() {
  return (
    <div className="spinner__container">
      <div className="loading__spinner"></div>
    </div>
  );
}

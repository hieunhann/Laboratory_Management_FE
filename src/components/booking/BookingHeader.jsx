import React from "react";
import "./BookingHeader.css";

function BookingHeader({ title, subtitle, currentStep, steps }) {
  return (
    <div className="booking-header">
      <div className="booking-title-section">
        <h1 className="booking-title">{title}</h1>
        <p className="booking-subtitle">{subtitle}</p>
      </div>

      <div className="booking-steps">
        {steps.map((step, index) => {
          const completed = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div
                className={`step ${completed ? "completed" : ""} ${
                  active ? "active" : ""
                }`}
              >
                <div className="step-circle" aria-hidden>
                  {completed ? (
                    // check icon for completed
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    // number for active or future
                    <span className="step-number">{step.id}</span>
                  )}
                </div>
                <span className="step-label">{step.name}</span>
              </div>

              {index < steps.length - 1 && (
                <div className="step-connector" aria-hidden />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default BookingHeader;

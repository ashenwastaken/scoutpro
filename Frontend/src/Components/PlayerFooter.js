import React from "react";
import logoBlack from "../assets/images/logo_black.svg";
import copyRight from "../assets/icons/copyright.png"; 

export default function PlayerFooter() {
  return (
    <footer className="footer">
      <div className="max-width mx-auto">
        <div className="innerContainer">
          <div className="row g-4 justify-content-between align-items-center">
            <div className="col-auto d-flex align-items-center footer-copyright">
              <img
                src={copyRight}
                alt="Copyright Symbol"
                className="copyright-icon"
              />
              <span className="copyright-text">All Rights Reserved</span>
            </div>
            <div className="col-auto">
              <img alt="Footer Logo" src={logoBlack} className="footer-logo" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoBlack from "../assets/images/logo_black.svg";
import logoWhite from "../assets/images/logo_white.svg";

const DOMAIN = process.env.REACT_APP_FRONT;

export default function PlayerNav({ player, requestPdf }) {
  const [shareButtonText, setShareButtonText] = useState("Share Link");

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      const logoWhite = document.getElementById("logoWhite");
      const logoDark = document.getElementById("logoDark");
      const playerName = document.querySelector(".playerName");
      const downloadPdfBtn = document.querySelector(".downloadPdfBtn");
      const shareLinkBtn = document.querySelector(".shareLink");

      if (window.scrollY > 50) {
        navbar.classList.add("bg-light");
        logoWhite.classList.add("d-none");
        logoDark.classList.remove("d-none");
        playerName.classList.add("text-dark");
        downloadPdfBtn.classList.add("bg-dark", "text-light");
        shareLinkBtn.classList.add("border-dark", "text-dark");
      } else {
        navbar.classList.remove("bg-light");
        logoWhite.classList.remove("d-none");
        logoDark.classList.add("d-none");
        playerName.classList.remove("text-dark");
        downloadPdfBtn.classList.remove("bg-dark", "text-light");
        shareLinkBtn.classList.remove("border-dark", "text-dark");
      }
    };

    const navbar = document.querySelector(".navbar");
    navbar.classList.add("navbar-transition");

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleShareLinkClick = (id) => {
    const linkToCopy = `${DOMAIN}/player/${id}`;
    navigator.clipboard
      .writeText(linkToCopy)
      .then(() => {
        setShareButtonText("Copied");
        setTimeout(() => {
          setShareButtonText("Share Link");
        }, 1000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <nav className="navbar fixed-top navbar-expand-lg">
      <div className="container-fluid max-width">
        <Link className="navbar-brand m-0" to="/dashboard">
          <img
            id="logoWhite"
            src={logoWhite}
            alt="Scout Pro Logo"
            width="160"
          />
          <img
            id="logoDark"
            src={logoBlack}
            className="d-none"
            alt="Scout Pro Logo"
            width="160"
          />
        </Link>
        <button
          className="navbar-toggler bg-light"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="playerName">{player.playerName}</li>
          </ul>
          <div className="playerNavButtons" role="search">
            <button
              onClick={() => requestPdf(player._id)}
              className="downloadPdfBtn"
            >
              Download PDF
            </button>
            <button
              className="shareLink"
              onClick={() => handleShareLinkClick(player._id)}
            >
              {shareButtonText}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

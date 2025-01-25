import React from "react";
import logoBlack from "../assets/images/logo_black.svg";
import { Link } from "react-router-dom";
export default function HomePage() {
  return (
    <>
      <section className="container-fluid p-0 p-md-3 backgroundImage">
        <div className="row">
          <div className="col d-flex justify-content-center">
            <Link className="logoImage" to="#">
              <img alt="Scout Pro Logo" src={logoBlack} />
            </Link>
          </div>
        </div>
        <div className="backgroundContainer px-4 px-md-0">
          <h1 className="mainHeading">Welcome to Scout Pro</h1>
          <p className="subHeading">
            Empowering Coaches & Athletes with Individualized Profiles
          </p>
          <p className="subHeadingLight">
            Scout Pro provides advanced tools and analytics to help coaches and
            athletes elevate their game.
          </p>
          <p>Start now to explore the features!</p>
          <button type="button" className="getStarted">
            <a href="/login">
              Get Started
              <svg
                className="ms-3"
                width="19"
                height="20"
                viewBox="0 0 19 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 1.5C19 0.947716 18.5523 0.500001 18 0.5L9 0.500001C8.44771 0.500001 8 0.947716 8 1.5C8 2.05229 8.44771 2.5 9 2.5L17 2.5L17 10.5C17 11.0523 17.4477 11.5 18 11.5C18.5523 11.5 19 11.0523 19 10.5L19 1.5ZM1.70711 19.2071L18.7071 2.20711L17.2929 0.792894L0.292893 17.7929L1.70711 19.2071Z"
                  fill="white"
                />
              </svg>
            </a>
          </button>
        </div>
      </section>
    </>
  );
}

// src/components/Footer/Footer.jsx
import React, { useState } from "react";
import "./Footer.css";

export default function Footer({ onSubscribe }) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (onSubscribe) {
      await onSubscribe(email);
      setEmail("");
      return;
    }

 
    try {
      const res = await fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ email }).toString(),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setEmail("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <footer className="footer-section footer-bg">
      <div className="container">
        <div className="footer-text">
          <div className="row">
            <div className="col-lg-4">
              <div className="ft-about">
                <div className="logo">
                  <a href="/">
                    <img
                      src="/img/36x.png"
                      alt="36 Hotel Logo"
                      className="footer-logo-img"
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  </a>
                </div>

                <p className="footer-black">
                  We inspire and reach millions of travelers
                  <br /> across 90 local websites
                </p>

                <div className="fa-social">
                  <a href="#" aria-label="Facebook"><i className="fa fa-facebook" /></a>
                  <a href="#" aria-label="Twitter"><i className="fa fa-twitter" /></a>
                  <a href="#" aria-label="Tripadvisor"><i className="fa fa-tripadvisor" /></a>
                  <a href="#" aria-label="Instagram"><i className="fa fa-instagram" /></a>
                  <a href="#" aria-label="YouTube"><i className="fa fa-youtube-play" /></a>
                </div>
              </div>
            </div>

            <div className="col-lg-3 offset-lg-1">
              <div className="ft-contact">
                <h6>Contact Us</h6>
                <ul>
                  <li className="footer-black">(84) 359 797 703</li>
                  <li className="footer-black">36hotel@gmail.com</li>
                  <li className="footer-black">Thanh Hoa, Viet Nam</li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3 offset-lg-1">
              <div className="ft-newslatter">
                <h6>New latest</h6>
                <p className="footer-black">Get the latest updates and offers.</p>

                <form onSubmit={handleSubmit} className="fn-form">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" aria-label="Send">
                    <i className="fa fa-send" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="copyright-option copyright-bg">
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <ul>
                <li><a href="#" className="footer-black">Contact</a></li>
                <li><a href="#" className="footer-black">Terms of use</a></li>
                <li><a href="#" className="footer-black">Privacy</a></li>
                <li><a href="#" className="footer-black">Environmental Policy</a></li>
              </ul>
            </div>

            <div className="col-lg-5">
              <div className="co-text">
                <p className="footer-black">
                  Copyright &copy; {new Date().getFullYear()} All rights reserved by 36 Hotel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

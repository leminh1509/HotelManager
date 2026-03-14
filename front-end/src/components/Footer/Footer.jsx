// src/components/Footer/Footer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
    <footer className="footer-section">
      <div className="container">
        <div className="footer-text">
          <div className="row">
            <div className="col-lg-4">
              <div className="ft-about">
                <div className="footer-logo">
                  <Link to="/">
                    <img
                      src="/hms/img/36x.png"
                      alt="36 Hotel Logo"
                      className="logo-img"
                    />
                  </Link>
                </div>

                <p>
                  Truyền cảm hứng và tiếp cận hàng triệu du khách
                  <br /> trên khắp thế giới với dịch vụ đẳng cấp.
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
                <h6>Kết nối với chúng tôi</h6>
                <ul>
                  <li><i className="fa fa-phone" /> (84) 359 797 703</li>
                  <li><i className="fa fa-envelope" /> 37hotel@gmail.com</li>
                  <li><i className="fa fa-map-marker" /> Thanh Hoa, Viet Nam</li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3 offset-lg-1">
              <div className="ft-newslatter">
                <h6>Bản tin mới nhất</h6>
                <p>Nhận ngay thông tin cập nhật và ưu đãi đặc biệt.</p>

                <form onSubmit={handleSubmit} className="fn-form">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email của bạn"
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

      <div className="copyright-option">
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <ul>
                <li><Link to="/contact">Liên hệ</Link></li>
                <li><Link to="/terms">Điều khoản</Link></li>
                <li><Link to="/privacy">Bảo mật</Link></li>
                <li><Link to="/policy">Chính sách</Link></li>
              </ul>
            </div>

            <div className="col-lg-5">
              <div className="co-text">
                <p>
                  Bản quyền &copy; {new Date().getFullYear()} Bảo lưu mọi quyền | 36 Hotel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

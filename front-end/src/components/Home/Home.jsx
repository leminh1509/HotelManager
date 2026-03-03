// src/components/Home/Home.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Home.css";

const HERO_SLIDES = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    alt: "Ocean view from hotel balcony",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    alt: "Tropical beach resort",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80",
    alt: "Luxury hotel pool area",
  },
];

const CATEGORIES = [
  { value: "", label: "ALL CATEGORY" },
  { value: "standard", label: "Standard" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
  { value: "family", label: "Family" },
];

const SERVICES = [
  {
    icon: "fa-wifi",
    title: "Free Wi-Fi",
    desc: "High-speed internet access throughout the hotel.",
  },
  {
    icon: "fa-fork",
    title: "Restaurant & Bar",
    desc: "Fine dining experience with international cuisine.",
  },
  {
    icon: "fa-dumbbell",
    title: "Fitness Center",
    desc: "State-of-the-art gym equipment available 24/7.",
  },
  {
    icon: "fa-spa",
    title: "Spa & Wellness",
    desc: "Relaxing treatments and therapeutic massages.",
  },
  {
    icon: "fa-car",
    title: "Parking",
    desc: "Complimentary valet and self-parking services.",
  },
  {
    icon: "fa-concierge-bell",
    title: "Concierge",
    desc: "24/7 dedicated concierge service for all your needs.",
  },
];

const FEATURED_ROOMS = [
  {
    roomId: 1,
    name: "Standard Room",
    desc: "Comfortable and cozy rooms perfect for a relaxing stay.",
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=700&q=80",
    size: "24 m²",
    guests: "2 Guests",
    price: 129,
  },
  {
    roomId: 2,
    name: "Premium Ocean View",
    desc: "Breathtaking ocean views with exclusive balcony access.",
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80",
    size: "46 m²",
    guests: "3 Guests",
    price: 299,
  },
];

/* ══════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Home({ user, role, onLogout }) {
  /* ── hero slider state ── */
  const [slideIdx, setSlideIdx] = useState(0);
  const totalSlides = HERO_SLIDES.length;

  const goTo = useCallback(
    (idx) => setSlideIdx((idx + totalSlides) % totalSlides),
    [totalSlides]
  );

  // auto-advance every 5 s
  useEffect(() => {
    const timer = setInterval(() => goTo(slideIdx + 1), 5000);
    return () => clearInterval(timer);
  }, [slideIdx, goTo]);

  /* ── search form state ── */


  const navigate = useNavigate();


  /* ── render ── */
  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />

      {/* ═══ HERO SLIDER ═══ */}
      <section className="hero-section">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-slide ${i === slideIdx ? "active" : ""}`}
          >
            <img src={slide.img} alt={slide.alt} />
          </div>
        ))}

        {/* arrows */}
        <button
          className="hero-arrow prev"
          onClick={() => goTo(slideIdx - 1)}
          aria-label="Previous slide"
        >
          <i className="fa fa-chevron-left" />
        </button>
        <button
          className="hero-arrow next"
          onClick={() => goTo(slideIdx + 1)}
          aria-label="Next slide"
        >
          <i className="fa fa-chevron-right" />
        </button>

        <div className="hero-cta">
          <h1>Find Your Perfect Stay</h1>
          <p>Luxury rooms – Best price – Instant booking</p>

          <button
            className="hero-book-btn"
            onClick={() => navigate("/rooms")}
          >
            Đặt phòng ngay
          </button>
        </div>
      </section>

      {/* spacer so search bar doesn't overlap next section */}
      <div className="hero-spacer" />

      {/* ═══ OUR SERVICES ═══ */}
      <section className="services-section">
        <div className="container">
          <div className="section-title">
            <h2>Our Services</h2>
          </div>
          <p className="section-sub">
            Experience luxury and comfort with our comprehensive range of hotel
            services designed to make your stay unforgettable.
          </p>

          <div className="services-grid">
            {SERVICES.map((svc) => (
              <div className="service-card" key={svc.title}>
                <div className="service-icon-wrap">
                  <i className={`fa ${svc.icon}`} />
                </div>
                <h4>{svc.title}</h4>
                <p>{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED ROOMS ═══ */}
      <section className="rooms-section">
        <div className="container">
          <div className="section-title">
            <h2>Featured Rooms</h2>
          </div>

          <div className="rooms-grid">
            {FEATURED_ROOMS.map((room) => (
              <div className="room-card" key={room.roomId}>
                <img
                  src={room.img}
                  alt={room.name}
                  className="room-card-img"
                />

                <div className="room-card-body">
                  <h3>{room.name}</h3>
                  <p className="room-desc">{room.desc}</p>

                  <div className="room-meta">
                    <span>
                      <i className="fa fa-expand" /> {room.size}
                    </span>
                    <span>
                      <i className="fa fa-users" /> {room.guests}
                    </span>
                  </div>

                  <div className="room-card-footer">
                    <div className="room-price">
                      <span className="price-amount">${room.price}</span>
                      <span className="price-unit"> / night</span>
                    </div>

                    <button
                      type="button"
                      className="btn-book-now"
                      onClick={() => navigate(`/rooms/${room.roomId}`)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

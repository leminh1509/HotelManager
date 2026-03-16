import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllRooms, searchRooms } from "../../services/roomAPI";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./RoomList.css";

function formatPrice(n) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function RoomList({ user, role, onLogout }) {

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {

    setLoading(true);

    try {

      let res;

      if (checkin && checkout) {
        res = await searchRooms({ checkin, checkout });
      } else {
        res = await getAllRooms();
      }

      const rooms = res.data;

      const map = {};

      rooms.forEach(room => {

        const cat = room.categoryName;

        if (!map[cat]) {
          map[cat] = {
            categoryName: cat,
            price: room.price,
            available: false,
            sampleRoom: room
          };
        }

        if (room.statusName === "Available") {
          map[cat].available = true;
        }

      });

      setCategories(Object.values(map));

    } catch (err) {

      console.error("Fetch rooms error:", err);

    }

    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  return (
    <>
      <Header user={user} role={role} onLogout={onLogout} />

      <div className="rl-page">
        <div className="rl-container">

          {/* Breadcrumb */}
          <div className="rl-breadcrumbs">
            <Link to="/home">Trang chủ</Link>
            <i className="fa fa-angle-right"></i>
            <span>Danh sách phòng</span>
          </div>

          <div className="rl-layout">

            {/* SIDEBAR SEARCH */}
            <aside className="rl-sidebar">

              <div className="rl-search-card">

                <h3>Tìm phòng</h3>

                <form onSubmit={handleSearch}>

                  <div className="rl-input-group">
                    <label>Ngày nhận phòng</label>
                    <input
                      type="date"
                      value={checkin}
                      onChange={e => setCheckin(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rl-input-group">
                    <label>Ngày trả phòng</label>
                    <input
                      type="date"
                      value={checkout}
                      onChange={e => setCheckout(e.target.value)}
                      required
                    />
                  </div>

                  <button className="rl-search-submit">
                    Tìm phòng
                  </button>

                </form>

              </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="rl-main">

              <h2>Khách sạn có {categories.length} hạng phòng</h2>

              {loading ? (

                <div className="rl-loading">
                  <div className="rl-spinner"/>
                  <p>Đang kiểm tra phòng trống...</p>
                </div>

              ) : (

                <div className="rl-list">

                  {categories.map((cat, idx) => {

                    const r = cat.sampleRoom;

                    return (

                      <div key={idx} className="rl-card">

                        <div className="rl-card-img">

                          <img
                            src={`/hms/img/room/room-${(idx % 6) + 1}.jpg`}
                            alt={cat.categoryName}
                          />

                        </div>

                        <div className="rl-card-info">

                          <div className="rl-card-header">
                            <h3>{cat.categoryName}</h3>
                          </div>

                          <div className="rl-card-features">

                            <p className="rl-room-desc">
                              <span>{r.sizem2} m²</span>
                              {" • "}
                              <span>{r.capacity} người</span>
                            </p>

                            <p className="rl-room-status-text">
                              {cat.available ? (
                                <span style={{color:"green"}}>
                                  Còn phòng
                                </span>
                              ) : (
                                <span style={{color:"red"}}>
                                  Hết phòng
                                </span>
                              )}
                            </p>

                          </div>

                          <div className="rl-card-pricing">

                            <div className="rl-price-container">

                              <div className="rl-price-label">
                                Giá từ
                              </div>

                              <div className="rl-price-value">
                                {formatPrice(r.price)} đ
                              </div>

                              <Link
                                to={`/rooms/${r.roomId}`}
                                className="rl-btn-primary"
                              >
                                Xem chi tiết
                              </Link>

                            </div>

                          </div>

                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

            </main>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
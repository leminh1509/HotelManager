import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function RoomDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) fetchRoomDetail();
    }, [id]);

    const fetchRoomDetail = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:9999/api/rooms/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRoom(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load room details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!room) return <div>Room not found</div>;

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Room Details: {room.roomNumber}</h2>

            <div className="row">
                <div className="col-md-4">
                    {room.imgUrl ? (
                        <img src={room.imgUrl} alt={room.roomNumber} className="img-fluid rounded shadow-sm mb-3" />
                    ) : (
                        <div className="p-5 bg-light text-center border rounded mb-3">No Image</div>
                    )}
                </div>
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Room Category</div>
                                <div className="col-sm-9">{room.categoryName}</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Status</div>
                                <div className="col-sm-9"><span className="badge bg-secondary">{room.statusName}</span></div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Price</div>
                                <div className="col-sm-9">${room.price} / night</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Capacity</div>
                                <div className="col-sm-9">{room.capacity} Person(s)</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Floor</div>
                                <div className="col-sm-9">{room.floor}</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Size</div>
                                <div className="col-sm-9">{room.sizem2} m²</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Bed Config</div>
                                <div className="col-sm-9">{room.bedConfiguration || "N/A"}</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Cancellation</div>
                                <div className="col-sm-9">{room.cancellationPolicy || "N/A"}</div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Description</div>
                                <div className="col-sm-9">{room.description || "N/A"}</div>
                            </div>
                        </div>
                        <div className="card-footer bg-white text-end">
                            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
                            {/* Placeholder for Edit button */}
                            {/* <button className="btn btn-primary ms-2">Edit</button> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

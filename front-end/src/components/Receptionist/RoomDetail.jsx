import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomById, updateRoomStatus, getRoomStatuses } from "../../services/receptionistAPI";
import { showToast } from "../Common/Toast";

export default function RoomDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allStatuses, setAllStatuses] = useState([]);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRoomDetail();
            fetchStatuses();
        }
    }, [id]);

    const fetchRoomDetail = async () => {
        try {
            const res = await getRoomById(id);
            setRoom(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load room details");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatuses = async () => {
        try {
            const res = await getRoomStatuses();
            setAllStatuses(res.data);
        } catch (err) {
            console.error("Failed to fetch statuses", err);
        }
    };

    const updateStatus = async (newStatusName) => {
        if (!window.confirm(`Change status to ${newStatusName}?`)) return;
        setUpdating(true);
        try {
            const selectedStatus = allStatuses.find(s => s.name === newStatusName);
            if (!selectedStatus) {
                showToast("Invalid status selected", "error");
                setUpdating(false);
                return;
            }
            const res = await updateRoomStatus(id, { status: selectedStatus.statusId });
            if (res.status === 200) {
                setRoom(prevRoom => ({ ...prevRoom, statusName: newStatusName, statusId: selectedStatus.statusId }));
                showToast("Status updated successfully", "success");
            } else {
                showToast("Failed to update status", "error");
            }
        } catch (err) {
            showToast("Failed to update status", "error");
            console.error(err);
        } finally {
            setUpdating(false);
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

                            {/* Status Update Dropdown */}
                            <div className="row mb-3">
                                <div className="col-sm-3 fw-bold">Status</div>
                                <div className="col-sm-9">
                                    <select
                                        className="form-select form-select-sm d-inline-block w-auto"
                                        value={room.statusName}
                                        onChange={(e) => updateStatus(e.target.value)}
                                        disabled={updating}
                                    >
                                        {allStatuses.map(s => (
                                            <option key={s.statusId} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                    {updating && <span className="ms-2 spinner-border spinner-border-sm"></span>}
                                </div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

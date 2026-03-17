import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerBookingsModal from './CustomerBookingsModal';
import Pagination from '../Common/Pagination';
import './CustomerList.css';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchIdNumber, setSearchIdNumber] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchCustomers(currentPage);
    }, [currentPage, searchName, searchPhone, searchIdNumber]);

    const fetchCustomers = async (page = 0) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:9999/api/receptionist/customers', {
                params: {
                    page: page,
                    size: PAGE_SIZE,
                    name: searchName,
                    phone: searchPhone,
                    idNumber: searchIdNumber
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data.customers);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
            setTotalItems(response.data.totalItems);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewBookings = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleRebook = (customer) => {
        const rebookData = {
            guestName: customer.name,
            guestEmail: customer.email,
            guestPhone: customer.phone,
            guestIdNumber: customer.idNumber,
            guestNationality: customer.nationality,
            guestAddress: customer.address
        };
        navigate('/receptionist', { state: { rebookData } });
    };

    const hasFilters = searchName || searchPhone || searchIdNumber;

    return (
        <div className="guidelines-mgmt-container customer-mgmt-container">
            <div className="mgmt-header d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <h2>Customer List</h2>
                </div>
                
                <div className="row g-2 w-100">
                    <div className="col-md-3">
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            className="form-control"
                            value={searchName}
                            onChange={(e) => {
                                setSearchName(e.target.value);
                                setCurrentPage(0);
                            }}
                        />
                    </div>
                    <div className="col-md-3">
                        <input 
                            type="text" 
                            placeholder="Search by phone..." 
                            className="form-control"
                            value={searchPhone}
                            onChange={(e) => {
                                setSearchPhone(e.target.value);
                                setCurrentPage(0);
                            }}
                        />
                    </div>
                    <div className="col-md-3">
                        <input 
                            type="text" 
                            placeholder="Search ID/Passport..." 
                            className="form-control"
                            value={searchIdNumber}
                            onChange={(e) => {
                                setSearchIdNumber(e.target.value);
                                setCurrentPage(0);
                            }}
                        />
                    </div>
                    <div className="col-md-1">
                        <button 
                            className="btn btn-outline-secondary w-100"
                            onClick={() => {
                                setSearchName('');
                                setSearchPhone('');
                                setSearchIdNumber('');
                                setCurrentPage(0);
                            }}
                            disabled={!hasFilters}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {loading && customers.length === 0 ? (
                <div className="text-center p-5">Loading customers...</div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover mgmt-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>ID Number</th>
                                    <th>Nationality</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer, index) => (
                                    <tr key={`${customer.phone}-${customer.name}`}>
                                        <td>{currentPage * PAGE_SIZE + index + 1}</td>
                                        <td>{customer.name}</td>
                                        <td>{customer.email || 'N/A'}</td>
                                        <td>{customer.phone || 'N/A'}</td>
                                        <td>{customer.idNumber || 'N/A'}</td>
                                        <td>{customer.nationality || 'N/A'}</td>
                                        <td className="actions-col">
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handleViewBookings(customer)}
                                                    title="View booking history"
                                                >
                                                    <i className="fa fa-history"></i> Bookings
                                                </button>
                                                <button 
                                                    className={`btn btn-sm ${customer.hasActiveBooking ? 'btn-outline-secondary' : 'btn-success'}`}
                                                    onClick={() => handleRebook(customer)}
                                                    disabled={customer.hasActiveBooking}
                                                    title={customer.hasActiveBooking ? "Customer has an active booking" : "Create new booking for this customer"}
                                                >
                                                    <i className={`fa ${customer.hasActiveBooking ? 'fa-ban' : 'fa-refresh'}`}></i> Re-book
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center p-4">No customers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={(page) => setCurrentPage(page)} 
                        />
                    )}

                    <div className="text-center text-muted mt-2 small">
                        Showing {totalItems === 0 ? 0 : (currentPage * PAGE_SIZE + 1)}–{Math.min((currentPage + 1) * PAGE_SIZE, totalItems)} of {totalItems} customers
                        {hasFilters && ` (filtered from searching)`}
                    </div>
                </>
            )}

            <CustomerBookingsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={selectedCustomer}
            />
        </div>
    );
};

export default CustomerList;

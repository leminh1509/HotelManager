import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../../services/receptionistAPI';
import CustomerBookingsModal from './CustomerBookingsModal';
import Pagination from '../Common/Pagination';
import './CustomerList.css';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchCustomers(currentPage);
    }, [currentPage, searchKeyword]);

    const fetchCustomers = async (page = 0) => {
        setLoading(true);
        try {
            const data = await getCustomers({
                page: page,
                size: PAGE_SIZE,
                keyword: searchKeyword
            });
            setCustomers(data.customers);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
            setTotalItems(data.totalItems);
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

    return (
        <div className="guidelines-mgmt-container customer-mgmt-container">
            <div className="mgmt-header">
                <h2>Customer List</h2>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="form-control"
                        value={searchKeyword}
                        onChange={(e) => {
                            setSearchKeyword(e.target.value);
                            setCurrentPage(0); // Reset to first page on search
                        }}
                    />
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
                        {searchKeyword && ` (filtered from searching)`}
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

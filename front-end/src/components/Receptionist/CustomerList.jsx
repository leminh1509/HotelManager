import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerBookingsModal from './CustomerBookingsModal';
import Pagination from '../Common/Pagination';
import './CustomerList.css';

const CustomerList = () => {
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
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:9999/api/receptionist/customers', {
                params: {
                    page: page,
                    size: PAGE_SIZE,
                    keyword: searchKeyword
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
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.userId}>
                                        <td>{customer.userId}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {customer.avatarUrl ? (
                                                    <img src={customer.avatarUrl} alt="" className="avatar-sm me-2" />
                                                ) : (
                                                    <div className="avatar-placeholder me-2">
                                                        {customer.firstName.charAt(0)}
                                                    </div>
                                                )}
                                                {customer.firstName} {customer.lastName}
                                            </div>
                                        </td>
                                        <td>{customer.email}</td>
                                        <td>{customer.mobilePhone || 'N/A'}</td>
                                        <td>
                                            <span className={`badge bg-${customer.isActive ? 'success' : 'danger'}`}>
                                                {customer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="actions-col">
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleViewBookings(customer)}
                                            >
                                                <i className="fa fa-history me-1"></i> Bookings
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-4">No customers found.</td>
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

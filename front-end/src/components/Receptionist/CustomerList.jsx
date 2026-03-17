import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerBookingsModal from './CustomerBookingsModal';
import './CustomerList.css';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:9999/api/receptionist/customers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data);
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

    const filteredCustomers = customers.filter(c => 
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchKeyword.toLowerCase()) ||
        c.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (c.mobilePhone && c.mobilePhone.includes(searchKeyword))
    );

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
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5">Loading customers...</div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
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
                            {filteredCustomers.map((customer) => (
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
                        </tbody>
                    </table>
                </div>
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

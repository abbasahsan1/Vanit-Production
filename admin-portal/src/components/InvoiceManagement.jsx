import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import UnifiedNavbar from './UnifiedNavbar';
import { 
  FaMoneyBillWave, 
  FaPlus, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaEnvelope,
  FaCalendar,
  FaRoute,
  FaDollarSign,
  FaSearch,
  FaFilter,
  FaUsers,
  FaClock,
  FaChartLine,
  FaArrowLeft
} from 'react-icons/fa';

const InvoiceManagement = () => {
  const [routeFees, setRouteFees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    routeName: '',
    searchTerm: ''
  });
  
  // Form states
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(), // Current year
    dueDate: '',
    adminNotes: ''
  });
  const [feeForm, setFeeForm] = useState({
    routeName: '',
    monthlyFee: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    unpaidAmount: 0,
    pendingPayments: 0,
    overdueInvoices: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching invoice management data...");
      
      const [feesRes, invoicesRes, routesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/invoices/route-fees'),
        axios.get('http://localhost:5000/api/invoices/all'),
        axios.get('http://localhost:5000/api/routes/all')
      ]);

      console.log("✅ Route fees response:", feesRes.data);
      console.log("✅ Invoices response:", invoicesRes.data);
      console.log("✅ Routes response:", routesRes.data);

      setRouteFees(feesRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
      setRoutes(routesRes.data || []);

      console.log("📊 Data set - Route fees:", feesRes.data.data?.length || 0);
      console.log("📊 Data set - Invoices:", invoicesRes.data.data?.length || 0);
      console.log("📊 Data set - Routes:", routesRes.data?.length || 0);

      // Calculate statistics
      const invoiceData = invoicesRes.data.data || [];
      const totalInvoices = invoiceData.length;
      const unpaidAmount = invoiceData
        .filter(inv => ['unpaid', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const pendingPayments = invoiceData.filter(inv => inv.status === 'pending').length;
      const overdueInvoices = invoiceData.filter(inv => inv.status === 'overdue').length;

      setStats({
        totalInvoices,
        unpaidAmount,
        pendingPayments,
        overdueInvoices
      });

      console.log("📈 Statistics calculated:", {
        totalInvoices,
        unpaidAmount,
        pendingPayments,
        overdueInvoices
      });

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRouteFee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/invoices/route-fees', feeForm);
      alert('Route fee updated successfully!');
      setShowFeeModal(false);
      setFeeForm({ routeName: '', monthlyFee: '' });
      fetchData();
    } catch (error) {
      alert('Error updating route fee');
      console.error(error);
    }
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    if (!generateForm.dueDate) {
      alert('Please select a due date');
      return;
    }

    try {
      // Prepare the data according to backend expectations
      const requestData = {
        month: generateForm.month,
        year: generateForm.year,
        dueDate: generateForm.dueDate
      };
      
      console.log("🔄 Generating invoices with data:", requestData);
      
      const response = await axios.post('http://localhost:5000/api/invoices/generate-bulk', requestData);
      
      console.log("✅ Invoice generation response:", response.data);
      
      alert(`Successfully generated ${response.data.data.invoicesCreated} invoices!`);
      setShowGenerateModal(false);
      setGenerateForm({ 
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        dueDate: '', 
        adminNotes: '' 
      });
      fetchData();
    } catch (error) {
      console.error('❌ Error generating invoices:', error);
      console.error('❌ Error response:', error.response?.data || error.message);
      alert(`Error generating invoices: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleApprovePayment = async (invoiceId) => {
    if (window.confirm('Are you sure you want to approve this payment?')) {
      try {
        await axios.post(`http://localhost:5000/api/invoices/${invoiceId}/approve`);
        alert('Payment approved successfully!');
        fetchData();
      } catch (error) {
        alert('Error approving payment');
        console.error(error);
      }
    }
  };

  const handleRejectPayment = async (invoiceId) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason !== null) {
      try {
        await axios.post(`http://localhost:5000/api/invoices/${invoiceId}/reject`, {
          adminNotes: reason
        });
        alert('Payment rejected successfully!');
        fetchData();
      } catch (error) {
        alert('Error rejecting payment');
        console.error(error);
      }
    }
  };

  const handleSendWarning = async (studentId, studentName) => {
    const message = prompt(`Enter warning message for ${studentName}:`);
    if (message !== null) {
      try {
        await axios.post(`http://localhost:5000/api/invoices/send-warning/${studentId}`, {
          message
        });
        alert('Warning sent successfully!');
      } catch (error) {
        alert('Error sending warning');
        console.error(error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'rejected': return 'badge-secondary';
      default: return 'badge-info';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    return (
      (!filters.status || invoice.status === filters.status) &&
      (!filters.routeName || invoice.route_name === filters.routeName) &&
      (!filters.searchTerm || 
        invoice.first_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        invoice.last_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        invoice.registration_number?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    );
  });

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Professional Header */}
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-success)' }}>
                  <FaMoneyBillWave className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Invoice Management</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Manage route fees, generate invoices, and process payments</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFeeModal(true)}
                  className="btn btn-ghost flex items-center"
                >
                  <FaDollarSign className="mr-2" />
                  Set Route Fees
                </button>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn btn-primary flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Generate Invoices
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Invoices</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-action)' }}>{stats.totalInvoices}</p>
                </div>
                <FaChartLine className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pending Payments</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{stats.pendingPayments}</p>
                </div>
                <FaClock className="text-2xl icon-emphasis" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Overdue Invoices</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{stats.overdueInvoices}</p>
                </div>
                <FaExclamationTriangle className="text-2xl icon-alert" />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Unpaid Amount</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>PKR {stats.unpaidAmount.toFixed(2)}</p>
                </div>
                <FaMoneyBillWave className="text-2xl" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
          </div>

          {/* Route Fees Section */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaRoute className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                Current Route Fees
              </h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routeFees.map((fee) => (
                  <div key={fee.id} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-gradient-start)', borderColor: 'var(--color-primary-action)' }}>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{fee.routeName}</h3>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>PKR {fee.monthlyFee}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Monthly Fee</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaFilter className="mr-2 icon-ui" />
                Filter Invoices
              </h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="input w-full"
                  >
                    <option value="">All Statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Route</label>
                  <select
                    value={filters.routeName}
                    onChange={(e) => setFilters({...filters, routeName: e.target.value})}
                    className="input w-full"
                  >
                    <option value="">All Routes</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.route_name}>{route.route_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Search Student</label>
                  <div className="relative">
                    <FaSearch className="input-icon" />
                    <input
                      type="text"
                      placeholder="Name or Reg. Number"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                      className="input w-full pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                All Invoices ({filteredInvoices.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading invoices...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Payment Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)' }}>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-surface-primary)'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              {invoice.first_name} {invoice.last_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{invoice.registration_number}</div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{invoice.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {invoice.route_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold" style={{ color: 'var(--color-text-heading)' }}>PKR {invoice.amount}</div>
                          {invoice.carryForward > 0 && (
                            <div className="text-sm" style={{ color: 'var(--color-danger)' }}>
                              (+ PKR {invoice.carryForward} carried forward)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${getStatusColor(invoice.status)}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {invoice.payment_method && (
                            <div>
                              <div><strong>Method:</strong> {invoice.payment_method}</div>
                              <div><strong>Transaction:</strong> {invoice.transaction_id}</div>
                              {invoice.date_paid && (
                                <div><strong>Date:</strong> {new Date(invoice.date_paid).toLocaleDateString()}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {invoice.status === 'pending' && invoice.payment_method && invoice.transaction_id && (
                            <>
                              <button
                                onClick={() => handleApprovePayment(invoice.id)}
                                className="btn btn-success inline-flex items-center"
                              >
                                <FaCheck className="mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayment(invoice.id)}
                                className="btn btn-danger inline-flex items-center"
                              >
                                <FaTimes className="mr-1" /> Reject
                              </button>
                            </>
                          )}
                          {(invoice.status === 'pending' && (!invoice.payment_method || !invoice.transaction_id)) && (
                            <span className="text-secondary text-sm">Awaiting payment submission</span>
                          )}
                          {(['unpaid', 'overdue'].includes(invoice.status) || (invoice.status === 'rejected' && !invoice.payment_method)) && (
                            <button
                              onClick={() => handleSendWarning(invoice.student_id, `${invoice.first_name} ${invoice.last_name}`)}
                              className="btn btn-warning inline-flex items-center"
                            >
                              <FaExclamationTriangle className="mr-1" /> Warning
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                  <div className="p-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No invoices found matching the current filters
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Set Route Fee Modal */}
          {showFeeModal && (
            <div className="modal-overlay">
              <div className="card w-full max-w-md mx-4">
                <div className="card-header">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>Set Route Fee</h2>
                </div>
                <form onSubmit={handleSetRouteFee} className="card-content space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Route</label>
                    <select
                      value={feeForm.routeName}
                      onChange={(e) => setFeeForm({...feeForm, routeName: e.target.value})}
                      className="input w-full"
                      required
                    >
                      <option value="">Select Route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.route_name}>{route.route_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Monthly Fee (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={feeForm.monthlyFee}
                      onChange={(e) => setFeeForm({...feeForm, monthlyFee: e.target.value})}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                    <button
                      type="button"
                      onClick={() => setShowFeeModal(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Set Fee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Generate Invoices Modal */}
          {showGenerateModal && (
            <div className="modal-overlay">
              <div className="card w-full max-w-md mx-4">
                <div className="card-header">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>Generate Monthly Invoices</h2>
                </div>
                <form onSubmit={handleGenerateInvoices} className="card-content space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Invoice Month</label>
                    <select
                      value={generateForm.month}
                      onChange={(e) => setGenerateForm({...generateForm, month: parseInt(e.target.value)})}
                      className="input w-full"
                      required
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Invoice Year</label>
                    <input
                      type="number"
                      value={generateForm.year}
                      onChange={(e) => setGenerateForm({...generateForm, year: parseInt(e.target.value)})}
                      className="input w-full"
                      min="2024"
                      max="2030"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Due Date</label>
                    <input
                      type="date"
                      value={generateForm.dueDate}
                      onChange={(e) => setGenerateForm({...generateForm, dueDate: e.target.value})}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Admin Notes (Optional)</label>
                    <textarea
                      value={generateForm.adminNotes}
                      onChange={(e) => setGenerateForm({...generateForm, adminNotes: e.target.value})}
                      className="input w-full"
                      rows="3"
                      placeholder="Additional notes for this invoice cycle..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                    >
                      Generate Invoices
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;

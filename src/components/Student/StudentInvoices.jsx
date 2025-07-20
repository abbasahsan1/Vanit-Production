import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaPaypal, 
  FaBell,
  FaCalendar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaArrowLeft,
  FaBus,
  FaRoute
} from 'react-icons/fa';

const StudentInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [socket, setSocket] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [realtimeNotifications, setRealtimeNotifications] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: '',
    transactionID: ''
  });

  useEffect(() => {
    fetchStudentData();
    setupSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const setupSocket = async () => {
    try {
      // Get student ID first
      const email = localStorage.getItem('studentEmail');
      const studentRes = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
      const currentStudentId = studentRes.data.id;
      setStudentId(currentStudentId);

      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('✅ StudentInvoices WebSocket connected');
        newSocket.emit('subscribe_student_invoices', currentStudentId);
      });

      // Listen for real-time invoice updates
      newSocket.on('invoice_status_update', (data) => {
        console.log('📧 Received invoice status update:', data);
        
        // Show real-time notification
        const notification = {
          id: Date.now(),
          type: data.type,
          message: data.message,
          timestamp: new Date(),
          invoiceId: data.invoiceId
        };
        
        setRealtimeNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setRealtimeNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 10000);

        // Refresh invoices data
        fetchStudentData();

        // Show browser notification if supported
        if (Notification.permission === 'granted') {
          new Notification('💰 Invoice Update', {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      });

      // Listen for warnings
      newSocket.on('invoice_warning', (data) => {
        console.log('⚠️ Received invoice warning:', data);
        
        const notification = {
          id: Date.now(),
          type: 'warning',
          message: data.message,
          timestamp: new Date(),
          isWarning: true
        };
        
        setRealtimeNotifications(prev => [notification, ...prev.slice(0, 4)]);
        
        // Keep warnings longer
        setTimeout(() => {
          setRealtimeNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 20000);

        // Refresh data
        fetchStudentData();

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('⚠️ Payment Warning', {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      });

      setSocket(newSocket);

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  };

  const dismissRealtimeNotification = (id) => {
    setRealtimeNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Get student ID from stored email
      const email = localStorage.getItem('studentEmail');
      const studentRes = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
      const studentId = studentRes.data.id;

      // Fetch invoices and notifications
      const [invoicesRes, notificationsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/invoices/student/${studentId}/invoices`),
        axios.get(`http://localhost:5000/api/invoices/student/${studentId}/notifications`)
      ]);

      setInvoices(invoicesRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setPaymentForm({ paymentMethod: '', transactionID: '' });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.paymentMethod || !paymentForm.transactionID) {
      alert('Please fill in all payment details');
      return;
    }

    try {
      const email = localStorage.getItem('studentEmail');
      const studentRes = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
      const studentId = studentRes.data.id;

      await axios.post(`http://localhost:5000/api/invoices/student/${studentId}/pay/${selectedInvoice.id}`, paymentForm);
      
      alert('Payment submitted successfully! Your payment is now pending admin approval.');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchStudentData();
    } catch (error) {
      alert('Error submitting payment. Please try again.');
      console.error(error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/invoices/notifications/${notificationId}/read`);
      fetchStudentData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return { color: 'var(--color-success)', backgroundColor: '#D1FAE5', borderColor: 'var(--color-success)' };
      case 'pending': return { color: 'var(--color-warning)', backgroundColor: '#FEF3C7', borderColor: 'var(--color-warning)' };
      case 'overdue': return { color: 'var(--color-danger)', backgroundColor: '#FEE2E2', borderColor: 'var(--color-danger)' };
      case 'rejected': return { color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' };
      default: return { color: 'var(--color-primary-action)', backgroundColor: 'var(--color-bg-gradient-start)', borderColor: 'var(--color-primary-action)' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <FaCheckCircle style={{ color: 'var(--color-success)' }} />;
      case 'pending': return <FaClock style={{ color: 'var(--color-warning)' }} />;
      case 'overdue': return <FaExclamationTriangle className="icon-alert" />;
      case 'rejected': return <FaTimes style={{ color: 'var(--color-danger)' }} />;
      default: return <FaMoneyBillWave style={{ color: 'var(--color-primary-action)' }} />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'credit/debit card':
      case 'credit card':
      case 'debit card':
        return <FaCreditCard style={{ color: 'var(--color-primary-action)' }} />;
      case 'bank transfer':
        return <FaMoneyBillWave style={{ color: 'var(--color-success)' }} />;
      case 'easypaisa':
      case 'jazzcash':
        return <FaPaypal style={{ color: 'var(--color-primary-action)' }} />;
      default:
        return <FaMoneyBillWave style={{ color: 'var(--color-success)' }} />;
    }
  };

  const unpaidInvoices = invoices.filter(inv => ['pending', 'overdue', 'rejected'].includes(inv.status));
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const unreadNotifications = notifications.filter(notif => !notif.read_status);

  return (
    <div className="student-view">
      <div className="container section">
        
        {/* Real-time Notifications */}
        {realtimeNotifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {realtimeNotifications.map((notification) => (
              <div
                key={notification.id}
                className="card p-4 max-w-sm animate-slide-in"
                style={{
                  backgroundColor: notification.isWarning 
                    ? 'var(--color-danger)' 
                    : notification.type === 'payment_approved' 
                    ? 'var(--color-success)'
                    : notification.type === 'payment_rejected'
                    ? 'var(--color-danger)'
                    : 'var(--color-primary-action)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {notification.isWarning ? (
                      <FaExclamationTriangle className="text-xl mr-3 mt-1 flex-shrink-0" />
                    ) : notification.type === 'payment_approved' ? (
                      <FaCheckCircle className="text-xl mr-3 mt-1 flex-shrink-0" />
                    ) : notification.type === 'payment_rejected' ? (
                      <FaTimes className="text-xl mr-3 mt-1 flex-shrink-0" />
                    ) : (
                      <FaMoneyBillWave className="text-xl mr-3 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-semibold text-body">
                        {notification.isWarning ? '⚠️ Payment Warning' : 
                         notification.type === 'payment_approved' ? '✅ Payment Approved' :
                         notification.type === 'payment_rejected' ? '❌ Payment Rejected' :
                         '💰 Invoice Update'}
                      </h4>
                      <p className="text-body opacity-90 mt-1">{notification.message}</p>
                      <p className="text-caption opacity-75 mt-2">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissRealtimeNotification(notification.id)}
                    className="hover:opacity-80 ml-2 flex-shrink-0"
                    style={{ color: 'var(--color-text-inverse)' }}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Professional Header */}
        <div className="card mb-6">
          <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-success)',
                    color: 'var(--color-text-inverse)'
                  }}
                >
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <div>
                  <h1 className="text-display font-bold" style={{ color: 'var(--color-text-heading)' }}>
                    My Invoices
                  </h1>
                  <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                    View and pay your transportation fees
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {unreadNotifications.length > 0 && (
                  <div className="relative">
                    <FaBell className="text-2xl icon-alert" />
                    <span 
                      className="absolute -top-2 -right-2 text-caption rounded-full h-5 w-5 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}
                    >
                      {unreadNotifications.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card" style={{ backgroundColor: '#FEE2E2' }}>
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium" style={{ color: 'var(--color-danger)' }}>Unpaid</p>
                  <p className="text-heading font-bold" style={{ color: 'var(--color-danger)' }}>{unpaidInvoices.length}</p>
                </div>
                <FaExclamationTriangle className="text-2xl icon-alert" />
              </div>
            </div>
          </div>
          
          <div className="card" style={{ backgroundColor: '#FEF3C7' }}>
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium" style={{ color: 'var(--color-warning)' }}>Pending</p>
                  <p className="text-heading font-bold" style={{ color: 'var(--color-warning)' }}>{pendingInvoices.length}</p>
                </div>
                <FaClock className="text-2xl icon-emphasis" />
              </div>
            </div>
          </div>
          
          <div className="card" style={{ backgroundColor: '#D1FAE5' }}>
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium" style={{ color: 'var(--color-success)' }}>Paid</p>
                  <p className="text-heading font-bold" style={{ color: 'var(--color-success)' }}>{paidInvoices.length}</p>
                </div>
                <FaCheckCircle className="text-2xl" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
          </div>
          
          <div className="card" style={{ backgroundColor: 'var(--color-bg-gradient-start)' }}>
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium" style={{ color: 'var(--color-primary-action)' }}>Total Amount Due</p>
                  <p className="text-heading font-bold" style={{ color: 'var(--color-primary-brand)' }}>
                    PKR {unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toFixed(2)}
                  </p>
                </div>
                <FaMoneyBillWave className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {unreadNotifications.length > 0 && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-heading font-semibold flex items-center">
                <FaBell className="mr-2 icon-alert" />
                Notifications ({unreadNotifications.length})
              </h2>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {unreadNotifications.slice(0, 3).map((notification) => (
                  <div 
                    key={notification.id} 
                    className="p-4 rounded-lg border-l-4 cursor-pointer transition-colors"
                    style={{
                      borderLeftColor: notification.type === 'warning' ? 'var(--color-danger)' :
                                      notification.type === 'reminder' ? 'var(--color-warning)' :
                                      'var(--color-primary-action)',
                      backgroundColor: notification.type === 'warning' ? '#FEE2E2' :
                                      notification.type === 'reminder' ? '#FEF3C7' :
                                      'var(--color-bg-gradient-start)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = notification.type === 'warning' ? '#FEE2E2' :
                                                                           notification.type === 'reminder' ? '#FEF3C7' :
                                                                           'var(--color-bg-gradient-start)'}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-body" style={{ color: 'var(--color-text-body)' }}>{notification.message}</p>
                        <p className="text-caption mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(notification.created_at).toLocaleDateString()} - Amount: PKR {notification.amount}
                        </p>
                      </div>
                      <span 
                        className="px-2 py-1 text-caption rounded-full"
                        style={{
                          backgroundColor: notification.type === 'warning' ? '#FEE2E2' :
                                          notification.type === 'reminder' ? '#FEF3C7' :
                                          'var(--color-bg-gradient-start)',
                          color: notification.type === 'warning' ? 'var(--color-danger)' :
                                 notification.type === 'reminder' ? 'var(--color-warning)' :
                                 'var(--color-primary-action)'
                        }}
                      >
                        {notification.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
            <h2 className="text-heading font-semibold">All Invoices</h2>
          </div>
          
          {loading ? (
            <div className="card-content text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="card-content text-center py-12">
              <FaMoneyBillWave className="text-6xl mx-auto mb-4 icon-ui" />
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No invoices found</p>
            </div>
          ) : (
            <div style={{ borderColor: 'var(--color-border-standard)' }}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-6" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusIcon(invoice.status)}
                        <h3 className="text-subheading font-semibold ml-2" style={{ color: 'var(--color-text-heading)' }}>
                          Invoice #{invoice.id}
                        </h3>
                        <span 
                          className="ml-3 px-3 py-1 text-caption font-medium rounded-full border"
                          style={getStatusColor(invoice.status)}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body">
                        <div>
                          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Amount</p>
                          <p className="font-semibold text-subheading" style={{ color: 'var(--color-text-heading)' }}>PKR {invoice.amount}</p>
                        </div>
                        <div>
                          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Route</p>
                          <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>{invoice.route_name}</p>
                        </div>
                        <div>
                          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Generated</p>
                          <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Due Date</p>
                          <p 
                            className="font-medium"
                            style={{ 
                              color: new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' 
                                ? 'var(--color-danger)' 
                                : 'var(--color-text-body)'
                            }}
                          >
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Payment details if exists */}
                      {invoice.payment_method && (
                        <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Payment Method</p>
                              <div className="flex items-center mt-1">
                                {getPaymentMethodIcon(invoice.payment_method)}
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-body)' }}>{invoice.payment_method}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Transaction ID</p>
                              <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>{invoice.transaction_id}</p>
                            </div>
                            <div>
                              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Payment Date</p>
                              <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>
                                {new Date(invoice.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {invoice.rejection_reason && (
                            <div className="mt-2">
                              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>Notes</p>
                              <p className="text-body" style={{ color: 'var(--color-text-body)' }}>{invoice.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 md:mt-0 md:ml-6">
                      {(['pending', 'overdue', 'rejected'].includes(invoice.status) && !invoice.payment_method) && (
                        <button
                          onClick={() => handlePayInvoice(invoice)}
                          className="btn btn-success w-full md:w-auto"
                        >
                          <FaCreditCard className="mr-2" />
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay">
            <div className="card max-w-lg mx-auto">
              <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-heading font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                    Pay Invoice #{selectedInvoice.id}
                  </h2>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="transition-colors icon-ui"
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-placeholder)'}
                  >
                    <FaTimes className="text-lg" />
                  </button>
                </div>
              </div>
              
              <div className="card-content">
                {/* Invoice Summary */}
                <div className="mb-6 p-4 rounded-lg border" style={{ 
                  backgroundColor: 'var(--color-bg-gradient-start)', 
                  borderColor: 'var(--color-primary-action)' 
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-caption font-medium" style={{ color: 'var(--color-primary-brand)' }}>
                        Amount to Pay
                      </p>
                      <p className="text-display font-bold" style={{ color: 'var(--color-primary-action)' }}>
                        PKR {selectedInvoice.amount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                        Route: {selectedInvoice.route_name}
                      </p>
                      <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                        Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Form */}
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="input w-full"
                      required
                    >
                      <option value="">Select payment method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit/Debit Card</option>
                      <option value="easypaisa">EasyPaisa</option>
                      <option value="jazzcash">JazzCash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={paymentForm.transactionID}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionID: e.target.value }))}
                      className="input w-full"
                      placeholder="Enter transaction ID from your payment"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={!paymentForm.paymentMethod || !paymentForm.transactionID}
                    >
                      <FaCreditCard className="mr-2" />
                      Submit Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default StudentInvoices;

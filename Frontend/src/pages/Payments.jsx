import React, { useState, useEffect } from "react";
import { Plus, Filter, Eye, CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { receiptsAPI } from "../utils/api";
import { formatCurrency, formatDate, getStatusBadgeClass } from "../utils/helpers";
import DataTable from "../components/UI/DataTable";
import Modal from "../components/UI/Modal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [filters, setFilters] = useState({
    customerName: "",
    paymentMethod: "",
    status: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPayments: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [pagination.page, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await receiptsAPI.getReceipts(params);
      const { data, totalRecords, totalPages, hasNextPage, hasPreviousPage } = response.data;

      setPayments(data);
      setPagination((prev) => ({
        ...prev,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }));
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      // Calculate stats from current payments data
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalPayments = payments.length;
      const pendingAmount = payments
        .filter(p => p.status === "Pending")
        .reduce((sum, payment) => sum + payment.amount, 0);
      const approvedAmount = payments
        .filter(p => p.status === "Approved")
        .reduce((sum, payment) => sum + payment.amount, 0);

      setStats({
        totalAmount,
        totalPayments,
        pendingAmount,
        approvedAmount,
      });
    } catch (error) {
      console.error("Error calculating payment stats:", error);
    }
  };

  useEffect(() => {
    fetchPaymentStats();
  }, [payments]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      paymentMethod: "",
      status: "",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const getPaymentMethodIcon = (payment) => {
    if (payment.cashChecked) return "💵";
    if (payment.chequeChecked) return "📄";
    if (payment.rtgsChecked) return "🏦";
    return "💳";
  };

  const getPaymentMethods = (payment) => {
    const methods = [];
    if (payment.cashChecked) methods.push("Cash");
    if (payment.chequeChecked) methods.push(`Cheque (${payment.chequeNo || 'N/A'})`);
    if (payment.rtgsChecked) methods.push(`RTGS/NEFT (${payment.rtgsNeft || 'N/A'})`);
    return methods.length > 0 ? methods.join(", ") : "Not specified";
  };

  const columns = [
    {
      key: "receiptNo",
      title: "Receipt No",
      sortable: true,
    },
    {
      key: "fromName",
      title: "Customer Name",
      sortable: true,
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: "paymentMethod",
      title: "Payment Method",
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <span>{getPaymentMethodIcon(row)}</span>
          <span className="text-sm">{getPaymentMethods(row)}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <span className={`badge ${getStatusBadgeClass(value)}`}>{value}</span>
          {row.associateRemarks && (
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
              title="Has associate remarks"
            >
              📝
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Payment Date",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedPayment(row);
              setShowPaymentModal(true);
            }}
            className="text-primary-600 hover:text-primary-900"
            title="View Payment Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all payment transactions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.approvedAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange("customerName", e.target.value)}
                  className="input"
                  placeholder="Search by customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
                  className="input"
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="rtgs">RTGS/NEFT/UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  className="input"
                  placeholder="Minimum amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  className="input"
                  placeholder="Maximum amount"
                />
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-secondary w-full">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={payments}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchable={false}
        filterable={false}
      />

      {/* Payment Details Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Receipt No
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.receiptNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span className={`badge ${getStatusBadgeClass(selectedPayment.status)} mt-1`}>
                    {selectedPayment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.fromName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.mobile}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.address}</p>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.siteName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Plot No
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.plotVillaNo}</p>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  {selectedPayment.cashChecked && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">💵</span>
                      <span className="text-sm font-medium">Cash Payment</span>
                    </div>
                  )}
                  {selectedPayment.chequeChecked && (
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">📄</span>
                      <span className="text-sm font-medium">
                        Cheque Payment {selectedPayment.chequeNo && `(${selectedPayment.chequeNo})`}
                      </span>
                    </div>
                  )}
                  {selectedPayment.rtgsChecked && (
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600">🏦</span>
                      <span className="text-sm font-medium">
                        RTGS/NEFT/UPI {selectedPayment.rtgsNeft && `(${selectedPayment.rtgsNeft})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {selectedPayment.associateRemarks && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <label className="block text-sm font-bold text-green-800 mb-1">
                  📝 Associate Remarks
                </label>
                <p className="text-sm text-green-900 font-medium">
                  "{selectedPayment.associateRemarks}"
                </p>
              </div>
            )}
            {selectedPayment.adminRemarks && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label className="block text-sm font-bold text-blue-800 mb-1">
                  👨‍💼 Admin Remarks
                </label>
                <p className="text-sm text-blue-900">
                  {selectedPayment.adminRemarks}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
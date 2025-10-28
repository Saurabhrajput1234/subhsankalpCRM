import React, { useState, useEffect } from "react";
import { Plus, Filter, Download, Eye, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { receiptsAPI } from "../utils/api";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
} from "../utils/helpers";
import { exportReceiptsToCSV } from "../utils/csvExport";
import DataTable from "../components/UI/DataTable";
import Modal from "../components/UI/Modal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import CreateReceiptForm from "../components/Forms/CreateReceiptForm";
import ApprovalForm from "../components/Forms/ApprovalForm";
import PrintReceipt from "../components/Receipt/PrintReceipt";
import toast from "react-hot-toast";

const Receipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
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
    referenceName: "",
    siteName: "",
    status: "",
    receiptType: "",
    companyName: "",
    fromDate: "",
    toDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalReceiptData, setApprovalReceiptData] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [pagination.page, filters]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await receiptsAPI.getReceipts(params);
      const { data, totalRecords, totalPages, hasNextPage, hasPreviousPage } =
        response.data;

      setReceipts(data);
      setPagination((prev) => ({
        ...prev,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }));
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to fetch receipts");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);
      
      // Fetch all receipts (not paginated) for export
      const params = {
        pageSize: 10000, // Large number to get all receipts
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await receiptsAPI.getReceipts(params);
      const allReceipts = response.data.data || [];

      if (allReceipts.length === 0) {
        toast.error("No receipts found to export");
        return;
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `receipts-export-${currentDate}.csv`;

      // Export to CSV
      exportReceiptsToCSV(allReceipts, filename);
      
      toast.success(`Successfully exported ${allReceipts.length} receipts to CSV`);
    } catch (error) {
      console.error("Error exporting receipts:", error);
      toast.error("Failed to export receipts to CSV");
    } finally {
      setExportingCSV(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      referenceName: "",
      siteName: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleApproveReceipt = (receipt) => {
    setApprovalReceiptData(receipt);
    setShowApprovalForm(true);
  };

  const handlePrintReceipt = (receipt) => {
    setPrintReceiptData(receipt);
    setShowPrintModal(true);
  };

  const columns = [
    {
      key: "receiptNo",
      title: "Receipt No",
      sortable: true,
    },
    {
      key: "receiptType",
      title: "Type",
      sortable: true,
      render: (value) => (
        <span className={`badge ${value === 'token' ? 'badge-info' : 'badge-warning'}`}>
          {value === 'token' ? 'Token' : 'Booking'}
        </span>
      ),
    },
    {
      key: "fromName",
      title: "Customer Name",
      sortable: true,
    },
    {
      key: "siteName",
      title: "Site Name",
      sortable: true,
    },
    {
      key: "plotVillaNo",
      title: "Plot No",
      sortable: true,
    },
    {
      key: "amount",
      title: "Amount",
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <span className={`badge ${getStatusBadgeClass(value)}`}>{value}</span>
          {row.associateRemarks && row.status === "Pending" && (
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
              title="Has associate remarks for review"
            >
              📝
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Created Date",
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
              setSelectedReceipt(row);
              setShowReceiptModal(true);
            }}
            className="text-primary-600 hover:text-primary-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePrintReceipt(row)}
            className="text-blue-600 hover:text-blue-900"
            title="Print Receipt"
          >
            <Printer className="h-4 w-4" />
          </button>
          {user?.role === "Admin" && row.status === "Pending" && (
            <button
              onClick={() => handleApproveReceipt(row)}
              className="text-success-600 hover:text-success-900"
              title="Approve Receipt"
            >
              Approve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage token and booking receipts
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
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV || loading}
            className="btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportingCSV ? "Exporting..." : "Export CSV"}
          </button>
          {user?.role !== "Customer" && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </button>
          )}
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
                  onChange={(e) =>
                    handleFilterChange("customerName", e.target.value)
                  }
                  className="input"
                  placeholder="Search by customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Name
                </label>
                <input
                  type="text"
                  value={filters.referenceName}
                  onChange={(e) =>
                    handleFilterChange("referenceName", e.target.value)
                  }
                  className="input"
                  placeholder="Search by reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={filters.siteName}
                  onChange={(e) =>
                    handleFilterChange("siteName", e.target.value)
                  }
                  className="input"
                  placeholder="Search by site"
                />
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
                  <option value="Expired">Expired</option>
                  <option value="Converted">Converted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Type
                </label>
                <select
                  value={filters.receiptType}
                  onChange={(e) => handleFilterChange("receiptType", e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="token">Token Receipt</option>
                  <option value="booking">Booking Receipt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <select
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange("companyName", e.target.value)}
                  className="input"
                >
                  <option value="">All Companies</option>
                  <option value="Subhsankalp">Subhsankalp</option>
                  <option value="Golden City">Golden City</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    handleFilterChange("fromDate", e.target.value)
                  }
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
        data={receipts}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchable={false}
        filterable={false}
      />

      {/* Receipt Details Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Receipt Details"
        size="lg"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Receipt No
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.receiptNo}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Receipt Type
                </label>
                <p className="mt-1">
                  <span className={`badge ${selectedReceipt.receiptType === 'token' ? 'badge-info' : 'badge-warning'}`}>
                    {selectedReceipt.receiptType === 'token' ? 'Token Receipt' : 'Booking Receipt'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span
                  className={`badge ${getStatusBadgeClass(
                    selectedReceipt.status
                  )} mt-1`}
                >
                  {selectedReceipt.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.fromName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.mobile}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.panNumber || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhar Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.aadharNumber || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.companyName || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.siteName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plot No
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.plotVillaNo}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatCurrency(selectedReceipt.amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created By
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReceipt.createdByName}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedReceipt.address}
              </p>
            </div>
            {selectedReceipt.associateRemarks && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <label className="block text-sm font-bold text-green-800 mb-1">
                  📝 Associate Remarks
                </label>
                <p className="text-sm text-green-900 font-medium">
                  "{selectedReceipt.associateRemarks}"
                </p>
                <p className="text-xs text-green-600 mt-1">
                  - {selectedReceipt.createdByName}
                </p>
              </div>
            )}
            {selectedReceipt.adminRemarks && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <label className="block text-sm font-bold text-blue-800 mb-1">
                  👨‍💼 Admin Remarks
                </label>
                <p className="text-sm text-blue-900">
                  {selectedReceipt.adminRemarks}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Receipt Form */}
      <CreateReceiptForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchReceipts}
      />

      {/* Print Receipt Modal */}
      <PrintReceipt
        receipt={printReceiptData}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        type={printReceiptData?.receiptType || 'token'}
      />

      {/* Approval Form Modal */}
      <ApprovalForm
        receipt={approvalReceiptData}
        isOpen={showApprovalForm}
        onClose={() => setShowApprovalForm(false)}
        onSuccess={fetchReceipts}
      />
    </div>
  );
};

export default Receipts;

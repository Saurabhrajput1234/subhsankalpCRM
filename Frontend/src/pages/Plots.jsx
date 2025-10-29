import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Edit,
  Eye,
  MapPin,
  Download,
  Receipt,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { plotsAPI } from "../utils/api";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
} from "../utils/helpers";
import { exportPlotsToCSV } from "../utils/csvExport";
import DataTable from "../components/UI/DataTable";
import Modal from "../components/UI/Modal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import CreatePlotForm from "../components/Forms/CreatePlotForm";
import BulkCreatePlotsForm from "../components/Forms/BulkCreatePlotsForm";
import BookingReceiptForm from "../components/Forms/BookingReceiptForm";
import toast from "react-hot-toast";

const Plots = () => {
  const { user } = useAuth();
  const [plots, setPlots] = useState([]);
  const [allPlots, setAllPlots] = useState([]); // For statistics calculation
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10, // Keep 10 plots per page
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [filters, setFilters] = useState({
    siteName: "",
    status: "",
    minPrice: "",
    maxPrice: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [showBookingReceiptForm, setShowBookingReceiptForm] = useState(false);
  const [selectedPlotForBooking, setSelectedPlotForBooking] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    fetchPlots();
  }, [pagination.page, pagination.pageSize, filters]);

  const fetchPlots = async () => {
    try {
      setLoading(true);

      // Fetch paginated plots for table display
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

      const response = await plotsAPI.getPlots(params);
      const { data, totalRecords, totalPages, hasNextPage, hasPreviousPage } =
        response.data;

      setPlots(data);
      setPagination((prev) => ({
        ...prev,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }));

      // Fetch all plots for statistics (use main endpoint with large page size)
      try {
        const allPlotsResponse = await plotsAPI.getPlots({
          pageSize: 1000,
          page: 1,
        }); // Get all plots for statistics
        const allPlotsData = allPlotsResponse.data.data || [];
        console.log(
          "All plots for statistics:",
          allPlotsData.length,
          "plots loaded"
        );
        setAllPlots(allPlotsData);
      } catch (error) {
        console.error("Error fetching all plots for statistics:", error);
        // Use current page data as fallback
        console.log(
          "Using fallback data for statistics:",
          data?.length || 0,
          "plots"
        );
        setAllPlots(data || []);
      }
    } catch (error) {
      console.error("Error fetching plots:", error);
      toast.error("Failed to fetch plots");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);

      // Always fetch plots with current filters applied
      const params = {
        pageSize: 10000, // Large number to get all matching plots
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

      const response = await plotsAPI.getPlots(params);
      const plotsToExport = response.data.data || [];

      if (plotsToExport.length === 0) {
        toast.error("No plots found to export with current filters");
        return;
      }

      // Generate filename with current date and filter info
      const currentDate = new Date().toISOString().split("T")[0];
      let filename = `plots-export-${currentDate}`;

      // Add filter info to filename
      if (filters.status) {
        filename += `-${filters.status.toLowerCase()}`;
      }
      if (filters.siteName) {
        filename += `-${filters.siteName.replace(/\s+/g, "-").toLowerCase()}`;
      }
      filename += ".csv";

      // Export to CSV
      exportPlotsToCSV(plotsToExport, filename);

      const filterInfo = [];
      if (filters.status) filterInfo.push(`Status: ${filters.status}`);
      if (filters.siteName) filterInfo.push(`Site: ${filters.siteName}`);

      const filterText =
        filterInfo.length > 0 ? ` (${filterInfo.join(", ")})` : "";
      toast.success(
        `Successfully exported ${plotsToExport.length} plots to CSV${filterText}`
      );
    } catch (error) {
      console.error("Error exporting plots:", error);
      toast.error("Failed to export plots to CSV");
    } finally {
      setExportingCSV(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      siteName: "",
      status: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? "" : status, // Toggle filter
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Tokened":
        return "bg-orange-100 text-orange-800";
      case "Booked":
        return "bg-yellow-100 text-yellow-800";
      case "Sold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "siteName",
      title: "Site Name",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{value}</p>
          {row.block && (
            <p className="text-gray-500 text-xs">Block: {row.block}</p>
          )}
        </div>
      ),
    },
    {
      key: "plotNumber",
      title: "Plot Number",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{value}</p>
          {row.registeredCompany && (
            <p className="text-gray-500 text-xs">{row.registeredCompany}</p>
          )}
        </div>
      ),
    },
    {
      key: "plotSize",
      title: "Plot Size",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {value || "Not specified"}
          </p>
          {row.facing && (
            <p className="text-gray-500 text-xs">Facing: {row.facing}</p>
          )}
        </div>
      ),
    },
    {
      key: "basicRate",
      title: "Rate & Price",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {formatCurrency(value)}/sq yard
          </p>
          <p className="text-gray-600 text-xs">
            Total:{" "}
            {row.totalPrice ? formatCurrency(row.totalPrice) : "Not Calculated"}
          </p>
        </div>
      ),
    },
    {
      key: "customerName",
      title: "Customer & Associate",
      render: (value, row) => {
        if (row.status === "Available") {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        // Show customer data for Tokened, Booked and Sold plots
        if (
          row.status === "Tokened" ||
          row.status === "Booked" ||
          row.status === "Sold"
        ) {
          return (
            <div className="text-sm">
              <p className="font-medium text-gray-900">{value || "N/A"}</p>
              {row.associateName && (
                <p className="text-gray-500 text-xs">by {row.associateName}</p>
              )}
              {row.referenceName && (
                <p className="text-gray-500 text-xs">
                  Ref: {row.referenceName}
                </p>
              )}
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">-</span>;
      },
    },
    {
      key: "receivedAmount",
      title: "Received Amount",
      render: (value, row) => {
        // Use the received amount from the backend (supports both PascalCase and camelCase)
        const received =
          row.receivedAmount ||
          row.ReceivedAmount ||
          row.totalPaid ||
          row.TotalPaid ||
          value ||
          0;

        return (
          <div className="text-sm">
            <p className="font-medium text-green-600">
              {received > 0 ? formatCurrency(received) : "₹0"}
            </p>
          </div>
        );
      },
    },
    {
      key: "paymentStatus",
      title: "Payment Status",
      render: (value, row) => {
        if (row.status === "Available") {
          return <span className="text-gray-400 text-sm">-</span>;
        }

        // Show payment info for Tokened, Booked and Sold plots
        if (
          row.status === "Tokened" ||
          row.status === "Booked" ||
          row.status === "Sold"
        ) {
          const received = row.receivedAmount || row.ReceivedAmount || 0;
          const total = row.totalPrice || 0;
          const percentage = total > 0 ? (received / total) * 100 : 0;

          return (
            <div className="text-sm">
              {total > 0 && (
                <p className="text-gray-600 text-xs">
                  {percentage.toFixed(1)}% paid
                </p>
              )}
              {row.tokenExpiryDate && row.status === "Tokened" && (
                <p className="text-orange-600 text-xs">
                  Expires: {formatDate(row.tokenExpiryDate)}
                </p>
              )}
              {percentage >= 100 && (
                <p className="text-green-600 text-xs font-medium">
                  ✓ Fully Paid
                </p>
              )}
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">-</span>;
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (value) => (
        <span className={`badge ${getStatusColor(value)}`}>{value}</span>
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          <p className="text-gray-900">{formatDate(value)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedPlot(row);
              setShowPlotModal(true);
            }}
            className="text-primary-600 hover:text-primary-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canCreateBookingReceipt(row) && (
            <button
              onClick={() => handleBookingReceipt(row)}
              className="text-green-600 hover:text-green-900"
              title="Create Booking Receipt"
            >
              <Receipt className="h-4 w-4" />
            </button>
          )}
          {user?.role === "Admin" && (
            <button
              onClick={() => handleEditPlot(row)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Plot"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleEditPlot = (plot) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  const handleBookingReceipt = (plot) => {
    setSelectedPlotForBooking(plot);
    setShowBookingReceiptForm(true);
  };

  const handleBookingReceiptSuccess = () => {
    setShowBookingReceiptForm(false);
    setSelectedPlotForBooking(null);
    fetchPlots(); // Refresh the plots list
  };

  // Helper function to determine if plot can have booking receipt
  const canCreateBookingReceipt = (plot) => {
    // Show booking receipt button for Tokened and Booked plots until fully paid
    const isTokened = plot.status === "Tokened";
    const isBooked = plot.status === "Booked";
    const isAdmin = user?.role === "Admin";

    // Check if received amount is less than total plot amount
    const totalPlotAmount = plot.totalPrice || 0;
    const receivedAmount = plot.receivedAmount || plot.totalPaid || 0;
    const isNotFullyPaid = receivedAmount < totalPlotAmount;

    // Also check remaining balance as backup
    const hasRemainingBalance = plot.remainingBalance > 0;

    return (
      (isTokened || isBooked) &&
      isAdmin &&
      (isNotFullyPaid || hasRemainingBalance)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plots Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage property plots and their details
          </p>
          {!loading && (
            <p className="mt-1 text-xs text-gray-400">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalRecords
              )}{" "}
              of {pagination.totalRecords} plots
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          {user?.role === "Admin" && (
            <>
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || loading}
                className="btn-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportingCSV ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => setShowBulkCreateForm(true)}
                className="btn-success"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bulk Add Plots
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Single Plot
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  placeholder="Search by site name"
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
                  <option value="Available">Available</option>
                  <option value="Tokened">Tokened</option>
                  <option value="Booked">Booked</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="input"
                  placeholder="Minimum price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="input"
                  placeholder="Maximum price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items per page
                </label>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="input"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
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

      {/* Statistics Cards - Clickable Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
            filters.status === "Available"
              ? "ring-2 ring-green-500 bg-green-50"
              : "hover:bg-gray-50"
          }`}
          onClick={() => handleStatusFilter("Available")}
        >
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPlots.filter((p) => p.status === "Available").length}
                </p>
                {filters.status === "Available" && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Filtered
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
            filters.status === "Tokened"
              ? "ring-2 ring-orange-500 bg-orange-50"
              : "hover:bg-gray-50"
          }`}
          onClick={() => handleStatusFilter("Tokened")}
        >
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tokened</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPlots.filter((p) => p.status === "Tokened").length}
                </p>
                {filters.status === "Tokened" && (
                  <p className="text-xs text-orange-600 font-medium">
                    ✓ Filtered
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
            filters.status === "Booked"
              ? "ring-2 ring-yellow-500 bg-yellow-50"
              : "hover:bg-gray-50"
          }`}
          onClick={() => handleStatusFilter("Booked")}
        >
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Booked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPlots.filter((p) => p.status === "Booked").length}
                </p>
                {filters.status === "Booked" && (
                  <p className="text-xs text-yellow-600 font-medium">
                    ✓ Filtered
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
            filters.status === "Sold"
              ? "ring-2 ring-red-500 bg-red-50"
              : "hover:bg-gray-50"
          }`}
          onClick={() => handleStatusFilter("Sold")}
        >
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPlots.filter((p) => p.status === "Sold").length}
                </p>
                {filters.status === "Sold" && (
                  <p className="text-xs text-red-600 font-medium">✓ Filtered</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`card cursor-pointer transition-all duration-200 hover:shadow-lg ${
            filters.status === ""
              ? "ring-2 ring-blue-500 bg-blue-50"
              : "hover:bg-gray-50"
          }`}
          onClick={() => handleStatusFilter("")}
        >
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPlots.length}
                </p>
                {filters.status === "" && (
                  <p className="text-xs text-blue-600 font-medium">
                    ✓ All Plots
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {filters.status && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-blue-800 font-medium">
              📊 Showing {filters.status} plots only
            </span>
            <span className="ml-2 text-blue-600">
              ({pagination.totalRecords} plots found)
            </span>
          </div>
          <button
            onClick={() => handleStatusFilter("")}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={plots}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchable={false}
        filterable={false}
      />

      {/* Plot Details Modal */}
      <Modal
        isOpen={showPlotModal}
        onClose={() => setShowPlotModal(false)}
        title="Plot Details"
        size="lg"
      >
        {selectedPlot && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.siteName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Plot Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.plotNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Block
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.block || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registered Company
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.registeredCompany || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Plot Dimensions */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Plot Dimensions
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Length
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.length
                      ? `${selectedPlot.length} ft`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Width
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.width
                      ? `${selectedPlot.width} ft`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Plot Size
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.plotSize || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Features */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Location & Features
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Road
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.road || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Facing
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.facing || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gata/Khesra No
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.gataKhesraNo || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PLC Applicable
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.plcApplicable ? "Yes" : "No"}
                    {selectedPlot.plcApplicable && selectedPlot.typeofPLC && (
                      <span className="text-gray-600">
                        {" "}
                        ({selectedPlot.typeofPLC})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing & Status */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Pricing & Status
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Basic Rate
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCurrency(selectedPlot.basicRate)} per sq yard
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Price
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.totalPrice
                      ? formatCurrency(selectedPlot.totalPrice)
                      : "Not Calculated"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`badge ${getStatusColor(
                      selectedPlot.status
                    )} mt-1`}
                  >
                    {selectedPlot.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Available for Sale
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.availablePlot ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedPlot.description && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Description
                </h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedPlot.description}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Timestamps
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Created Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedPlot.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPlot.updatedAt
                      ? formatDate(selectedPlot.updatedAt)
                      : "Not updated"}
                  </p>
                </div>
              </div>
            </div>
            {/* Customer Information for Tokened/Booked/Sold Plots */}
            {(selectedPlot.status === "Tokened" ||
              selectedPlot.status === "Booked" ||
              selectedPlot.status === "Sold") && (
              <div
                className={`p-4 rounded-lg border ${
                  selectedPlot.Status === "Tokened"
                    ? "bg-orange-50 border-orange-200"
                    : selectedPlot.Status === "Booked"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <h4
                  className={`font-medium mb-3 ${
                    selectedPlot.Status === "Tokened"
                      ? "text-orange-900"
                      : selectedPlot.Status === "Booked"
                      ? "text-yellow-900"
                      : "text-blue-900"
                  }`}
                >
                  {selectedPlot.Status === "Tokened"
                    ? "Token Information"
                    : "Customer Information"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-700"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-700"
                          : "text-blue-700"
                      }`}
                    >
                      Customer Name
                    </label>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-900"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-900"
                          : "text-blue-900"
                      }`}
                    >
                      {selectedPlot.CustomerName || "Not available"}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-700"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-700"
                          : "text-blue-700"
                      }`}
                    >
                      Associate
                    </label>
                    <p
                      className={`mt-1 text-sm ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-900"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-900"
                          : "text-blue-900"
                      }`}
                    >
                      {selectedPlot.AssociateName || "Not available"}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-700"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-700"
                          : "text-blue-700"
                      }`}
                    >
                      Reference Name
                    </label>
                    <p
                      className={`mt-1 text-sm ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-900"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-900"
                          : "text-blue-900"
                      }`}
                    >
                      {selectedPlot.ReferenceName || "Not available"}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-700"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-700"
                          : "text-blue-700"
                      }`}
                    >
                      {selectedPlot.Status === "Tokened"
                        ? "Token Amount"
                        : "Received Amount"}
                    </label>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        selectedPlot.Status === "Tokened"
                          ? "text-orange-900"
                          : selectedPlot.Status === "Booked"
                          ? "text-yellow-900"
                          : "text-blue-900"
                      }`}
                    >
                      {selectedPlot.ReceivedAmount &&
                      selectedPlot.ReceivedAmount > 0
                        ? formatCurrency(selectedPlot.ReceivedAmount)
                        : "₹0"}
                    </p>
                  </div>
                  {selectedPlot.Status === "Tokened" &&
                    selectedPlot.TokenExpiryDate && (
                      <div>
                        <label className="block text-sm font-medium text-orange-700">
                          Token Expiry Date
                        </label>
                        <p className="mt-1 text-sm font-medium text-orange-900">
                          {formatDate(selectedPlot.TokenExpiryDate)}
                        </p>
                      </div>
                    )}
                  {(selectedPlot.TotalPaid > 0 ||
                    selectedPlot.RemainingBalance > 0) && (
                    <>
                      <div>
                        <label
                          className={`block text-sm font-medium ${
                            selectedPlot.Status === "Tokened"
                              ? "text-orange-700"
                              : selectedPlot.Status === "Booked"
                              ? "text-yellow-700"
                              : "text-blue-700"
                          }`}
                        >
                          Total Paid
                        </label>
                        <p
                          className={`mt-1 text-sm font-medium ${
                            selectedPlot.Status === "Tokened"
                              ? "text-orange-900"
                              : selectedPlot.Status === "Booked"
                              ? "text-yellow-900"
                              : "text-blue-900"
                          }`}
                        >
                          {formatCurrency(selectedPlot.TotalPaid || 0)}
                        </p>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${
                            selectedPlot.Status === "Tokened"
                              ? "text-orange-700"
                              : selectedPlot.Status === "Booked"
                              ? "text-yellow-700"
                              : "text-blue-700"
                          }`}
                        >
                          Remaining Balance
                        </label>
                        <p
                          className={`mt-1 text-sm ${
                            selectedPlot.Status === "Tokened"
                              ? "text-orange-900"
                              : selectedPlot.Status === "Booked"
                              ? "text-yellow-900"
                              : "text-blue-900"
                          }`}
                        >
                          {formatCurrency(selectedPlot.RemainingBalance || 0)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Plot Form */}
      <CreatePlotForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchPlots}
      />

      {/* Bulk Create Plots Form */}
      <BulkCreatePlotsForm
        isOpen={showBulkCreateForm}
        onClose={() => setShowBulkCreateForm(false)}
        onSuccess={fetchPlots}
      />

      {/* Booking Receipt Form */}
      <BookingReceiptForm
        isOpen={showBookingReceiptForm}
        onClose={() => setShowBookingReceiptForm(false)}
        plot={selectedPlotForBooking}
        onSuccess={handleBookingReceiptSuccess}
      />
    </div>
  );
};

export default Plots;

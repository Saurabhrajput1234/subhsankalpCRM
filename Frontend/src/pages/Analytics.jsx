import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  MapPin, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardAPI, receiptsAPI, plotsAPI } from "../utils/api";
import { formatCurrency, formatDate } from "../utils/helpers";
import LoadingSpinner from "../components/UI/LoadingSpinner";
// import AnalyticsDebug from "../components/Debug/AnalyticsDebug";
import toast from "react-hot-toast";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalReceipts: 0,
    totalPlots: 0,
    availablePlots: 0,
    bookedPlots: 0,
    soldPlots: 0,
    pendingApprovals: 0,
    monthlyRevenue: [],
    siteWiseStats: [],
    associatePerformance: [],
    paymentMethodStats: []
  });
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats (use main endpoint with large page size)
      const [receiptsResponse, plotsResponse] = await Promise.all([
        receiptsAPI.getReceipts({ pageSize: 100 }),
        plotsAPI.getPlots({ pageSize: 1000, page: 1 }) // Use main endpoint for all plots
      ]);

      const receipts = receiptsResponse.data.data || [];
      const plots = plotsResponse.data.data || []; // Main endpoint returns paginated data
      
      console.log('Analytics: Fetched', receipts.length, 'receipts');

      // Filter receipts by date range
      const filteredReceipts = receipts.filter(receipt => {
        try {
          const receiptDate = new Date(receipt.createdAt || receipt.date);
          const fromDate = new Date(dateRange.fromDate + 'T00:00:00');
          const toDate = new Date(dateRange.toDate + 'T23:59:59');
          
          // Debug logging
          if (receipts.indexOf(receipt) === 0) {
            console.log('Date filtering debug:', {
              receiptDate: receiptDate.toISOString(),
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
              inRange: receiptDate >= fromDate && receiptDate <= toDate
            });
          }
          
          return receiptDate >= fromDate && receiptDate <= toDate;
        } catch (error) {
          console.error('Date filtering error:', error, receipt);
          return true; // Include receipt if date parsing fails
        }
      });

      // Calculate stats with case-insensitive status check
      const approvedReceipts = filteredReceipts.filter(r => 
        r.status && r.status.toLowerCase() === 'approved'
      );
      
      console.log('Analytics Debug:', {
        totalReceipts: receipts.length,
        filteredReceipts: filteredReceipts.length,
        approvedReceipts: approvedReceipts.length,
        sampleReceipt: receipts[0],
        dateRange
      });
      
      const totalRevenue = approvedReceipts
        .reduce((sum, r) => sum + (r.totalAmount || r.amount || 0), 0);

      const totalReceipts = filteredReceipts.length;
      const totalPlots = plots.length;
      const availablePlots = plots.filter(p => p.status === 'Available').length;
      const bookedPlots = plots.filter(p => p.status === 'Booked').length;
      const soldPlots = plots.filter(p => p.status === 'Sold').length;
      const pendingApprovals = receipts.filter(r => 
        r.status && r.status.toLowerCase() === 'pending'
      ).length;

      // Monthly revenue calculation
      const monthlyRevenue = calculateMonthlyRevenue(filteredReceipts);
      
      // Site-wise statistics
      const siteWiseStats = calculateSiteWiseStats(plots, receipts);
      
      // Associate performance
      const associatePerformance = calculateAssociatePerformance(filteredReceipts);
      
      // Payment method statistics
      const paymentMethodStats = calculatePaymentMethodStats(filteredReceipts);

      setStats({
        totalRevenue,
        totalReceipts,
        totalPlots,
        availablePlots,
        bookedPlots,
        soldPlots,
        pendingApprovals,
        monthlyRevenue,
        siteWiseStats,
        associatePerformance,
        paymentMethodStats
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (receipts) => {
    const monthlyData = {};
    const approvedReceipts = receipts.filter(r => 
      r.status && r.status.toLowerCase() === 'approved'
    );
    
    approvedReceipts.forEach(receipt => {
      try {
        const receiptDate = new Date(receipt.createdAt || receipt.date);
        const month = receiptDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        monthlyData[month] = (monthlyData[month] || 0) + (receipt.totalAmount || receipt.amount || 0);
      } catch (error) {
        console.error('Error processing receipt date:', error, receipt);
      }
    });
    
    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const calculateSiteWiseStats = (plots, receipts) => {
    const siteStats = {};
    
    plots.forEach(plot => {
      if (!siteStats[plot.siteName]) {
        siteStats[plot.siteName] = {
          siteName: plot.siteName,
          totalPlots: 0,
          availablePlots: 0,
          bookedPlots: 0,
          soldPlots: 0,
          revenue: 0
        };
      }
      
      siteStats[plot.siteName].totalPlots++;
      if (plot.status === 'Available') siteStats[plot.siteName].availablePlots++;
      if (plot.status === 'Booked') siteStats[plot.siteName].bookedPlots++;
      if (plot.status === 'Sold') siteStats[plot.siteName].soldPlots++;
    });

    receipts
      .filter(r => r.status && r.status.toLowerCase() === 'approved')
      .forEach(receipt => {
        if (siteStats[receipt.siteName]) {
          siteStats[receipt.siteName].revenue += (receipt.totalAmount || receipt.amount || 0);
        }
      });

    return Object.values(siteStats);
  };

  const calculateAssociatePerformance = (receipts) => {
    const associateStats = {};
    
    receipts.forEach(receipt => {
      const associateName = receipt.createdByName || 'Unknown';
      if (!associateStats[associateName]) {
        associateStats[associateName] = {
          name: associateName,
          totalReceipts: 0,
          approvedReceipts: 0,
          totalRevenue: 0,
          conversionRate: 0
        };
      }
      
      associateStats[associateName].totalReceipts++;
      if (receipt.status && receipt.status.toLowerCase() === 'approved') {
        associateStats[associateName].approvedReceipts++;
        associateStats[associateName].totalRevenue += (receipt.totalAmount || receipt.amount || 0);
      }
    });

    return Object.values(associateStats).map(associate => ({
      ...associate,
      conversionRate: associate.totalReceipts > 0 
        ? (associate.approvedReceipts / associate.totalReceipts * 100).toFixed(1)
        : 0
    }));
  };

  const calculatePaymentMethodStats = (receipts) => {
    const paymentStats = {
      cash: 0,
      cheque: 0,
      rtgs: 0
    };

    const approvedReceipts = receipts.filter(r => 
      r.status && r.status.toLowerCase() === 'approved'
    );
    // console.log('Approved receipts for payment stats:', approvedReceipts.length);
    
    approvedReceipts.forEach(receipt => {
      const receiptAmount = receipt.totalAmount || receipt.amount || 0;
      
      // Count payment methods - a receipt can have multiple payment methods
      let hasPaymentMethod = false;
      
      if (receipt.cashChecked === true) {
        paymentStats.cash += receiptAmount;
        hasPaymentMethod = true;
      }
      if (receipt.chequeChecked === true) {
        paymentStats.cheque += receiptAmount;
        hasPaymentMethod = true;
      }
      if (receipt.rtgsChecked === true) {
        paymentStats.rtgs += receiptAmount;
        hasPaymentMethod = true;
      }
      
      // Fallback: if no payment method is specified, assume cash
      if (!hasPaymentMethod) {
        paymentStats.cash += receiptAmount;
      }
    });

    // console.log('Final payment stats:', paymentStats);

    return [
      { method: 'Cash', amount: paymentStats.cash, icon: '💵' },
      { method: 'Cheque', amount: paymentStats.cheque, icon: '📄' },
      { method: 'RTGS/NEFT/UPI', amount: paymentStats.rtgs, icon: '🏦' }
    ];
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Section - Temporarily disabled */}
      {/* <AnalyticsDebug /> */}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Business insights and performance metrics
          </p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex space-x-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
              className="input text-sm"
            />
          </div>
          <button
            onClick={() => setDateRange({
              fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
              toDate: new Date().toISOString().split('T')[0]
            })}
            className="btn-secondary text-xs px-3 py-2"
          >
            Reset
          </button>
          <button
            onClick={() => setDateRange({
              fromDate: new Date(2020, 0, 1).toISOString().split('T')[0], // Very early date
              toDate: new Date(2030, 11, 31).toISOString().split('T')[0] // Very late date
            })}
            className="btn-primary text-xs px-3 py-2"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReceipts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Plots</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plot Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Plots</p>
                <p className="text-xl font-bold text-gray-900">{stats.availablePlots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Booked Plots</p>
                <p className="text-xl font-bold text-gray-900">{stats.bookedPlots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sold Plots</p>
                <p className="text-xl font-bold text-gray-900">{stats.soldPlots}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Revenue
            </h3>
          </div>
          <div className="card-content">
            {stats.monthlyRevenue.length > 0 ? (
              <div className="space-y-3">
                {stats.monthlyRevenue.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No revenue data available</p>
                <p className="text-xs mt-1">Try adjusting the date range</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Payment Methods
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {stats.paymentMethodStats.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.method}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              {stats.paymentMethodStats.every(item => item.amount === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <p>No payment method data available</p>
                  <p className="text-xs mt-1">Check if receipts have payment methods selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Site-wise Statistics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Site-wise Performance</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Plots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.siteWiseStats.map((site, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {site.siteName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.totalPlots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {site.availablePlots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      {site.bookedPlots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {site.soldPlots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(site.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Associate Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Associate Performance</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Associate Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Receipts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.associatePerformance.map((associate, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {associate.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {associate.totalReceipts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {associate.approvedReceipts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {associate.conversionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(associate.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
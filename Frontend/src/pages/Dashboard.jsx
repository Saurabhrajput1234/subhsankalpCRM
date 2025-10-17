import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Users, 
  TrendingUp, 
  MapPin,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, receiptsAPI } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [expiringTokens, setExpiringTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'Admin') {
        const [statsResponse, expiringResponse] = await Promise.all([
          dashboardAPI.getStats(),
          receiptsAPI.getExpiringTokens(7)
        ]);
        
        setStats(statsResponse.data);
        setExpiringTokens(expiringResponse.data);
      } else if (user?.role === 'Associate') {
        const receiptsResponse = await receiptsAPI.getReceipts({ 
          page: 1, 
          pageSize: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setRecentReceipts(receiptsResponse.data.data);
      } else if (user?.role === 'Customer') {
        const receiptsResponse = await receiptsAPI.getCustomerReceipts();
        setRecentReceipts(receiptsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'primary', change }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your real estate business today.
        </p>
      </div>

      {/* Admin Dashboard */}
      {user?.role === 'Admin' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Plots"
              value={stats.plots.total}
              icon={MapPin}
              color="primary"
            />
            <StatCard
              title="Total Receipts"
              value={stats.receipts.total}
              icon={FileText}
              color="success"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.revenue.total)}
              icon={TrendingUp}
              color="warning"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.receipts.pending}
              icon={Clock}
              color="danger"
            />
          </div>

          {/* Plots Status */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              title="Available Plots"
              value={stats.plots.available}
              icon={Building2}
              color="success"
            />
            <StatCard
              title="Booked Plots"
              value={stats.plots.booked}
              icon={Clock}
              color="warning"
            />
            <StatCard
              title="Sold Plots"
              value={stats.plots.sold}
              icon={CheckCircle}
              color="primary"
            />
          </div>

          {/* Recent Activity & Expiring Tokens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Receipts */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Receipts</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {stats.recentReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{receipt.fromName}</p>
                        <p className="text-xs text-gray-500">
                          {receipt.siteName} - {receipt.plotVillaNo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(receipt.amount)}
                        </p>
                        <span className={`badge ${
                          receipt.status === 'Approved' ? 'badge-success' :
                          receipt.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {receipt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expiring Tokens */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Expiring Tokens (7 days)</h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {expiringTokens.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No tokens expiring soon
                    </p>
                  ) : (
                    expiringTokens.map((token) => (
                      <div key={token.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{token.fromName}</p>
                          <p className="text-xs text-gray-500">
                            {token.siteName} - {token.plotVillaNo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            {formatDate(token.tokenExpiryDate)}
                          </p>
                          <span className="badge badge-danger">Expiring</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Associate Dashboard */}
      {user?.role === 'Associate' && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              title="My Receipts"
              value={recentReceipts.length}
              icon={FileText}
              color="primary"
            />
            <StatCard
              title="Approved"
              value={recentReceipts.filter(r => r.status === 'Approved').length}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Pending"
              value={recentReceipts.filter(r => r.status === 'Pending').length}
              icon={Clock}
              color="warning"
            />
          </div>

          {/* Recent Receipts */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">My Recent Receipts</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {recentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{receipt.fromName}</p>
                      <p className="text-xs text-gray-500">
                        {receipt.siteName} - {receipt.plotVillaNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(receipt.amount)}
                      </p>
                      <span className={`badge ${
                        receipt.status === 'Approved' ? 'badge-success' :
                        receipt.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {receipt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Dashboard */}
      {user?.role === 'Customer' && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <StatCard
              title="My Bookings"
              value={recentReceipts.length}
              icon={Building2}
              color="primary"
            />
            <StatCard
              title="Total Paid"
              value={formatCurrency(recentReceipts.reduce((sum, r) => sum + r.amount, 0))}
              icon={CreditCard}
              color="success"
            />
          </div>

          {/* My Bookings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">My Bookings</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {recentReceipts.map((receipt) => (
                  <div key={receipt.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {receipt.siteName} - {receipt.plotVillaNo}
                      </h4>
                      <span className={`badge ${
                        receipt.status === 'Approved' ? 'badge-success' :
                        receipt.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {receipt.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Plot Size</p>
                        <p className="font-medium">{receipt.plotSize}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount Paid</p>
                        <p className="font-medium">{formatCurrency(receipt.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Booking Date</p>
                        <p className="font-medium">{formatDate(receipt.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Associate</p>
                        <p className="font-medium">{receipt.createdByName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
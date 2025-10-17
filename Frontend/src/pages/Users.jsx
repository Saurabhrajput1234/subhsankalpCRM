import React, { useState, useEffect } from "react";
import { Plus, Filter, Edit, Eye, Trash2, Users as UsersIcon, Shield, UserCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../utils/api";
import { formatDate } from "../utils/helpers";
import DataTable from "../components/UI/DataTable";
import Modal from "../components/UI/Modal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      let filteredUsers = response.data;

      // Apply filters
      if (filters.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filters.role);
      }
      if (filters.status) {
        filteredUsers = filteredUsers.filter(u => u.isActive === (filters.status === 'active'));
      }
      if (filters.searchTerm) {
        filteredUsers = filteredUsers.filter(u => 
          u.fullName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: "",
      status: "",
      searchTerm: "",
    });
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersAPI.deleteUser(userId);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Associate":
        return "bg-blue-100 text-blue-800";
      case "Customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const columns = [
    {
      key: "fullName",
      title: "Full Name",
      sortable: true,
    },
    {
      key: "email",
      title: "Email",
      sortable: true,
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      render: (value) => (
        <span className={`badge ${getRoleColor(value)}`}>{value}</span>
      ),
    },
    {
      key: "isActive",
      title: "Status",
      sortable: true,
      render: (value) => (
        <span className={`badge ${getStatusColor(value)}`}>
          {value ? "Active" : "Inactive"}
        </span>
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
              setSelectedUser(row);
              setShowUserModal(true);
            }}
            className="text-primary-600 hover:text-primary-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {user?.role === "Admin" && (
            <>
              <button
                onClick={() => handleEditUser(row)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit User"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteUser(row.id)}
                className="text-red-600 hover:text-red-900"
                title="Delete User"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleEditUser = (user) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  const handleCreateUser = () => {
    // TODO: Implement create functionality
    toast.info("Create user functionality coming soon!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system users and their permissions
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
          {user?.role === "Admin" && (
            <button
              onClick={handleCreateUser}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === "Admin").length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Associates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === "Associate").length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Users
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="input"
                  placeholder="Search by name or email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="input"
                >
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Associate">Associate</option>
                  <option value="Customer">Customer</option>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        searchable={false}
        filterable={false}
      />

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <span className={`badge ${getRoleColor(selectedUser.role)} mt-1`}>
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span className={`badge ${getStatusColor(selectedUser.isActive)} mt-1`}>
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedUser.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
import { NavLink } from "react-router-dom";
import {
  Home,
  FileText,
  MapPin,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/helpers";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["Admin", "Associate"],
    },
    {
      name: "Receipts",
      href: "/receipts",
      icon: FileText,
      roles: ["Admin", "Associate"],
    },
    {
      name: "Plots",
      href: "/plots",
      icon: MapPin,
      roles: ["Admin", "Associate"],
    },
    {
      name: "Payments",
      href: "/payments",
      icon: CreditCard,
      roles: ["Admin", "Associate"],
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["Admin"],
    },
    {
      name: "My Bookings",
      href: "/my-bookings",
      icon: Building2,
      roles: ["Customer"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
            <Building2 className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">
              Subhsankalp CRM
            </span>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

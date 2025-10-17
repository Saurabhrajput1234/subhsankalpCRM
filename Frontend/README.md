# Real Estate CRM - Frontend

A modern React application for managing real estate operations including plot management, token receipts, bookings, and customer management.

## 🚀 Features

### **Authentication & Authorization**

- Role-based login (Admin, Associate, Customer)
- JWT token-based authentication
- Protected routes based on user roles
- Customer login with Site + Plot + Password

### **Dashboard**

- **Admin Dashboard**: Complete overview with stats, recent activity, expiring tokens
- **Associate Dashboard**: Personal performance metrics and recent receipts
- **Customer Dashboard**: Booking details and payment history

### **Receipt Management**

- Create and manage token receipts
- Advanced filtering by customer name, reference, site, date range, status
- Real-time search across multiple fields
- Admin approval workflow with discount and remarks
- Receipt status tracking (Pending/Approved/Rejected)

### **Advanced Filtering System**

- **Multi-field filtering**: Customer name, reference name, site name, plot number
- **Date range filtering**: From/To dates, token expiry dates
- **Amount range filtering**: Min/Max amounts
- **Status filtering**: Pending, Approved, Rejected
- **Payment method filtering**: Cash, Cheque, NEFT/RTGS, UPI
- **Real-time search**: Global search across receipt fields

### **Data Management**

- Paginated data tables with sorting
- Export functionality (CSV)
- Responsive design for mobile and desktop
- Loading states and error handling

## 🛠️ Technology Stack

- **Framework**: React 19 with Vite
- **Routing**: React Router DOM v6
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios with interceptors
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns
- **Data Fetching**: React Query

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/         # Layout components (Sidebar, Header)
│   │   └── UI/             # Common UI components (Modal, DataTable, etc.)
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   │   ├── api.js          # API service functions
│   │   ├── auth.js         # Authentication utilities
│   │   └── helpers.js      # Helper functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── vite.config.js          # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `https://localhost:5001`

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Start development server**:

```bash
npm run dev
```

3. **Build for production**:

```bash
npm run build
```

4. **Preview production build**:

```bash
npm run preview
```

The application will be available at `http://localhost:5173`

## 🔐 Authentication

### Admin/Associate Login

- **Username**: admin
- **Password**: Admin@123

### Customer Login

- **Site Name**: Your property site name
- **Plot Number**: Your plot number
- **Password**: Format `Plot{PlotNumber}` (e.g., PlotA-101)

## 🎨 UI Components

### **Layout Components**

- **Sidebar**: Navigation with role-based menu items
- **Header**: Search bar, notifications, user profile
- **Layout**: Main layout wrapper with responsive sidebar

### **UI Components**

- **DataTable**: Advanced table with filtering, sorting, pagination
- **Modal**: Reusable modal component
- **LoadingSpinner**: Loading states
- **Form Components**: Styled form inputs and buttons

### **Styling System**

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Pre-built component classes
- **Responsive Design**: Mobile-first approach
- **Color System**: Consistent color palette for status indicators

## 📊 Features by Role

### **Admin Features**

- Complete dashboard with system statistics
- Approve/reject token receipts with discounts
- Manage all plots and users
- View analytics and reports
- Monitor expiring tokens
- Access to all system data

### **Associate Features**

- Personal dashboard with performance metrics
- Create token receipts for customers
- View own receipts and their status
- Access to available plots
- Track approval rates

### **Customer Features**

- View personal booking details
- Track payment history
- Download receipts
- View plot information
- Check booking status

## 🔍 Advanced Filtering

The application includes comprehensive filtering capabilities:

### **Receipt Filters**

- Customer name search
- Reference name filtering
- Site and plot number search
- Date range selection
- Status filtering (Pending/Approved/Rejected)
- Amount range filtering
- Payment method filtering

### **Search Features**

- Global search across multiple fields
- Real-time filtering as you type
- Clear filters functionality
- Persistent filter state

### **Data Export**

- Export filtered data to CSV
- Download receipts and reports
- Print-friendly views

## 🎯 Key Features

### **Responsive Design**

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Collapsible sidebar on mobile

### **Performance**

- Lazy loading of components
- Optimized API calls
- Efficient state management
- Fast navigation with React Router

### **User Experience**

- Intuitive navigation
- Clear visual feedback
- Loading states
- Error handling with user-friendly messages
- Toast notifications for actions

## 🔧 Configuration

### **API Configuration**

Update the API base URL in `src/utils/api.js`:

```javascript
const API_BASE_URL = "https://localhost:5001/api";
```

### **Environment Variables**

Create a `.env` file for environment-specific configuration:

```
VITE_API_BASE_URL=https://localhost:5001/api
VITE_APP_NAME=Subhsankalp CRM
```

## 🚀 Deployment

### **Build for Production**

```bash
npm run build
```

### **Deploy to Netlify/Vercel**

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables if needed

## 🔮 Future Enhancements

- **Real-time notifications** with WebSocket
- **Advanced analytics** with charts and graphs
- **Document management** for receipts and contracts
- **Payment gateway integration**
- **Mobile app** with React Native
- **Offline support** with service workers
- **Multi-language support**
- **Advanced reporting** with PDF generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**Real Estate CRM Frontend** - Built with ❤️ using React and Tailwind CSS

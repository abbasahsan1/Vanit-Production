# 🚌 VanIt - Smart Transportation Management System

A comprehensive web-based transportation management solution for educational institutions, featuring real-time GPS tracking, QR-based attendance, and multi-portal administration.

## 🌟 Features

### 👨‍🎓 Student Portal
- **QR Code Attendance**: Scan QR codes to mark attendance on buses
- **Real-time Bus Tracking**: Live GPS tracking of assigned bus routes
- **Attendance History**: View personal attendance records and statistics
- **Route Information**: Access route details, stops, and schedules
- **Emergency Alerts**: Send emergency notifications to administrators
- **Contact Support**: Direct communication with transportation department

### 👨‍✈️ Captain Portal  
- **GPS Status Management**: Start/stop ride tracking with state persistence
- **Real-time Student Count**: Live updates of students onboarded on route
- **QR Code Generation**: Generate secure QR codes for student attendance
- **Attendance Monitoring**: Track student boarding in real-time
- **Route Management**: Manage assigned routes and stops
- **Session Control**: Control boarding sessions with automatic state recovery

### 👨‍💼 Admin Portal
- **Student Management**: Complete CRUD operations for student records
- **Captain Management**: Add, update, and manage bus captains
- **Attendance Analytics**: Comprehensive attendance viewing and management
- **Real-time Dashboard**: Live statistics and system monitoring
- **Route Administration**: Create and manage bus routes and stops
- **Data Export**: Export attendance and student data
- **System Statistics**: View enrollment, attendance rates, and system metrics

## 🏗️ System Architecture

### Frontend Components
```
VanIt-Fresh/
├── src/                          # Main Student Portal
│   ├── components/
│   │   ├── LandingPage.jsx       # Homepage
│   │   ├── StudentPortal.jsx     # Student dashboard
│   │   ├── QRScanner.jsx         # QR attendance scanning
│   │   ├── StudentBusTracking.jsx # Real-time GPS tracking
│   │   ├── AttendanceHistory.jsx  # Personal attendance records
│   │   ├── CaptainPortal.jsx     # Captain dashboard
│   │   ├── CaptainGPS.jsx        # GPS management interface
│   │   └── CaptainLogin.jsx      # Captain authentication
│   └── pages/
│       └── complaints/           # Student feedback system
└── admin-portal/                 # Administrative Interface
    └── src/
        ├── components/
        │   ├── StudentList.jsx          # Student management interface
        │   ├── StudentAttendanceModal.jsx # Attendance viewing & management
        │   └── AdminApp.jsx             # Admin dashboard
        └── AdminApp.jsx
```

### Backend Services
```
vanit-backend/
├── routes/
│   ├── adminRoutes.js           # Admin API endpoints
│   ├── studentRoutes.js         # Student registration & data
│   ├── captainRoutes.js         # Captain management
│   ├── attendanceRoutes.js      # QR scanning & attendance
│   ├── busTrackingRoutes.js     # GPS tracking endpoints
│   └── authRoutes.js           # Authentication services
├── services/
│   ├── attendanceService.js     # Attendance business logic
│   ├── locationService.js       # GPS tracking services
│   └── qrCodeService.js        # QR code generation
├── models/
│   ├── Student.js              # Student data model
│   ├── Captain.js              # Captain data model
│   └── Bus.js                  # Bus tracking model
└── config/
    ├── db.js                   # MySQL database configuration
    └── redis.js                # Redis cache configuration
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern component-based UI framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first styling framework
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing
- **WebSocket Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database with Prisma ORM
- **Redis** - In-memory caching and session storage
- **Socket.io** - Real-time WebSocket communication
- **Multer** - File upload handling
- **JWT** - JSON Web Token authentication

### Database Schema
- **Students** - Registration, routes, contact information
- **Captains** - Driver profiles, certifications, assignments
- **Routes & Stops** - Transportation network mapping
- **Attendance Logs** - QR scan records with GPS coordinates
- **Boarding Sessions** - Real-time session management

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher) 
- **Redis** (v6.0 or higher)
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/abbasahsan1/VanIt.git
cd VanIt-Fresh
```

2. **Install dependencies**
```bash
# Backend dependencies
cd vanit-backend
npm install

# Frontend dependencies  
cd ..
npm install

# Admin portal dependencies
cd admin-portal
npm install
```

3. **Database Setup**
```bash
# Navigate to backend
cd ../vanit-backend

# Set up environment variables
cp env.example .env

# Configure your .env file with:
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASS=your_mysql_password
DB_NAME=vanit_transport
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

4. **Database Migration**
```bash
# Run Prisma migrations
npx prisma migrate dev
npx prisma generate
```

5. **Start the services**

**Terminal 1 - Backend Server:**
```bash
cd vanit-backend
npm start
```

**Terminal 2 - Student Portal:**
```bash
npm run dev
```

**Terminal 3 - Admin Portal:**
```bash
cd admin-portal  
npm run dev
```

### Access Points
- **Student Portal**: http://localhost:5173
- **Admin Portal**: http://localhost:5174  
- **Backend API**: http://localhost:5000

## 📱 Usage Guide

### For Students
1. **Registration**: Sign up with student details and route information
2. **QR Scanning**: Use camera to scan QR codes when boarding buses
3. **Track Bus**: View real-time location of your assigned bus
4. **View History**: Check attendance records and statistics

### For Captains  
1. **Login**: Authenticate using captain credentials
2. **Start Ride**: Begin GPS tracking and generate QR codes
3. **Monitor Boarding**: Track student attendance in real-time
4. **End Session**: Complete ride and finalize attendance

### For Administrators
1. **Dashboard**: View system statistics and real-time data
2. **Manage Students**: Add, update, or remove student records
3. **View Attendance**: Access detailed attendance logs and analytics
4. **Manage Routes**: Create and modify bus routes and stops

## 🔧 API Endpoints

### Student Management
- `GET /api/admin/students` - Retrieve all students
- `PUT /api/admin/students/:id` - Update student information
- `DELETE /api/admin/students/:id` - Remove student record

### Attendance System
- `POST /api/attendance/scan` - Process QR code scan
- `GET /api/attendance/student/:id/history` - Get student attendance
- `GET /api/admin/students/:id/attendance` - Admin attendance view
- `DELETE /api/admin/attendance/:id` - Delete attendance record

### GPS Tracking
- `POST /api/location/update` - Update bus GPS coordinates
- `GET /api/location/bus/:busId` - Get current bus location
- `GET /api/tracking/route/:routeName` - Track route buses

### Real-time Features
- `WebSocket /` - Live updates for attendance and GPS
- `Event: student_onboarded` - Student boarding notification
- `Event: attendance_update` - Real-time attendance sync
- `Event: location_update` - GPS coordinate updates

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Student, Captain, and Admin privileges  
- **Input Validation** - Comprehensive data sanitization
- **CORS Protection** - Cross-origin request security
- **Session Management** - Redis-based session storage
- **File Upload Security** - Multer with type validation

## 🧪 Testing & Development

### Sample Data
The system includes sample data for testing:
- **3 Students** with different routes and stops
- **1 Captain** with bus assignment
- **Multiple Routes** (Bahria-Islamabad, Cust-Chaklala)
- **Attendance Records** for demonstration

### Development Tools
- **Hot Reload** - Vite development server
- **Database GUI** - Prisma Studio (`npx prisma studio`)
- **API Testing** - Built-in endpoint testing
- **WebSocket Testing** - Real-time event monitoring

## 📊 System Features

### Real-time Capabilities
- **Live GPS Tracking** - WebSocket-based location updates
- **Instant Attendance** - Real-time QR scan processing  
- **Dynamic Counts** - Live student boarding statistics
- **Session Recovery** - Automatic state restoration after refresh

### Data Management
- **Comprehensive Analytics** - Attendance rates and trends
- **Export Functionality** - Data export in multiple formats
- **Audit Trails** - Complete activity logging
- **Backup Integration** - Database backup capabilities

### User Experience
- **Responsive Design** - Works on desktop and mobile
- **Progressive Loading** - Optimized performance
- **Error Handling** - Graceful error management
- **Accessibility** - WCAG compliant interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/abbasahsan1/VanIt/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Email**: Contact the development team

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Real-time WebSocket communication
- ✅ Comprehensive admin attendance management  
- ✅ GPS state persistence across page refreshes
- ✅ Unified data access between student and admin portals
- ✅ Enhanced error handling and debugging
- ✅ Route conflict resolution and API optimization

### v1.0.0
- 🎯 Basic QR attendance system
- 🎯 Student and captain portals
- 🎯 GPS tracking foundation
- 🎯 Database schema implementation

---

**Built with ❤️ for smart transportation management**

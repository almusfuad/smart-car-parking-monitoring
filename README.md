# Smart Car Parking Monitoring System

A full-stack IoT parking facility management system with real-time monitoring, analytics, and alerting capabilities.

## 🚀 Tech Stack

### Backend
- **Django 6.0** - Web framework
- **Django REST Framework** - RESTful API
- **SQLite** - Development database (time-series telemetry data)
- **Python 3.x** - Programming language

### Frontend
- **React 19.2** - UI framework
- **Vite 7.3** - Build tool & dev server
- **Tailwind CSS v4** - Styling framework
- **Recharts 3.7** - Data visualization
- **Axios 1.13.5** - HTTP client
- **React Router v7** - Client-side routing

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary/` | Overall system statistics |
| GET | `/api/dashboard/zones/` | Zones performance metrics |
| GET | `/api/dashboard/devices-heartbeat/` | Device health status |
| GET | `/api/analytics/hourly-usage/` | Hourly parking usage patterns |
| GET | `/api/analytics/occupancy-trend/` | Zone occupancy trends over time |
| GET | `/api/analytics/device-health/` | Device health metrics and power consumption |
| GET | `/api/alerts/` | List all alerts with filtering |
| GET | `/api/alerts/stats/` | Alert statistics by severity/status |
| POST | `/api/alerts/<id>/acknowledge/` | Acknowledge individual alert |
| POST | `/api/alerts/bulk-acknowledge/` | Bulk acknowledge multiple alerts |
| POST | `/api/telemetry/ingest/` | Single telemetry data ingestion |
| POST | `/api/telemetry/bulk-ingest/` | Bulk telemetry data ingestion |
| GET | `/api/live/device/<id>/` | Real-time status of specific device |
| GET | `/api/live/devices/` | Real-time status of all devices |

## 🏗️ Architecture

The application follows a **feature-based architecture** with clear separation of concerns:

```
Backend Architecture:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Views     │────▶│  Services   │────▶│   Models    │
│  (HTTP)     │     │ (Business)  │     │  (Data)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Service Layer Modules (1,313 lines)
- **common.py** - Shared utilities (power calculation, device status, health checks)
- **dashboard.py** - Dashboard business logic and aggregations
- **analytics.py** - Analytics calculations and reporting
- **alerts.py** - Alert management and acknowledgment
- **telemetry.py** - Data ingestion and validation
- **live_monitoring.py** - Real-time device status monitoring

### Frontend Structure
- **Custom Hooks** - 7 specialized hooks (useAlerts, useLiveMonitoring, useChartData, etc.)
- **Component-Based** - Reusable UI components with Tailwind CSS
- **Client-Side Routing** - React Router with 4 main pages

## 📦 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Load sample data (optional)**
   ```bash
   python manage.py loaddata fixtures/sample_data.json
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend runs at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
smart-car-parking-monitoring/
├── backend/
│   ├── manage.py
│   ├── db.sqlite3
│   ├── requirements.txt
│   ├── parking/                    # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── monitoring/                 # Main Django app
│       ├── models.py               # Data models (6 models)
│       ├── urls.py                 # URL routing (14 endpoints)
│       ├── serializers.py          # DRF serializers
│       ├── services/               # Business logic layer
│       │   ├── __init__.py         # Package exports
│       │   ├── common.py           # Shared utilities
│       │   ├── dashboard.py        # Dashboard logic
│       │   ├── analytics.py        # Analytics calculations
│       │   ├── alerts.py           # Alert management
│       │   ├── telemetry.py        # Data ingestion
│       │   └── live_monitoring.py  # Real-time monitoring
│       └── views/                  # HTTP handlers (588 lines)
│           ├── dashboard.py
│           ├── analytics.py
│           ├── alerts.py
│           ├── telemetry.py
│           └── live_monitoring.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                 # Router configuration
│       ├── main.jsx                # Application entry
│       ├── pages/                  # Page components
│       │   ├── Dashboard.jsx
│       │   ├── LiveMonitoringPage.jsx
│       │   ├── AlertsPage.jsx
│       │   └── AnalyticsPage.jsx
│       ├── components/             # Reusable UI components
│       └── hooks/                  # Custom React hooks (7 hooks)
└── README.md
```

## ✅ What's Completed

### Backend Features
- ✅ Django REST Framework API with 14 endpoints
- ✅ Feature-based service layer architecture (7 modules, 1,313 lines)
- ✅ 44% view code reduction through service extraction
- ✅ 6 data models: ParkingFacility, ParkingZone, Device, TelemetryData, ParkingLog, Alert
- ✅ Time-series telemetry data ingestion (single & bulk)
- ✅ Real-time device health monitoring
- ✅ Dashboard summary API with zone performance metrics
- ✅ Analytics engine (hourly usage, occupancy trends, device health)
- ✅ Alert system with filtering, stats, and acknowledgment
- ✅ Power consumption thresholds and auto-alerting
- ✅ Device status categorization (active, idle, offline)
- ✅ CORS configuration for frontend integration
- ✅ Input validation and error handling
- ✅ Query parameter validation with sensible defaults

### Frontend Features
- ✅ React 19.2 with modern hooks and patterns
- ✅ Vite 7.3 for fast development and builds
- ✅ Tailwind CSS v4 for responsive styling
- ✅ 4 main pages with client-side routing
- ✅ Dashboard with real-time statistics
- ✅ Live monitoring page with device status
- ✅ Analytics page with Recharts visualizations
- ✅ Alerts page with filtering and acknowledgment
- ✅ 7 custom hooks for state management
- ✅ Axios HTTP client with error handling
- ✅ Component-based architecture
- ✅ Responsive design for mobile/tablet/desktop

### Architecture & Code Quality
- ✅ Separation of concerns (views, services, models)
- ✅ DRY principle with common utilities
- ✅ Backward compatibility maintained during refactoring
- ✅ Django system check validation (0 issues)
- ✅ Comprehensive refactoring documentation
- ✅ No linting errors or import issues

**All project requirements have been successfully fulfilled.**

## 🔧 Scalability Thought Exercise

**Question**: What changes would you make if this system had 5,000 devices sending data every 10 seconds?

**Answer**:

If 5,000 devices send data every 10 seconds (~500 req/sec):

- **Asynchronous Processing**: Move ingestion to Celery + Redis/RabbitMQ (async, batch insert)
- **Time-Series Database**: Use PostgreSQL with TimescaleDB extension (hypertables for telemetry/occupancy)
- **Rate Limiting**: Add rate limiting + bulk endpoint only
- **Caching**: Cache dashboard summary (Redis, invalidate on new data)
- **Read Optimization**: Sharded DB or read replicas for dashboard queries
- **Background Tasks**: Device health/offline checks via periodic Celery beat (not per-request)
- **Event Streaming**: Kafka for extreme scale (ingestion pipeline)

## 🚀 Next with More Time

- **WebSocket Real-Time Updates** - Replace polling with push updates via Django Channels
- **Admin Panel** - Non-technical user interface for configuration and management
- **Advanced Charts** - Heatmaps, timelines, anomaly detection, comparative analytics
- **Authentication & Authorization** - JWT, role-based access control, social auth
- **Docker & Container Orchestration** - Containerization and Kubernetes deployment
# ChangeSense — Cloud Intelligence & Incident Correlation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TypeScript-339933?logo=nodedotjs&logoColor=white)](backend)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-4169E1?logo=postgresql&logoColor=white)](backend/prisma)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75C2?logo=google&logoColor=white)](backend)

ChangeSense is a modern Cloud Intelligence and Automated Incident Correlation Platform. It automatically correlates cloud infrastructure events (AWS CloudTrail, CloudWatch alarms, deployments, configuration shifts) with incidents and anomalies, providing real-time timeline visualization, blast radius mapping, and AI-driven root cause analysis powered by Google Gemini.

---

## 🚀 Key Features

- **⚡ Incident & Change Correlation Engine**: Correlates infrastructure deployments and config updates directly against active outages and performance degradations.
- **🧠 AI-Powered Root Cause Analysis (RCA)**: Deep reasoning powered by Google Gemini to analyze logs, telemetry, and CloudTrail events to recommend remediation steps.
- **🕒 Interactive Incident Timeline**: Visual timeline capturing event chronology, deployments, and alarm triggers in real time.
- **📊 Real-Time Posture & Blast Radius Dashboards**: Interactive charts and health metrics built with Recharts, Tailwind CSS, and Framer Motion.
- **☁️ Multi-Cloud Integrations**: AWS SDK v3 integration supporting CloudTrail, CloudWatch, EC2, ECS, RDS, and STS cross-account IAM role assumption.
- **🔒 Enterprise Security & RBAC**: JWT authentication (access & refresh tokens with HTTP-only cookies), password hashing with bcrypt, Helmet security headers, and rate limiting.
- **🧪 Interactive Demo Mode**: Instant synthetic incident and infrastructure event generation for sandbox testing and product demonstrations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Fetching & State**: [@tanstack/react-query](https://tanstack.com/query)
- **Visuals & Charts**: [Recharts](https://recharts.org/) + [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + TypeScript
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini API)
- **Cloud SDK**: AWS SDK v3 (`@aws-sdk/client-*`)

### DevOps & Containers
- **Containerization**: Docker & Docker Compose
- **Web Server / Reverse Proxy**: Nginx (Frontend production container)

---

## 📂 Project Structure

```text
ChangeSense--Cloud-Intelligence-Platform/
├── backend/
│   ├── prisma/             # Prisma schema & database migrations
│   ├── src/
│   │   ├── config/         # Environment & app configuration
│   │   ├── controllers/    # API request handlers
│   │   ├── db/             # Prisma client instance
│   │   ├── middleware/     # Auth, rate limiting & error handlers
│   │   ├── routes/         # Express routes (auth, changes, incidents, timeline, etc.)
│   │   ├── services/       # Core business logic, AWS SDK, & Gemini AI engine
│   │   ├── utils/          # Token, encryption, & validation helpers
│   │   ├── app.ts          # Express application setup
│   │   └── server.ts       # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client and endpoints
│   │   ├── components/     # UI components, cards, tables, modals, & shell
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom hooks (e.g. data queries, mutation hooks)
│   │   ├── pages/          # App views (Dashboard, Incidents, Timeline, Settings)
│   │   └── types/          # TypeScript interface definitions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .env.example            # Sample environment variables
├── docker-compose.yml      # Multi-container local orchestration
└── package.json            # Monorepo root scripts
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v14+) or [Docker](https://www.docker.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/JasmanCodes/ChangeSense--Cloud-Intelligence-Platform.git
cd ChangeSense--Cloud-Intelligence-Platform
```

### 2. Configure Environment Variables
Copy `.env.example` into `backend/.env` and update the values:
```bash
cp .env.example backend/.env
```

Ensure your `backend/.env` contains your PostgreSQL connection string and Gemini API key:
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/changesense?schema=public"
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Option A: Run with Docker Compose (Recommended)
Launch the database, backend, and frontend with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

---

### 4. Option B: Run Locally with npm

#### Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

#### Run Database Migrations
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Start Development Servers
From the root directory:
```bash
# Start backend (runs on http://localhost:4000)
npm run dev:backend

# Start frontend in another terminal (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & PostgreSQL connectivity status |
| `POST` | `/api/auth/register` | User registration & initial org provisioning |
| `POST` | `/api/auth/login` | User login & JWT cookie issuance |
| `GET` | `/api/dashboard/metrics` | Real-time incident counts, risk metrics, and change volume |
| `GET` | `/api/timeline` | Filterable chronological event and deployment timeline |
| `GET` | `/api/changes` | Infrastructure modifications and deployment history |
| `GET` | `/api/incidents` | Incident list with severity, blast radius, and RCA status |
| `POST` | `/api/incidents/:id/ai-rca` | Trigger Gemini AI incident root cause investigation |
| `POST` | `/api/demo/seed` | Seed sandbox with realistic multi-cloud incidents |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).

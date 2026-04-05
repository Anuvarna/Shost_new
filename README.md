# HostX — Smart Hostel Management System

A full-stack web application for managing college hostels.
Built with React + Vite (frontend) and Node.js + Express + MongoDB (backend).

---

## 🚀 Quick Start

### 1. Add MongoDB URI

Open `server/.env` and replace the MONGO_URI with your MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hostx?retryWrites=true&w=majority
JWT_SECRET=hostx_super_secret_jwt_key_2026
PORT=5000
```

### 2. Install & Run Backend

```bash
cd server
npm install
node seed.js        # Seeds test data (run once)
npm run dev         # Starts backend on port 5000
```

### 3. Install & Run Frontend

```bash
cd client
npm install
npm run dev         # Starts frontend on port 5173
```

### 4. Open Browser

Visit: http://localhost:5173

---

## 🔑 Test Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@hostx.com        | admin123   |
| Warden  | warden@hostx.com       | warden123  |
| Student | student@hostx.com      | student321 |

---

## 📁 Project Structure

```
hostx/
├── server/
│   ├── models/          # MongoDB models (User, Student, Room, etc.)
│   ├── routes/          # API routes (auth, admin, warden, student, reports)
│   ├── middleware/       # JWT auth middleware
│   ├── uploads/         # Uploaded files (complaints, notices, lostfound)
│   ├── index.js         # Main server entry
│   ├── seed.js          # Database seeder
│   └── .env             # Environment variables
└── client/
    └── src/
        ├── pages/
        │   ├── admin/   # Admin dashboard pages
        │   ├── warden/  # Warden dashboard pages
        │   └── student/ # Student dashboard pages
        ├── components/  # Shared components (Sidebar)
        └── utils/       # API utility
```

---

## ✨ Features

### Admin
- Manage hostels, wardens, students
- View dashboard stats
- Generate & export student reports (filter by year, branch, district) as PDF

### Warden
- Student management (view + edit profiles)
- Room management (add rooms, view occupancy)
- Room Allocation (Phase 1: manual for disciplinary students, Phase 2: auto FCFS + branch grouping + override)
- Daily attendance marking (grouped by room, click to toggle)
- Attendance history with progress bars
- Complaints (reply + update status)
- Notices (schedule publish/takedown, image/PDF upload)
- Lost & Found (view all)
- Movement tracking (filter by date)
- Rules (edit)
- Reports (filter by year/branch/district → export PDF)

### Student
- View profile (read-only)
- Room details + preference slip submission (3 admission numbers)
- View active notices only
- View rules
- File & track complaints (with image upload)
- Post & view Lost & Found items
- Register movement (6AM–5PM restriction)
- View own attendance history (visual grid)

---

## 🛠 Tech Stack

- **Frontend:** React 18, React Router v6, Vite, jsPDF + autotable
- **Backend:** Node.js, Express, Mongoose, JWT, Multer, Nodemailer
- **Database:** MongoDB Atlas
- **Auth:** JWT in localStorage, Bearer token

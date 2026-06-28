# 🗳️ SecureCast — Online Voting System

**SecureCast** is a secure online voting platform built with Blockchain Technology and Face Verification with Liveness Detection. It supports multiple simultaneous elections, role-based access, and a tamper-proof voting flow.

## 🏗️ Architecture

| Service | Technology | Port |
|---------|-----------|------|
| **Frontend** | React + Vite + Tailwind CSS v4 | 5173 |
| **Backend API** | Node.js + Express + MongoDB | 5000 |
| **AI Service** | Python + FastAPI + DeepFace + MediaPipe | 8000 |
| **Blockchain** | Solidity + Hardhat (Ethereum) | 8545 |
| **Database** | MongoDB | 27017 |

## 🔐 Security Features

- **AES-256** encryption for face embeddings, unique ID, mobile number
- **bcrypt** password hashing (12 salt rounds)
- **JWT** session management with expiry
- **Rate limiting** on auth and OTP endpoints
- **Blockchain** vote integrity (one vote per voter, hash-only storage)
- **Face verification** with liveness detection (blink + yaw)

## 📋 Prerequisites

1. **Node.js** v18+ — [Download](https://nodejs.org/)
2. **Python** 3.9-3.11 — [Download](https://python.org/)
3. **MongoDB** — [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
4. **Git** — [Download](https://git-scm.com/)

## 🚀 Setup Instructions

### Step 1: Clone and Install

```bash
# Navigate to the project directory
cd "d:\Final Year Project\Online Voting System"
```

### Step 2: Blockchain Setup

```bash
cd blockchain
npm install
npx hardhat compile
```

### Step 3: Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env` with your settings:
- Set `MONGODB_URI` to your MongoDB connection string
- Set `SMTP_USER` and `SMTP_PASS` for email OTP (Gmail App Password)
- `ADMIN_PRIVATE_KEY` is pre-set for Hardhat's default account

### Step 4: AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
```

### Step 5: Frontend Setup

```bash
cd frontend
npm install
```

## ▶️ Running the Application

**Open 4 terminals and run in this order:**

### Terminal 1: Blockchain Node
```bash
cd blockchain
npx hardhat node
```
> This starts a local Ethereum node at http://127.0.0.1:8545

### Terminal 2: Backend Server
```bash
cd backend
npm run dev
```
> API server at http://localhost:5000

### Terminal 3: AI Service
```bash
cd ai-service
python main.py
```
> AI service at http://localhost:8000 (Swagger docs at /docs)

### Terminal 4: Frontend
```bash
cd frontend
npm run dev
```
> Frontend at http://localhost:5173

## 👤 Creating an Admin User

After starting the backend, create an admin user via MongoDB:

```javascript
// In MongoDB shell or Compass:
db.users.updateOne(
  { email: "admin@securecast.com" },
  { $set: { role: "admin", isApproved: true, isEmailVerified: true } }
)
```

Or register normally and then update the role in the database.

## 🗳️ Voting Flow

1. **Register** → Enter details → Verify email with OTP
2. **Face Setup** → Capture face via webcam → Embedding stored (encrypted)
3. **Admin** → Creates election → Approves candidates → Deploys smart contract
4. **Vote** → Enter OTP → Pass liveness (blink + head turn) → Face verification → Select candidate → Confirm → Blockchain transaction

## 📁 Project Structure

```
├── backend/          # Node.js Express API
│   ├── config/       # DB, blockchain, env config
│   ├── controllers/  # Auth, Admin, Election, Candidate, Vote
│   ├── middleware/    # JWT auth, role check, rate limit
│   ├── models/       # Mongoose schemas (User, Election, Candidate, Vote, OTP)
│   ├── routes/       # Express route definitions
│   ├── services/     # Blockchain, encryption, email, face proxy
│   └── server.js     # Entry point
│
├── frontend/         # React + Vite + Tailwind CSS
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Navbar, OTP, Webcam, Liveness, Cards
│       ├── context/     # Auth state management
│       └── pages/       # Login, Register, Dashboard, Voting, Results
│
├── blockchain/       # Smart Contracts
│   ├── contracts/    # Election.sol
│   ├── scripts/      # Deployment scripts
│   └── test/         # Contract unit tests
│
└── ai-service/       # Python Face AI
    ├── routes/       # API endpoints
    ├── services/     # DeepFace, MediaPipe, cosine similarity
    └── utils/        # Image processing
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd blockchain
npx hardhat test
```

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

### AI Service Health
```bash
curl http://localhost:8000/health
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt |
| Database | MongoDB |
| Blockchain | Solidity 0.8.20, Hardhat, Ethers.js v6 |
| AI/ML | Python, FastAPI, DeepFace (Facenet512), MediaPipe |
| Security | AES-256, bcrypt, JWT, Rate Limiting |

## 📝 License

This project is developed as a Final Year Project for academic purposes.

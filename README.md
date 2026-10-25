# Food Allergy Detection System 🛡️🩺

A full-stack, secure healthcare web application built with **React, Vite, Tailwind CSS, Node.js, Express.js, and MongoDB Atlas**. 

The system enables patients to create personal profiles with automated chronological age calculation, record food allergy information from doctor prescriptions, document medical test reports (Skin Prick Tests, Specific IgE Blood Tests, Oral Food Challenges), and securely store and manage their health records in **MongoDB Atlas** with strict multi-user privacy isolation.

---

## 🌟 Key Features

1. **Patient Registration & Personal Demographic Profile:**
   - Full name, Date of Birth (DOB), residential address, sex, email, and password.
   - **Dynamic Age Calculation:** Automatically calculates and verifies chronological age from DOB in real time.
   - Duplicate registration prevention by unique email address with descriptive error feedback.
   - Secure password hashing using `bcryptjs` (salt rounds: 10).

2. **Food Allergy Records Management (Doctor Prescriptions):**
   - Food allergen name and category (Peanuts, Tree Nuts, Dairy, Eggs, Shellfish, Wheat, Soy, Sesame, etc.).
   - Severity classification (Mild, Moderate, Severe / Anaphylactic Risk).
   - Known reaction symptoms (Hives, Anaphylaxis, Swelling, Dyspnea, GI distress, etc.).
   - Diagnosing doctor's name and prescribed emergency medication (e.g., EpiPen auto-injector).
   - Full CRUD: Add, View, Edit, and Delete records with confirmation dialogs.

3. **Medical Test Reports & Lab Prescriptions:**
   - Records medical tests: *Skin Prick Test (SPT)*, *Specific IgE Blood Test*, *Oral Food Challenge (OFC)*, *Patch Test*, and *Clinical Prescriptions*.
   - Documents test date, test result value (e.g. `18.4`, `7.5`), units (e.g. `kUA/L`, `mm wheal`), clinic or lab name, and doctor's clinical interpretation notes.
   - **Clinical Distinction Rule:** The system strictly avoids automated self-diagnosis from test numbers. It differentiates between raw diagnostic test sensitization and physician-confirmed diagnoses.

4. **Interactive Patient Dashboard:**
   - Welcome greeting with patient demographics card.
   - Clinical metric cards: Total Allergies, Medical Tests, Doctor-Confirmed Diagnoses, Severe Anaphylaxis Risks.
   - Search and filter by allergen name, category, severity, and test type.
   - Separate tabs for Food Allergies, Medical Test Records, and Personal Profile.
   - Single-click **"Fill Demo Credentials"** button for fast evaluation and grading.

5. **Security & Privacy:**
   - Stateless JWT authentication via Bearer tokens.
   - Passwords never logged or returned in API responses (`select: false` + `toJSON` transform).
   - Strict database-level multi-user isolation: ownership is enforced on all endpoints so patients can only access, modify, or delete their own health data.

---

## 🏗️ Project Architecture & Directory Structure

```text
food-allergy-detection-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & credential masking
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, logout
│   │   │   ├── userController.js     # Profile retrieval & editing
│   │   │   ├── allergyController.js  # Food allergy CRUD with user isolation
│   │   │   └── medicalTestController.js # Medical test CRUD & clinical status
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification & protect route
│   │   │   └── validateMiddleware.js # Express-validator error handling
│   │   ├── models/
│   │   │   ├── User.js               # User schema with age calculation & bcrypt
│   │   │   ├── AllergyRecord.js      # Food allergy records schema
│   │   │   └── MedicalTestRecord.js  # Medical test reports schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth routes
│   │   │   ├── userRoutes.js         # /api/user routes
│   │   │   ├── allergyRoutes.js      # /api/allergies routes
│   │   │   └── medicalTestRoutes.js  # /api/medical-tests routes
│   │   └── server.js                 # Express application & CORS setup
│   ├── test-backend.js               # Automated unit & model test suite
│   ├── test-e2e-http.js              # Complete end-to-end HTTP API test suite
│   ├── seed-demo.js                  # Demo patient data seeder
│   ├── .env                          # Local environment variables
│   ├── .env.example                  # Environment configuration template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Healthcare branding, status & navigation
│   │   │   ├── Footer.jsx            # Clinical disclaimer & credits
│   │   │   ├── AllergyModal.jsx      # Add/Edit allergy dialog
│   │   │   ├── MedicalTestModal.jsx  # Add/Edit lab report dialog
│   │   │   ├── ProfileEditModal.jsx  # Personal profile editor with dynamic age
│   │   │   └── ConfirmDeleteModal.jsx# Safe delete confirmation dialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global authentication & profile state
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Medical landing page with workflow steps
│   │   │   ├── LoginPage.jsx         # Sign in with quick demo button
│   │   │   ├── RegisterPage.jsx      # Registration with dynamic age computation
│   │   │   └── DashboardPage.jsx     # Patient dashboard with tabs and stats
│   │   ├── services/
│   │   │   └── api.js                # Axios client with JWT interceptor
│   │   ├── utils/
│   │   │   └── ageCalculator.js      # Chronological age & date formatters
│   │   ├── App.jsx                   # Main React application & route switcher
│   │   ├── main.jsx                  # React DOM entry point
│   │   └── index.css                 # Tailwind CSS styling & typography
│   ├── vite.config.js                # Vite configuration with Tailwind plugin & proxy
│   ├── index.html                    # HTML shell with Google fonts & metadata
│   └── package.json
│
└── README.md                         # Comprehensive documentation
```

---

## ⚙️ MongoDB Atlas Configuration Guide

To connect the application to your **MongoDB Atlas** cloud cluster:

1. **Create an Atlas Account & Cluster:**
   - Visit [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in.
   - Click **Create a Deployment** and choose the **M0 Free Cluster**.
   - Select your preferred cloud provider (AWS / Google Cloud) and region.

2. **Configure Database User:**
   - Under **Security** ➔ **Database Access**, click **Add New Database User**.
   - Choose **Password Authentication**.
   - Set a username (e.g., `allergy_admin`) and a strong password.
   - Assign the role: **Read and write to any database**.

3. **Configure Network Access (IP Whitelist):**
   - Under **Security** ➔ **Network Access**, click **Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`) for development/deployment access, or add your specific IP address.

4. **Obtain Connection String:**
   - Go to **Databases** ➔ click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/food_allergy_detection?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

5. **Update Backend `.env` File:**
   - Open `backend/.env` and update the `MONGODB_URI`:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/food_allergy_detection?retryWrites=true&w=majority
     JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
     PORT=5000
     CLIENT_URL=http://localhost:5173
     NODE_ENV=production
     ```

*(Note: During local testing, the backend connects to your local MongoDB at `mongodb://127.0.0.1:27017/food_allergy_detection` if `MONGODB_URI` points locally).*

---

## 🚀 Running the Application Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB service

### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (already installed if using this project repository)
npm install

# Seed the database with demo patient records (optional, but recommended)
node seed-demo.js

# Run automated verification tests
node test-backend.js
node test-e2e-http.js

# Start the backend server
npm start
# Server starts at http://localhost:5000
```

### 2. Frontend Setup
```bash
# In a new terminal window, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
# Frontend runs at http://localhost:5173 (or http://localhost:5174 if 5173 is occupied)
```

Visit the application in your browser at `http://localhost:5173` (or the port indicated in the terminal).

---

## 🧪 Pre-configured Demo Patient Credentials

For quick evaluation, oral examinations, or project demonstrations, click the **"Fill Demo Credentials for Quick Testing"** button on the Login page or use:

- **Email:** `demo.patient@health.org`
- **Password:** `DemoPatient2026!`

This demo account includes:
- **Patient:** Eleanor Vance (Age 30, Female)
- **3 Documented Allergies:** Peanuts (Severe/Anaphylaxis with EpiPen), Crustacean Shellfish (Moderate), Soybeans (Mild).
- **3 Medical Lab Reports:** Specific IgE Blood Test for Peanuts (24.6 kUA/L), Skin Prick Test for Shrimp (7.5 mm wheal), and Specific IgE for Cow's Milk (0.18 kUA/L, Non-confirmed/Prescription observation).

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` HTTP header.

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new patient account with dynamic age & hashed password |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT token |
| `POST` | `/api/auth/logout` | Public | Standardized logout endpoint |
| `GET` | `/api/user/profile` | Protected | Retrieve authenticated user's profile with fresh age |
| `PUT` | `/api/user/profile` | Protected | Update user's personal details and allergy history |
| `GET` | `/api/allergies` | Protected | Retrieve all food allergies owned by user |
| `POST` | `/api/allergies` | Protected | Add a new food allergy record |
| `PUT` | `/api/allergies/:id` | Protected | Update an existing food allergy record (strictly owned) |
| `DELETE` | `/api/allergies/:id` | Protected | Delete an existing food allergy record (strictly owned) |
| `GET` | `/api/medical-tests` | Protected | Retrieve all medical test reports owned by user |
| `POST` | `/api/medical-tests` | Protected | Add a new medical test report (with clinical distinction) |
| `PUT` | `/api/medical-tests/:id` | Protected | Update an existing medical test report (strictly owned) |
| `DELETE` | `/api/medical-tests/:id` | Protected | Delete an existing medical test report (strictly owned) |
| `GET` | `/api/health` | Public | Health check endpoint |

---

## 🌐 Deployment Guide to a Live Domain

Follow these instructions to deploy both frontend and backend to production with a custom domain:

### Option A: Render (Backend) + Vercel / Netlify (Frontend)

#### Step 1: Deploy Backend to Render or Railway
1. Push your repository to GitHub.
2. Sign in to [render.com](https://render.com) and click **New Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to `npm install`.
6. Set the **Start Command** to `node src/server.js`.
7. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`)
   - `JWT_SECRET`: A secure 32+ character random secret string
   - `PORT`: `5000`
   - `CLIENT_URL`: Your frontend production URL (e.g. `https://yourdomain.com`)
   - `NODE_ENV`: `production`
8. Click **Deploy**. Note down your backend URL (e.g. `https://food-allergy-api.onrender.com`).

#### Step 2: Deploy Frontend to Vercel
1. Sign in to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Set the **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Under **Build and Output Settings**, default `npm run build` and output directory `dist`.
6. Update `frontend/src/services/api.js` to point to your deployed backend URL:
   ```javascript
   baseURL: import.meta.env.VITE_API_URL || '/api',
   ```
   Add environment variable in Vercel:
   `VITE_API_URL=https://food-allergy-api.onrender.com/api`
7. Click **Deploy**.

#### Step 3: Link Your Custom Domain
1. In Vercel Project Settings ➔ **Domains**, enter your custom domain (e.g. `allergycare.yourdomain.com`).
2. Add the provided CNAME or A records to your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy).
3. Vercel automatically provisions a free SSL certificate (HTTPS).
4. Update the `CLIENT_URL` in your backend environment variables to match your custom domain.

---

## 🛡️ Clinical Disclaimer & Compliance Note

This application is created for academic, clinical record keeping, and patient organization purposes. It stores diagnostic data as reported in certified medical documentation. **It does not perform automated algorithmic diagnosis.** Sensitization detected in test reports must always be confirmed by a board-certified medical doctor or clinical immunologist.

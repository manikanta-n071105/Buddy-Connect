# JuniorConnect - Deployment Guide (No Docker Required)

This guide provides simple, step-by-step instructions for deploying **JuniorConnect** without Docker.

---

## 🌐 Option 1: Modern Cloud Deployment (Render + Vercel + Neon/Supabase)

### Step 1: Database Setup (Free PostgreSQL)
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Copy your PostgreSQL connection URL string:
   ```text
   postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/juniorconnect?sslmode=require
   ```

---

### Step 2: Deploy Backend API to Render or Railway
1. Push your code to GitHub.
2. Sign up on [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Create a **New Web Service** and select your GitHub repository.
4. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = *(Your PostgreSQL connection string from Step 1)*
   - `JWT_ACCESS_SECRET` = `your_super_secret_access_key_2026`
   - `JWT_REFRESH_SECRET` = `your_super_secret_refresh_key_2026`
   - `CORS_ORIGIN` = `https://your-frontend-app.vercel.app`

---

### Step 3: Deploy Frontend Web App to Vercel or Netlify
1. Sign up on [Vercel.com](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-service.onrender.com/api`
5. Click **Deploy**. Your app is live!

---

## 🖥️ Option 2: Single Server / VPS / VM Deployment (PM2 + Node.js)

If deploying to a single Linux or Windows Virtual Machine:

### 1. Install Node.js and PM2
```bash
npm install -g pm2
```

### 2. Build Frontend & Backend
```bash
# Build Frontend
cd frontend
npm install
npm run build

# Build Backend
cd ../backend
npm install
npm run build
```

### 3. Configure Production Environment
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@localhost:5432/juniorconnect
JWT_ACCESS_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_super_refresh_key
CORS_ORIGIN=http://your-domain.com
```

### 4. Start Backend Server with PM2 (Auto-restart)
```bash
cd backend
pm2 start dist/server.js --name "juniorconnect-backend"
pm2 save
pm2 startup
```

---

## 🧪 Local Production Verification Test

Test production compilation locally:

```bash
# Test Backend Build
cd backend
npm run build
npm start

# Test Frontend Build
cd frontend
npm run build
npm run preview
```

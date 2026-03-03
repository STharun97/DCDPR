# Fake Product Review Detection System

An ML-powered application to detect fake product reviews.

## Manual Run Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB (Optional - App runs in No-DB mode if missing)

### 1. Backend Setup

The backend is built with FastAPI and Python.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (if not already created):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate
     ```
   - **Unix/MacOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the server:
   ```bash
   python run_backend.py
   ```
   The backend will start at `http://localhost:8002`.

### 2. Frontend Setup

The frontend is built with React.

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`.

## 3. Cloud Deployment (Global Access)

To make the app accessible from anywhere on the internet:

### Frontend (React)
- **Host on Vercel or Netlify**:
  1. Push your code to GitHub.
  2. Connect the `frontend` folder to Vercel/Netlify.
  3. Set `REACT_APP_BACKEND_URL` to your production backend URL in the dashboard environment variables.

### Backend (FastAPI)
- **Host on Render, Railway, or Heroku**:
  1. Push your code to GitHub.
  2. Create a new "Web Service" pointing to the `backend` folder.
  3. Use the start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
  4. Set `ENABLE_DB=true` and provide a `MONGO_URL` (e.g., from MongoDB Atlas) for persistent data.

---

### Troubleshooting

- **Firewall**: If you cannot access the page from your phone, ensure your PC's firewall allows inbound connections on ports `3000` and `8002`.
- **Network**: Ensure both devices are on the same Wi-Fi network.
- **Database**: If you don't have MongoDB installed, the app automatically switches to "No-DB Mode" (In-Memory Storage).
- **Port Conflicts**: If port 3000 or 8002 is in use, kill the processes using `taskkill /F /IM node.exe` or `taskkill /F /IM python.exe` (Windows).

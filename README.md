# DevSprint

host url -  https://devsprint-9jbx.onrender.com

DevSprint is a full-stack real-time interactive platform designed for developers to host live streams, share coding challenges, and engage with their audience. It leverages WebRTC (via Mediasoup) for ultra-low latency audio/video streaming and Socket.io for real-time chat and signaling.

##  Tech Stack

### Frontend (Client)
* **Framework:** React 19 (built with Vite)
* **Routing:** React Router DOM
* **Real-time Communication:** Socket.io-client, Mediasoup-client
* **Styling & Animation:** Vanilla CSS (Glassmorphism design), Framer Motion
* **Icons & Notifications:** Lucide-react, React-hot-toast
* **Media Handling:** React-player

### Backend (Server)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Real-time Engine:** Socket.io (Signaling & Chat), Mediasoup (WebRTC SFU for live video/audio)
* **Authentication:** JSON Web Tokens (JWT), bcrypt (password hashing), js-cookie
* **File Storage:** Cloudinary (Profile pictures & media uploads)

---

## 📂 Folder Structure

```text
MediaApp/
├── client/                 # React Frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components (Sidebar, Topbar, ProtectedRoute)
│   │   ├── context/        # Global State (AuthContext)
│   │   ├── pages/          # Route components (Dashboard, Login, Live Pages)
│   │   ├── providers/      # WebRTC/Socket Providers (Socket.jsx, peer.jsx)
│   │   ├── App.jsx         # Main application routing
│   │   └── main.jsx        # React entry point
│   ├── package.json        
│   └── vite.config.js      
├── server/                 # Node.js Backend
│   ├── config/             # DB & Cloudinary configurations
│   ├── controllers/        # Business logic (userController, SocketControllers)
│   ├── models/             # Mongoose DB Schemas (User, Post, Live, Comment)
│   ├── routes/             # Express API Routes
│   ├── .env                # Environment variables
│   ├── server.js           # Main Express server and Socket.io initialization
│   └── package.json        
└── package.json            # Root configuration for concurrent builds
```

---

##  Application Routes

### Frontend Routes (React Router)
* `/` - Landing Page
* `/login` - User Authentication
* `/signup` - Account Creation
* `/dashboard` - Main feed, user profile, and challenge viewing *(Protected)*
* `/createLive` - Setup page to start a new live stream *(Protected)*
* `/createLive/:roomId` - Creator's live streaming dashboard *(Protected)*
* `/live/:roomId` - Viewer's interface to watch a stream *(Protected)*
* `/challenge/:id` - Detailed view of a specific coding challenge *(Protected)*

### Backend API Routes (Express)
**User (`/api/user`)**
* `POST /login` - Authenticate user and set HTTP-only cookie
* `POST /register` - Create new user
* `GET /getData` - Fetch currently authenticated user's profile
* `POST /setProfilePic` - Upload/Update profile picture via Cloudinary

**Posts/Challenges (`/api/post`)**
* Handlers for creating, fetching, and engaging with coding challenges.

**Live Streaming (`/api/live`)**
* Handlers for managing active live sessions and room metadata.

**WebSockets (`ws://`)**
* Mediasoup signaling (creating WebRTC transports, producing/consuming video/audio)
* Real-time chat events (`send-message`, `receive-message`)
* Room management (`join-room`, `live-ended`)

---

##  Local Development Setup

1. **Install Dependencies:**
   From the root folder, run:
   ```bash
   npm install --prefix client && npm install --prefix server
   ```

2. **Environment Variables:**
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MEDIASOUP_ANNOUNCED_IP=127.0.0.1
   ```
   Create a `.env` file in the `client/` directory:
   ```env
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. **Run the Application:**
   ```bash
   npm run build  # Builds the React app
   npm start      # Starts the backend server (which serves the frontend)
   ```
   *(Alternatively, run the client and server separately for hot-reloading using `npm run dev` in the client).*

---

## 🚀 Deployment Guide

This project is built to serve the React frontend directly from the Node.js backend in production (`client/dist`). 

### 1. Database & Storage
* Set up a cluster on **MongoDB Atlas** and get your connection string.
* Set up a free account on **Cloudinary** for image uploads.

### 2. Choosing a Hosting Provider
Because this application uses **Mediasoup (WebRTC)**, it requires the server to open thousands of random UDP/TCP ports for live video streaming. 

⚠️ **IMPORTANT:** Standard "Platform as a Service" free tiers (like Render Web Services, Heroku, or Vercel) **WILL NOT WORK** for the Mediasoup video routing because they block incoming UDP traffic and only allow HTTP on port 80/443. 

**Recommended Providers (VPS):**
* **DigitalOcean** (Droplet)
* **AWS** (EC2 Instance)
* **Hetzner / Linode**

### 3. Deploying to a VPS (Ubuntu)
1. SSH into your server and install Node.js and Git.
2. Clone your repository: `git clone <your-repo-url>`
3. Navigate to the project and install dependencies: `npm run build`
4. Set up your production `.env` file. **Crucially**, set the Mediasoup IP to your server's public IP:
   ```env
   MEDIASOUP_ANNOUNCED_IP=<your_server_public_ip_address>
   NODE_ENV=production
   ```
5. Start the server using a process manager like **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server/server.js --name "devsprint"
   ```
6. (Optional but Recommended) Set up **Nginx** as a reverse proxy to route port 80 to port 3000, and secure it with an SSL certificate using Certbot.

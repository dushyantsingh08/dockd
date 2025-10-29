# File Upload & View Module (Demo)

A minimal full-stack demo to upload small files (max 10 MB), list uploaded files, and download them. Built with React (Vite) and Node/Express. Files are stored locally on disk for simplicity.

## Features
- Upload files up to 10 MB
- View uploaded files in a simple list with size and timestamp
- Download or delete individual files

## Tech
- Client: React 18 + Vite
- Server: Node.js + Express + Multer

## Project Structure
```
 dockd/
 ├─ client/         # React (Vite) frontend
 └─ server/         # Express server with upload/list/download APIs
```

## Prerequisites
- Node.js 18+

## Setup & Run
Open two terminals.

### 1) Start the server
```
cd dockd/server
npm install
npm run dev
```
Server runs at http://localhost:4000

### 2) Start the client
```
cd dockd/client
npm install
npm run dev
```
Client runs at http://localhost:5173

The client is preconfigured to call the server at http://localhost:4000. If you need to change it, set an environment variable in the client (e.g., create .env with VITE_API_BASE=http://localhost:4000) and restart the client. The app will fallback to http://localhost:4000 if the env var is not set.

## API Endpoints (Server)
- POST /api/upload — multipart form-data field: file (max 10 MB)
- GET /api/files — list metadata of uploaded files
- GET /api/files/:id — download a specific file
- DELETE /api/files/:id — delete a specific file

## Notes
- Files are saved in dockd/server/uploads/. Basic metadata is tracked in dockd/server/manifest.json.
- CORS is enabled for http://localhost:5173.
- This demo uses local disk storage. You can swap storage with providers like Firebase Storage or S3 by replacing the Multer storage and adjusting the list/download logic.

## Optional: Docker (not required)
If you want to dockerize later, create Dockerfiles in client and server or a compose setup that exposes ports 5173 and 4000.

## Screenshots (optional)
- Upload area with file input and submit button
- List of uploaded files with Download/Delete actions

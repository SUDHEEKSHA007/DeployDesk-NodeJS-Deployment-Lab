# DeployDesk — SSH & Node.js Deployment Lab

A beginner-friendly full-stack project for learning **Node.js, REST APIs, CRUD, Linux, OpenSSH, Git/GitHub, and cloud deployment**. The UI is included; the backend exposes a JSON API.

## What works

- Responsive task dashboard with search, status filtering, sorting, summary cards, and a polished task editor.
- CRUD API: create, list, update, and delete tasks.
- Health endpoint: `GET /api/health`.
- Input validation and readable API errors.
- Local JSON storage for zero-cost local practice.
- Optional MongoDB Atlas storage for durable hosted data.
- Render-ready start command: `npm start`.

> Learning honesty: this starter does **not** configure SSH on a remote server for you. SSH practice is a separate hands-on phase on an Ubuntu machine you control. Deploying to Render through GitHub is a different deployment method and does not prove that you deployed through SSH.

## Requirements

- Node.js 20 or newer
- npm (bundled with Node.js)
- VS Code or Antigravity
- Git (for GitHub deployment)

## 1. Run locally on Windows

Open PowerShell in this project folder:

```powershell
node --version
npm --version
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

Keep the terminal open while testing. Stop the server with `Ctrl+C`.

If `node` is not recognized, install the current Node.js LTS release from https://nodejs.org/, close and reopen PowerShell, then retry `node --version`.

## 2. Test the API

In a second PowerShell window:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/tasks
```

Create a task:

```powershell
$body = @{
  title = "Test my first API request"
  description = "Created from PowerShell"
  status = "todo"
  priority = "high"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/tasks -Method Post -ContentType "application/json" -Body $body
```

Try the frontend to edit, complete, search, filter, and delete tasks. Local JSON data is stored in `data/tasks.json`, created automatically on first run.

## 3. Understand the API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health status and active storage mode |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update selected fields |
| DELETE | `/api/tasks/:id` | Delete a task |

## 4. Publish to GitHub

Create an **empty** repository on GitHub (do not add a README if you already have this one), then run from this folder:

```powershell
git init
git add .
git commit -m "Build DeployDesk Node.js CRUD app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Replace the URL with your own repository URL. Never commit `.env`, private keys, passwords, or connection strings.

## 5. Deploy to Render

1. Push the project to GitHub.
2. Sign in to Render and choose **New → Web Service**.
3. Connect the repository.
4. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
5. Choose the available plan that suits your budget and check Render's current pricing before confirming.
6. Deploy, then open the Render URL. Check `https://YOUR-SERVICE.onrender.com/api/health`.

### Important: persistent data on Render

Without `MONGODB_URI`, the app uses a local JSON file. Render's ordinary service filesystem is ephemeral, so data can be lost after redeploys/restarts and each instance has its own file. For data you want to keep, create a MongoDB Atlas database and set `MONGODB_URI` in Render's Environment settings. Use a database user with a strong password, restrict network access as tightly as your setup permits, and never put the URI in source code. Check Atlas and Render pricing/limits before use.

## 6. SSH learning phase (separate from Render)

Use only an Ubuntu VM or server you own or are authorized to administer. On the client, generate a key with `ssh-keygen`; install the **public** key on your Ubuntu account using `ssh-copy-id` where available; verify login; inspect `~/.ssh` permissions; and learn to start/stop the app with Node or a process manager. Do not upload or commit your private key.

SSH key authentication means your client proves possession of a private key corresponding to a public key authorized on the server. It is not the same as GitHub login, and it is not how Render's Git-based deployment normally works.

## Troubleshooting

- **Port already in use:** stop the older Node process or set another `PORT` in `.env`.
- **Cannot connect:** confirm `npm run dev` is still running and visit `/api/health`.
- **PowerShell says scripts are disabled:** use `npm.cmd install` and `npm.cmd run dev`, or follow your local PowerShell policy rather than changing system-wide policy blindly.
- **MongoDB connection fails:** check `MONGODB_URI`, Atlas database user/password, IP/network access, and that special characters in the password are URL-encoded.
- **Changes don't appear on Render:** check the latest deploy logs and confirm the commit was pushed to the connected branch.

## Project learning milestones

1. Run the app locally and explain frontend, backend, route, and JSON.
2. Test each CRUD operation.
3. Inspect validation and health-check responses.
4. Push to GitHub and deploy to Render.
5. Add MongoDB Atlas if you want hosted persistence.
6. Practise passwordless SSH separately on an Ubuntu VM.
7. Add automated tests and a GitHub Actions workflow as a later milestone.

## Resume wording — use only after completing the relevant work

**Node.js CRUD Application & Cloud Deployment | Node.js, Express, REST API, GitHub, Render**
- Built a responsive Node.js/Express CRUD application with input validation, health checks, and a task dashboard.
- Published the source to GitHub and deployed the application to Render; configured MongoDB Atlas for persistent data if completed.
- Practised passwordless SSH on an authorized Ubuntu environment, including key management and file permissions, if completed.

Only claim the SSH and MongoDB parts after you personally complete and verify those steps.

## Live Demo

- **Frontend (Vercel):** [DeployDesk — Live on Vercel](https://deploy-desk-node-js-deployment-lab-sage.vercel.app)
- **Backend (Render):** [Render API Health Check](https://deploydesk-nodejs-deployment-lab.onrender.com/api/health)
- **Source Code (GitHub):** [GitHub Repository](https://github.com/SUDHEEKSHA007/DeployDesk-NodeJS-Deployment-Lab)

## Architecture

- **Frontend:** HTML5, CSS3, Vanilla JavaScript — deployed on [Vercel](https://vercel.com).
- **Backend:** Node.js & Express REST API with CORS support — deployed on [Render](https://render.com).
- **API Endpoints:** REST endpoints for creating, listing, updating, and deleting tasks (`/api/tasks`, `/api/health`).
- **Storage:** Local JSON storage with optional MongoDB Atlas persistence via `MONGODB_URI`.


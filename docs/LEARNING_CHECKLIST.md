# Learning checklist

## Phase 1 — Local app
- [ ] Check `node --version` and `npm --version`
- [ ] Run `npm install`
- [ ] Start with `npm run dev`
- [ ] Open `http://localhost:3000`
- [ ] Open `/api/health`
- [ ] Create, edit, complete, search, filter, and delete a task

## Phase 2 — Understand backend
- [ ] Explain frontend vs backend
- [ ] Explain GET, POST, PATCH, DELETE
- [ ] Test the API using PowerShell
- [ ] Explain HTTP 200, 201, 400, 404, and 500

## Phase 3 — GitHub and Render
- [ ] Create a GitHub repository and push the code
- [ ] Check `.env` is not tracked
- [ ] Deploy on Render and test health endpoint
- [ ] Explain Render ephemeral filesystem limitations

## Phase 4 — Database (optional)
- [ ] Review current MongoDB Atlas limits/pricing
- [ ] Configure `MONGODB_URI` safely
- [ ] Verify data persists after restart/redeploy

## Phase 5 — Passwordless SSH lab
- [ ] Identify SSH client and authorized Ubuntu server
- [ ] Generate a key pair without sharing the private key
- [ ] Install the public key
- [ ] Verify login without account password
- [ ] Check permissions and troubleshoot failures
- [ ] Run and inspect the Node.js app on the authorized machine

# Project architecture

```text
Browser
  |
  | HTML / CSS / JavaScript (public/)
  v
Express server (server.js)
  |
  +--> GET /api/health
  +--> GET /api/tasks
  +--> POST /api/tasks
  +--> PATCH /api/tasks/:id
  +--> DELETE /api/tasks/:id
  |
  +--> Local JSON file (development default)
  |
  +--> MongoDB Atlas (optional, configure MONGODB_URI)
```

## Hosting paths are different

```text
GitHub repository --Render build/deploy--> Public Render URL
```

This is a Git-based platform deployment flow, not passwordless SSH.

```text
Windows client --SSH key pair--> Authorized Ubuntu machine
                                  |
                                  +--> Node.js process
```

This is the separate SSH administration lab. Keep the private key on the client. Only the public key belongs in the Ubuntu account's `~/.ssh/authorized_keys`.

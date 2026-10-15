require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const mongoose = require("mongoose");

const fsSync = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

// CORS middleware to allow requests from frontend (e.g. Vercel)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "100kb" }));

const staticDir = fsSync.existsSync(path.join(__dirname, "public", "index.html"))
  ? path.join(__dirname, "public")
  : __dirname;
app.use(express.static(staticDir));

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }
  },
  { timestamps: true }
);
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);

let useMongo = false;
let localTasks = [];

async function readLocalTasks() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf8");
    localTasks = JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    localTasks = [
      {
        id: "demo-1",
        title: "Explore the project",
        description: "Create, edit, complete, and delete a task to try the CRUD API.",
        status: "todo",
        priority: "high",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "demo-2",
        title: "Learn the deployment flow",
        description: "Local app → GitHub → Render.",
        status: "in-progress",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    await writeLocalTasks();
  }
}

async function writeLocalTasks() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(localTasks, null, 2));
}

function validateTask(input, partial = false) {
  const errors = [];
  if (!partial || input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) errors.push("Title is required.");
    else if (input.title.trim().length > 120) errors.push("Title must be 120 characters or fewer.");
  }
  if (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500)) {
    errors.push("Description must be text with at most 500 characters.");
  }
  if (input.status !== undefined && !["todo", "in-progress", "done"].includes(input.status)) {
    errors.push("Status must be todo, in-progress, or done.");
  }
  if (input.priority !== undefined && !["low", "medium", "high"].includes(input.priority)) {
    errors.push("Priority must be low, medium, or high.");
  }
  return errors;
}

function toPublicTask(task) {
  if (useMongo) {
    const obj = task.toObject ? task.toObject() : task;
    return {
      id: String(obj._id),
      title: obj.title,
      description: obj.description || "",
      status: obj.status,
      priority: obj.priority,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt
    };
  }
  return task;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", service: "ssh-nodejs-deployment-lab", storage: useMongo ? "mongodb" : "local-json" });
});

app.get("/api/tasks", async (_req, res, next) => {
  try {
    const tasks = useMongo
      ? (await Task.find().sort({ createdAt: -1 })).map(toPublicTask)
      : [...localTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ tasks });
  } catch (error) { next(error); }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const errors = validateTask(req.body || {});
    if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
    const data = {
      title: req.body.title.trim(),
      description: (req.body.description || "").trim(),
      status: req.body.status || "todo",
      priority: req.body.priority || "medium"
    };
    if (useMongo) {
      const created = await Task.create(data);
      return res.status(201).json({ task: toPublicTask(created) });
    }
    const now = new Date().toISOString();
    const task = { id: require("crypto").randomUUID(), ...data, createdAt: now, updatedAt: now };
    localTasks.unshift(task);
    await writeLocalTasks();
    res.status(201).json({ task });
  } catch (error) { next(error); }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const errors = validateTask(req.body || {}, true);
    if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
    const allowed = ["title", "description", "status", "priority"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = typeof req.body[key] === "string" && key !== "status" && key !== "priority" ? req.body[key].trim() : req.body[key];
    }
    if (useMongo) {
      const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ error: "Task not found." });
      return res.json({ task: toPublicTask(updated) });
    }
    const index = localTasks.findIndex(task => task.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "Task not found." });
    localTasks[index] = { ...localTasks[index], ...updates, updatedAt: new Date().toISOString() };
    await writeLocalTasks();
    res.json({ task: localTasks[index] });
  } catch (error) { next(error); }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    if (useMongo) {
      const deleted = await Task.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Task not found." });
      return res.json({ message: "Task deleted.", id: req.params.id });
    }
    const index = localTasks.findIndex(task => task.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "Task not found." });
    localTasks.splice(index, 1);
    await writeLocalTasks();
    res.json({ message: "Task deleted.", id: req.params.id });
  } catch (error) { next(error); }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found." });
  const indexFile = fsSync.existsSync(path.join(__dirname, "public", "index.html"))
    ? path.join(__dirname, "public", "index.html")
    : path.join(__dirname, "index.html");
  res.sendFile(indexFile, error => { if (error) next(error); });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  const status = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  res.status(status).json({ error: status === 500 ? "Something went wrong on the server." : error.message });
});

async function start() {
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      useMongo = true;
      console.log("Connected to MongoDB.");
    } catch (error) {
      console.error("Could not connect to MongoDB. Check MONGODB_URI and network access.", error.message);
      process.exit(1);
    }
  } else {
    await readLocalTasks();
    console.log("Using local JSON storage. For durable cloud data, configure MONGODB_URI.");
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server ready on http://localhost:${PORT}`));
}

if (require.main === module) {
  start().catch(error => { console.error(error); process.exit(1); });
}

module.exports = { app, validateTask };

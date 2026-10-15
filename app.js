const taskList = document.querySelector("#taskList");
const taskDialog = document.querySelector("#taskDialog");
const taskForm = document.querySelector("#taskForm");
const toast = document.querySelector("#toast");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const sortFilter = document.querySelector("#sortFilter");
let tasks = [];
let editingId = null;
let toastTimer;

const statusLabels = { todo: "To do", "in-progress": "In progress", done: "Completed" };
const priorityLabels = { low: "Low priority", medium: "Medium priority", high: "High priority" };

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(data.details) ? ` ${data.details.join(" ")}` : "";
    throw new Error((data.error || `Request failed (${response.status}).`) + details);
  }
  return data;
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 3000);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function prettyDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function renderStats() {
  const total = tasks.length;
  const todo = tasks.filter(task => task.status === "todo").length;
  const progress = tasks.filter(task => task.status === "in-progress").length;
  const done = tasks.filter(task => task.status === "done").length;
  document.querySelector("#totalCount").textContent = total;
  document.querySelector("#todoCount").textContent = todo;
  document.querySelector("#progressCount").textContent = progress;
  document.querySelector("#doneCount").textContent = done;
  document.querySelector("#navCount").textContent = total;
  document.querySelector("#completionRate").textContent = total ? `${Math.round(done / total * 100)}%` : "0%";
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const visible = tasks.filter(task => {
    const matchesQuery = `${task.title} ${task.description}`.toLowerCase().includes(query);
    return matchesQuery && (status === "all" || task.status === status);
  });
  if (sortFilter.value === "oldest") visible.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (sortFilter.value === "priority") {
    const rank = { high: 0, medium: 1, low: 2 };
    visible.sort((a, b) => rank[a.priority] - rank[b.priority]);
  } else visible.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return visible;
}

function renderTasks() {
  renderStats();
  const visible = getVisibleTasks();
  document.querySelector("#resultsLabel").textContent = `Showing ${visible.length} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  if (!visible.length) {
    const isFiltered = searchInput.value.trim() || statusFilter.value !== "all";
    taskList.innerHTML = `<div class="empty-state"><div class="empty-icon">${isFiltered ? "⌕" : "✳"}</div><strong>${isFiltered ? "No tasks match your filters" : "Your board is ready for a first task"}</strong><span>${isFiltered ? "Try a different search or status." : "Create a task and watch it appear here."}</span></div>`;
    return;
  }
  taskList.innerHTML = visible.map(task => {
    const statusClass = task.status === "done" ? "status-done" : task.status === "in-progress" ? "status-progress" : "status-todo";
    return `<article class="task-row" data-id="${escapeHTML(task.id)}">
      <div class="task-main">
        <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" ${task.status === "done" ? "checked" : ""} data-action="complete" data-id="${escapeHTML(task.id)}" />
        <div class="task-copy">
          <div class="task-title ${task.status === "done" ? "is-done" : ""}">${escapeHTML(task.title)}</div>
          ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ""}
          <div class="task-meta"><span class="status-pill ${statusClass}">${statusLabels[task.status]}</span><span class="priority-pill priority-${task.priority}">${priorityLabels[task.priority]}</span><span class="task-date">Added ${prettyDate(task.createdAt)}</span></div>
        </div>
      </div>
      <div class="task-actions"><button class="icon-button" title="Edit task" aria-label="Edit ${escapeHTML(task.title)}" data-action="edit" data-id="${escapeHTML(task.id)}">✎</button><button class="icon-button delete" title="Delete task" aria-label="Delete ${escapeHTML(task.title)}" data-action="delete" data-id="${escapeHTML(task.id)}">⌫</button></div>
    </article>`;
  }).join("");
}

async function loadTasks() {
  try {
    const [taskData, health] = await Promise.all([api("/api/tasks"), api("/api/health")]);
    tasks = taskData.tasks;
    document.querySelector("#apiStatus").textContent = "All systems operational";
    document.querySelector("#storageMode").textContent = `Storage: ${health.storage}`;
    renderTasks();
  } catch (error) {
    taskList.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><strong>Couldn't connect to the API</strong><span>${escapeHTML(error.message)} Check the server terminal and refresh.</span></div>`;
    document.querySelector("#apiStatus").textContent = "Connection issue";
    document.querySelector("#storageMode").textContent = "Check server logs";
    showToast("Could not load tasks. Is the server running?", true);
  }
}

function openCreateDialog() {
  editingId = null;
  taskForm.reset();
  document.querySelector("#dialogEyebrow").textContent = "ADD TO YOUR WORKSPACE";
  document.querySelector("#dialogTitle").textContent = "Create a task";
  document.querySelector("#saveTaskButton").innerHTML = 'Save task <span class="button-arrow">↗</span>';
  taskDialog.showModal();
  document.querySelector("#taskTitle").focus();
}

function openEditDialog(task) {
  editingId = task.id;
  taskForm.elements.title.value = task.title;
  taskForm.elements.description.value = task.description || "";
  taskForm.elements.status.value = task.status;
  taskForm.elements.priority.value = task.priority;
  document.querySelector("#dialogEyebrow").textContent = "UPDATE YOUR WORKSPACE";
  document.querySelector("#dialogTitle").textContent = "Edit task";
  document.querySelector("#saveTaskButton").innerHTML = 'Save changes <span class="button-arrow">↗</span>';
  taskDialog.showModal();
  document.querySelector("#taskTitle").focus();
}

async function updateTask(id, changes, successMessage = "Task updated.") {
  try {
    await api(`/api/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) });
    await loadTasks();
    showToast(successMessage);
  } catch (error) { showToast(error.message, true); }
}

document.querySelector("#addTaskHero").addEventListener("click", openCreateDialog);
document.querySelector("#addTaskTop").addEventListener("click", openCreateDialog);
document.querySelector("#closeDialog").addEventListener("click", () => taskDialog.close());
document.querySelector("#cancelDialog").addEventListener("click", () => taskDialog.close());
document.querySelector("#navTasks").addEventListener("click", () => document.querySelector("#tasks").scrollIntoView({ behavior: "smooth" }));
[searchInput, statusFilter, sortFilter].forEach(element => element.addEventListener("input", renderTasks));

taskForm.addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = document.querySelector("#saveTaskButton");
  submitButton.disabled = true;
  const data = {
    title: taskForm.elements.title.value.trim(),
    description: taskForm.elements.description.value.trim(),
    status: taskForm.elements.status.value,
    priority: taskForm.elements.priority.value
  };
  try {
    await api(editingId ? `/api/tasks/${encodeURIComponent(editingId)}` : "/api/tasks", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify(data)
    });
    taskDialog.close();
    await loadTasks();
    showToast(editingId ? "Task updated successfully." : "Task created successfully.");
  } catch (error) { showToast(error.message, true); }
  finally { submitButton.disabled = false; }
});

taskList.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button || button.dataset.action === "complete") return;
  const task = tasks.find(item => item.id === button.dataset.id);
  if (!task) return;
  if (button.dataset.action === "edit") openEditDialog(task);
  if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
      await loadTasks();
      showToast("Task deleted.");
    } catch (error) { showToast(error.message, true); }
  }
});

taskList.addEventListener("change", async event => {
  const checkbox = event.target.closest('[data-action="complete"]');
  if (!checkbox) return;
  await updateTask(checkbox.dataset.id, { status: checkbox.checked ? "done" : "todo" }, checkbox.checked ? "Nice work — task completed!" : "Task moved back to To do.");
});

loadTasks();

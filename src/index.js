// ========================================
// SMART TO-DO APP - Vanilla JavaScript
// Data-first approach with LocalStorage
// ========================================

// ===== DATA (Single Source of Truth) =====
const STORAGE_KEY = "smart_todo_tasks";
let tasks = [];
let currentFilter = "all";

// ===== DOM ELEMENT CACHE =====
// We cache these on page load for performance
let elements = {};

// ===== INITIALIZATION =====
// Runs when the page loads
document.addEventListener("DOMContentLoaded", function() {
  // Cache all DOM elements we'll need
  cacheElements();

  // Load tasks from LocalStorage
  loadTasks();

  // Set up event listeners
  setupEventListeners();

  // Initial render
  render();
});

// Cache DOM elements for reuse
function cacheElements() {
  elements = {
    // Form elements
    form: document.querySelector(".task-form"),
    taskInput: document.getElementById("taskInput"),
    dueDateInput: document.getElementById("dueDateInput"),

    // Task list
    taskList: document.querySelector(".task-list"),
    emptyState: document.querySelector(".empty-state"),

    // Counter
    counterNumber: document.querySelector(".counter-number"),

    // Filter buttons
    filterButtons: document.querySelectorAll(".btn-filter"),

    // Clear completed button
    clearCompletedBtn: document.querySelector(".btn-secondary")
  };
}

// ===== LOCAL STORAGE =====

// Load tasks from LocalStorage
function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      tasks = JSON.parse(stored);
    } catch (e) {
      // If parsing fails, start with empty array
      tasks = [];
    }
  }
}

// Save tasks to LocalStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
  // Form submit - add new task
  elements.form.addEventListener("submit", handleAddTask);

  // Task list - handle checkbox toggle and delete (event delegation)
  elements.taskList.addEventListener("click", handleTaskListClick);

  // Filter buttons
  elements.filterButtons.forEach(function(button) {
    button.addEventListener("click", handleFilterClick);
  });

  // Clear completed button
  elements.clearCompletedBtn.addEventListener("click", handleClearCompleted);
}

// ===== EVENT HANDLERS =====

// Handle form submission to add a new task
function handleAddTask(event) {
  // Prevent form from reloading the page
  event.preventDefault();

  // Get input values
  const title = elements.taskInput.value.trim();
  const dueDate = elements.dueDateInput.value || null;

  // Don't add empty tasks
  if (!title) return;

  // Create new task object
  const newTask = {
    id: Date.now(),
    title: title,
    completed: false,
    dueDate: dueDate
  };

  // Add to tasks array
  tasks.push(newTask);

  // Save, render, and clear form
  saveTasks();
  render();

  // Clear the form inputs
  elements.taskInput.value = "";
  elements.dueDateInput.value = "";

  // Focus back on input for quick entry
  elements.taskInput.focus();
}

// Handle clicks on task list (event delegation)
function handleTaskListClick(event) {
  const target = event.target;

  // Find the parent task item
  const taskItem = target.closest(".task-item");
  if (!taskItem) return;

  // Get task ID from data attribute
  const taskId = parseInt(taskItem.dataset.id, 10);

  // Check if checkbox was clicked
  if (target.classList.contains("task-checkbox")) {
    toggleTask(taskId);
  }

  // Check if delete button was clicked
  if (target.classList.contains("btn-delete")) {
    deleteTask(taskId);
  }
}

// Handle filter button click
function handleFilterClick(event) {
  const button = event.target;
  const filterText = button.textContent.toLowerCase().trim();

  // Update current filter
  currentFilter = filterText;

  // Save, render
//   saveTasks();
  render();
}

// Handle clear completed button
function handleClearCompleted() {
  // Remove all completed tasks
  tasks = tasks.filter(function(task) {
    return !task.completed;
  });

  // Save and render
  saveTasks();
  render();
}

// ===== TASK OPERATIONS =====

// Toggle task completion status
function toggleTask(taskId) {
  // Find the task and toggle its completed status
  tasks = tasks.map(function(task) {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  saveTasks();
  render();
}

// Delete a task
function deleteTask(taskId) {
  tasks = tasks.filter(function(task) {
    return task.id !== taskId;
  });

  saveTasks();
  render();
}

// ===== FILTERING (Derived, not stored) =====

// Get filtered tasks based on current filter
function getFilteredTasks() {
  switch (currentFilter) {
    case "active":
      return tasks.filter(function(task) {
        return !task.completed;
      });
    case "completed":
      return tasks.filter(function(task) {
        return task.completed;
      });
    case "all":
    default:
      return tasks;
  }
}

// ===== RENDERING =====

// Main render function - calls all sub-renders
function render() {
  renderTaskList();
  renderCounter();
  renderEmptyState();
  renderFilterState();
}

// Render the task list
function renderTaskList() {
  const filteredTasks = getFilteredTasks();

  // Clear current list
  elements.taskList.innerHTML = "";

  // Create and append each task item
  filteredTasks.forEach(function(task) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    // Build the inner HTML
    let dueDateHTML = "";
    if (task.dueDate) {
      dueDateHTML = '<span class="task-due-date">Due: ' + task.dueDate + '</span>';
    }

    li.innerHTML =
      '<input type="checkbox" class="task-checkbox" id="task-' + task.id + '"' +
      (task.completed ? ' checked' : '') + '>' +
      '<label for="task-' + task.id + '" class="task-label">' +
        '<span class="task-title">' + escapeHTML(task.title) + '</span>' +
        dueDateHTML +
      '</label>' +
      '<button type="button" class="btn btn-delete">Delete</button>';

    elements.taskList.appendChild(li);
  });
}

// Render the task counter (remaining active tasks)
function renderCounter() {
  const activeTasks = tasks.filter(function(task) {
    return !task.completed;
  });
  elements.counterNumber.textContent = activeTasks.length;
}

// Show/hide empty state
function renderEmptyState() {
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    elements.emptyState.style.display = "block";

    // Update message based on filter
    const emptyText = elements.emptyState.querySelector(".empty-state-text");
    if (currentFilter === "all") {
      emptyText.textContent = "No tasks yet. Add one above!";
    } else if (currentFilter === "active") {
      emptyText.textContent = "No active tasks. Great job!";
    } else {
      emptyText.textContent = "No completed tasks yet.";
    }
  } else {
    elements.emptyState.style.display = "none";
  }
}

// Update filter button states
function renderFilterState() {
  elements.filterButtons.forEach(function(button) {
    const filterText = button.textContent.toLowerCase().trim();
    const isActive = filterText === currentFilter;

    // Update visual state
    if (isActive) {
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    }
  });
}

// ===== UTILITIES =====

// Escape HTML to prevent XSS attacks
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

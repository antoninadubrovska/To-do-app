// ========================================
// SMART TO-DO APP - Vanilla JavaScript
// Data-first approach with LocalStorage
// ========================================

// ===== DATA (Single Source of Truth) =====
const STORAGE_KEY = "smart_todo_tasks";
let tasks = [];
let currentFilter = "all";

// ===== DOM ELEMENT CACHE =====
let elements = {};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function() {
	cacheElements();
	setMinDate();
	loadTasks();
	setupEventListeners();
	render();
});

// Cache DOM elements for reuse
function cacheElements() {
	elements = {
		// Form elements
		form: document.querySelector(".task-form"),
		taskInput: document.getElementById("taskInput"),
		dueDateInput: document.getElementById("dueDateInput"),
		priorityInput: document.getElementById("priorityInput"),

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

function setMinDate() {
	const today = getTodayString();
	elements.dueDateInput.min = today;
}


// ===== LOCAL STORAGE =====

function loadTasks() {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			tasks = JSON.parse(stored);
			// Migrate old tasks without priority
			tasks = tasks.map(function(task) {
				if (!task.priority) {
					task.priority = "medium";
				}
				return task;
			});
		} catch (e) {
			tasks = [];
		}
	}
}

function saveTasks() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
	elements.form.addEventListener("submit", handleAddTask);
	elements.taskList.addEventListener("click", handleTaskListClick);

	elements.filterButtons.forEach(function(button) {
		button.addEventListener("click", handleFilterClick);
	});

	elements.clearCompletedBtn.addEventListener("click", handleClearCompleted);
}

// ===== EVENT HANDLERS =====

function handleAddTask(event) {
	event.preventDefault();

	const title = elements.taskInput.value.trim();
	const dueDate = elements.dueDateInput.value || null;
	const priority = elements.priorityInput.value || "medium";

	if (!title) return;

	const newTask = {
		id: Date.now(),
		title: title,
		completed: false,
		dueDate: dueDate,
		priority: priority
	};

	tasks.push(newTask);
	saveTasks();
	render();

	// Clear form
	elements.taskInput.value = "";
	elements.dueDateInput.value = "";
	elements.priorityInput.value = "medium";
	elements.taskInput.focus();
}

function handleTaskListClick(event) {
	const target = event.target;
	const taskItem = target.closest(".task-item");
	if (!taskItem) return;

	const taskId = parseInt(taskItem.dataset.id, 10);

	// Checkbox toggle
	if (target.classList.contains("task-checkbox")) {
		toggleTask(taskId);
	}

	// Delete button
	if (target.classList.contains("btn-delete")) {
		deleteTask(taskId);
	}

	// Edit button
	if (target.classList.contains("btn-edit")) {
		startEditTask(taskId, taskItem);
	}

	// Save edit button
	if (target.classList.contains("btn-save-edit")) {
		saveEditTask(taskId, taskItem);
	}

	// Cancel edit button
	if (target.classList.contains("btn-cancel-edit")) {
		render();
	}
}

function handleFilterClick(event) {
	const button = event.target;
	const filterText = button.textContent.toLowerCase().trim();
	currentFilter = filterText;
	render();
}

function handleClearCompleted() {
	tasks = tasks.filter(function(task) {
		return !task.completed;
	});
	saveTasks();
	render();
}

// ===== TASK OPERATIONS =====

function toggleTask(taskId) {
	tasks = tasks.map(function(task) {
		if (task.id === taskId) {
			return { ...task, completed: !task.completed };
		}
		return task;
	});
	saveTasks();
	render();
}

function deleteTask(taskId) {
	tasks = tasks.filter(function(task) {
		return task.id !== taskId;
	});
	saveTasks();
	render();
}

// ===== EDIT TASK =====

function startEditTask(taskId, taskItem) {
	const task = tasks.find(function(t) { return t.id === taskId; });
	if (!task) return;

	const taskContent = taskItem.querySelector(".task-content");
	if (!taskContent) return;

	taskContent.innerHTML =
	'<div class="edit-form">' +
	'<input type="text" class="edit-title-input" value="' + escapeAttr(task.title) + '" placeholder="Task title">' +
	'<input type="date" class="edit-date-input" value="' + (task.dueDate || '') + '">' +
	'<select class="edit-priority-input">' +
	'<option value="high"' + (task.priority === 'high' ? ' selected' : '') + '>High</option>' +
	'<option value="medium"' + (task.priority === 'medium' ? ' selected' : '') + '>Medium</option>' +
	'<option value="low"' + (task.priority === 'low' ? ' selected' : '') + '>Low</option>' +
	'</select>' +
	'<div class="edit-actions">' +
	'<button type="button" class="btn btn-save-edit">Save</button>' +
	'<button type="button" class="btn btn-cancel-edit">Cancel</button>' +
	'</div>' +
	'</div>';

	const titleInput = taskContent.querySelector(".edit-title-input");
	if (titleInput) {
		titleInput.focus();
		titleInput.select();
	}
}

function saveEditTask(taskId, taskItem) {
	const titleInput = taskItem.querySelector(".edit-title-input");
	const dateInput = taskItem.querySelector(".edit-date-input");
	const priorityInput = taskItem.querySelector(".edit-priority-input");

	const newTitle = titleInput ? titleInput.value.trim() : "";
	const newDate = dateInput ? dateInput.value || null : null;
	const newPriority = priorityInput ? priorityInput.value : "medium";

	// Don't allow empty titles
	if (!newTitle) {
		titleInput.focus();
		titleInput.classList.add("error");
		return;
	}

	tasks = tasks.map(function(task) {
		if (task.id === taskId) {
			return {
				...task,
				title: newTitle,
				dueDate: newDate,
				priority: newPriority
			};
		}
		return task;
	});

	saveTasks();
	render();
}

// ===== FILTERING =====

function getFilteredTasks() {
	const today = getTodayString();

	switch (currentFilter) {
		case "active":
		return tasks.filter(function(task) {
			return !task.completed;
		});
		case "completed":
		return tasks.filter(function(task) {
			return task.completed;
		});
		case "today":
		return tasks.filter(function(task) {
			return task.dueDate === today;
		});
		case "upcoming":
		return tasks.filter(function(task) {
			return task.dueDate && task.dueDate > today;
		});
		case "all":
		default:
		return tasks;
	}
}

// ===== RENDERING =====

function render() {
	renderTaskList();
	renderCounter();
	renderEmptyState();
	renderFilterState();
}

function renderTaskList() {
	const filteredTasks = getFilteredTasks();
	const today = getTodayString();

	elements.taskList.innerHTML = "";

	filteredTasks.forEach(function(task) {
		const li = document.createElement("li");

		// Build class list
		let classNames = "task-item";
		if (task.completed) classNames += " completed";
		if (task.priority) classNames += " " + task.priority;
		if (task.dueDate && task.dueDate < today && !task.completed) {
			classNames += " overdue";
		}

		li.className = classNames;
		li.dataset.id = task.id;

		// Build due date HTML
		let dueDateHTML = "";
		if (task.dueDate) {
			const isOverdue = task.dueDate < today && !task.completed;
			dueDateHTML = '<span class="task-due-date' + (isOverdue ? ' overdue' : '') + '">Due: ' + formatDate(task.dueDate) + '</span>';
		}

		// Build priority badge
		const priorityHTML = '<span class="task-priority priority-' + task.priority + '">' + capitalizeFirst(task.priority) + '</span>';

		li.innerHTML =
		'<input type="checkbox" class="task-checkbox" id="task-' + task.id + '"' +
		(task.completed ? ' checked' : '') + '>' +
		'<div class="task-content">' +
		'<div class="task-header">' +
		'<span class="task-title">' + escapeHTML(task.title) + '</span>' +
		priorityHTML +
		'</div>' +
		dueDateHTML +
		'</div>' +
		'<div class="task-actions">' +
		'<button type="button" class="btn btn-edit" title="Edit task">✏️</button>' +
		'<button type="button" class="btn btn-delete" title="Delete task">🗑️</button>' +
		'</div>';

		elements.taskList.appendChild(li);
	});
}

function renderCounter() {
	const activeTasks = tasks.filter(function(task) {
		return !task.completed;
	});
	elements.counterNumber.textContent = activeTasks.length;
}

function renderEmptyState() {
	const filteredTasks = getFilteredTasks();

	if (filteredTasks.length === 0) {
		elements.emptyState.style.display = "block";

		const emptyText = elements.emptyState.querySelector(".empty-state-text");
		switch (currentFilter) {
			case "all":
			emptyText.textContent = "No tasks yet. Add one above!";
			break;
			case "active":
			emptyText.textContent = "No active tasks. Great job!";
			break;
			case "completed":
			emptyText.textContent = "No completed tasks yet.";
			break;
			case "today":
			emptyText.textContent = "No tasks due today.";
			break;
			case "upcoming":
			emptyText.textContent = "No upcoming tasks.";
			break;
			default:
			emptyText.textContent = "No tasks to show.";
		}
	} else {
		elements.emptyState.style.display = "none";
	}
}

function renderFilterState() {
	elements.filterButtons.forEach(function(button) {
		const filterText = button.textContent.toLowerCase().trim();
		const isActive = filterText === currentFilter;

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

function escapeHTML(str) {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}

function escapeAttr(str) {
	return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getTodayString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return year + '-' + month + '-' + day;
}

// function formatDate(dateString) {
// 	if (!dateString) return "";
// 	const parts = dateString.split('-');
// 	if (parts.length !== 3) return dateString;
// 	return parts[1] + '/' + parts[2] + '/' + parts[0];
// }

function formatDate(dateString) {
	if (!dateString) return "";
	const [year, month, day] = dateString.split("-");
	return day + "/" + month + "/" + year;
}


function capitalizeFirst(str) {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}

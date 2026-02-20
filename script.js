let tasks = [];
let currentFilter = 'all';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
        renderTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function getFilteredTasks() {
    if (currentFilter === 'active') {
        return tasks.filter(t => !t.completed);
    }
    if (currentFilter === 'completed') {
        return tasks.filter(t => t.completed);
    }
    return tasks;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask('${task.id}')"
            >
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete" onclick="deleteTask('${task.id}')">Delete</button>
        </li>
    `).join('');

    updateStats();
}

function updateStats() {
    const activeCount = tasks.filter(t => !t.completed).length;
    const total = tasks.length;
    
    if (total === 0) {
        taskCount.textContent = 'No tasks';
    } else if (activeCount === total) {
        taskCount.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    } else {
        taskCount.textContent = `${activeCount} of ${total} active`;
    }

    const hasCompleted = tasks.some(t => t.completed);
    clearCompletedBtn.style.display = hasCompleted ? 'block' : 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
    });
});

window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

loadTasks();

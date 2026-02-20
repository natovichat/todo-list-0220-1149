let tasks = [];
let currentFilter = 'all';
let currentSort = 'created';
let searchQuery = '';
let draggedElement = null;

const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const categoryInput = document.getElementById('categoryInput');
const notesInput = document.getElementById('notesInput');
const searchInput = document.getElementById('searchInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const categoryList = document.getElementById('categoryList');

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

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        category: categoryInput.value.trim() || null,
        notes: notesInput.value.trim() || null,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    taskInput.value = '';
    dueDateInput.value = '';
    categoryInput.value = '';
    notesInput.value = '';
    prioritySelect.value = 'medium';
    
    saveTasks();
    renderTasks();
    updateCategoryList();
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
    updateCategoryList();
}

function toggleTaskNotes(id) {
    const notesElement = document.querySelector(`[data-notes-id="${id}"]`);
    if (notesElement) {
        notesElement.classList.toggle('expanded');
    }
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

function setSort(sortBy) {
    currentSort = sortBy;
    renderTasks();
}

function setSearch(query) {
    searchQuery = query.toLowerCase();
    renderTasks();
}

function getFilteredTasks() {
    let filtered = tasks;

    if (currentFilter === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'high') {
        filtered = filtered.filter(t => t.priority === 'high');
    } else if (currentFilter === 'overdue') {
        filtered = filtered.filter(t => isOverdue(t));
    }

    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.text.toLowerCase().includes(searchQuery) ||
            (t.category && t.category.toLowerCase().includes(searchQuery)) ||
            (t.notes && t.notes.toLowerCase().includes(searchQuery))
        );
    }

    return filtered;
}

function sortTasks(taskList) {
    const sorted = [...taskList];
    
    if (currentSort === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (currentSort === 'dueDate') {
        sorted.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    } else if (currentSort === 'category') {
        sorted.sort((a, b) => {
            const catA = a.category || '';
            const catB = b.category || '';
            return catA.localeCompare(catB);
        });
    } else {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return sorted;
}

function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
}

function isDueToday(task) {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
}

function formatDueDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue (${Math.abs(diffDays)} days)`;
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `Due in ${diffDays} days`;
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    const sortedTasks = sortTasks(filteredTasks);
    
    taskList.innerHTML = sortedTasks.map(task => {
        const dueDateClass = isOverdue(task) ? 'overdue' : (isDueToday(task) ? 'today' : '');
        const itemClass = isOverdue(task) && !task.completed ? 'overdue' : (isDueToday(task) && !task.completed ? 'due-today' : '');
        
        return `
        <li class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${itemClass}" 
            draggable="true" 
            data-id="${task.id}">
            <div class="task-main-row">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTask('${task.id}')"
                >
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-metadata">
                        <span class="task-priority priority-${task.priority}">
                            ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} ${task.priority.toUpperCase()}
                        </span>
                        ${task.dueDate ? `<span class="task-due-date ${dueDateClass}">📅 ${formatDueDate(task.dueDate)}</span>` : ''}
                        ${task.category ? `<span class="task-category">🏷️ ${escapeHtml(task.category)}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${task.notes ? `<button class="task-expand" onclick="toggleTaskNotes('${task.id}')">📋</button>` : ''}
                    <button class="task-delete" onclick="deleteTask('${task.id}')">🗑️</button>
                </div>
            </div>
            ${task.notes ? `<div class="task-notes" data-notes-id="${task.id}">${escapeHtml(task.notes)}</div>` : ''}
        </li>
    `}).join('');

    updateStats();
    attachDragListeners();
}

function attachDragListeners() {
    const items = document.querySelectorAll('.task-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(taskList, e.clientY);
    const dragging = document.querySelector('.dragging');
    
    if (afterElement == null) {
        taskList.appendChild(dragging);
    } else {
        taskList.insertBefore(dragging, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const allItems = [...taskList.querySelectorAll('.task-item')];
        const newOrder = allItems.map(item => item.dataset.id);
        
        const reorderedTasks = [];
        newOrder.forEach(id => {
            const task = tasks.find(t => t.id === id);
            if (task) reorderedTasks.push(task);
        });
        
        tasks = reorderedTasks;
        saveTasks();
    }
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
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

function updateCategoryList() {
    const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
    categoryList.innerHTML = categories.map(cat => `<option value="${escapeHtml(cat)}">`).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-list-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importTasks() {
    importFileInput.click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
                if (confirm(`Import ${importedTasks.length} tasks? This will replace your current tasks.`)) {
                    tasks = importedTasks;
                    saveTasks();
                    renderTasks();
                    updateCategoryList();
                }
            } else {
                alert('Invalid file format. Please upload a valid JSON file.');
            }
        } catch (error) {
            alert('Error reading file. Please upload a valid JSON file.');
        }
        importFileInput.value = '';
    };
    reader.readAsText(file);
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

searchInput.addEventListener('input', (e) => {
    setSearch(e.target.value);
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
    });
});

sortSelect.addEventListener('change', (e) => {
    setSort(e.target.value);
});

themeToggle.addEventListener('click', toggleTheme);
exportBtn.addEventListener('click', exportTasks);
importBtn.addEventListener('click', importTasks);
importFileInput.addEventListener('change', handleImport);

window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.toggleTaskNotes = toggleTaskNotes;

loadTheme();
loadTasks();
updateCategoryList();

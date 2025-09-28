let notes = [];
let currentEditId = null;

const noteForm = document.getElementById('noteForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const saveBtn = document.getElementById('saveBtn');
const archiveList = document.getElementById('archiveList');
const statusEl = document.getElementById('status');
const prioritySelect = document.getElementById('priority');

function showStatus(text, ms = 1500) {
    statusEl.textContent = text;
    statusEl.style.display = 'block';
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => statusEl.style.display = 'none', ms);
}

function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('uk-UA') + ' ' +
           d.toLocaleTimeString('uk-UA', {hour:'2-digit',minute:'2-digit'});
}

function priorityLabel(key) {
    if (key === 'important') return 'Важливий';
    if (key === 'medium') return 'Помірний';
    return 'Не важливий';
}
function priorityClass(key) {
    return key === 'important' ? 'priority-important'
         : key === 'medium'   ? 'priority-medium'
         : 'priority-low';
}

function renderNotes() {
    archiveList.innerHTML = '';

    if (!notes.length) {
        const empty = document.createElement('div');
        empty.className = 'note-card';
        empty.style.textAlign = 'center';
        empty.style.opacity = '0.6';
        empty.textContent = 'Поки що нема нотаток';
        archiveList.appendChild(empty);
        return;
    }

    const sorted = notes.slice().sort((a,b)=>(a.lastSaved||a.createdAt)-(b.lastSaved||b.createdAt));

    sorted.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.id = note.id;

        const dateEl = document.createElement('div');
        dateEl.className = 'note-date';
        dateEl.textContent = `Збережено: ${formatDate(note.lastSaved||note.createdAt)}`;

        const h3 = document.createElement('h3');
        h3.textContent = note.title || '(Без заголовка)';

        const p = document.createElement('p');
        p.textContent = note.content || '';

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const pri = document.createElement('span');
        pri.className = `priority-badge ${priorityClass(note.priority)}`;
        pri.textContent = priorityLabel(note.priority);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'small-btn restore';
        editBtn.textContent = 'Редагувати';
        editBtn.dataset.action = 'edit';
        editBtn.dataset.id = note.id;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'small-btn del';
        delBtn.textContent = 'Видалити';
        delBtn.style.hover = 'background:#c00;color:#fff';
        delBtn.dataset.action = 'delete';
        delBtn.dataset.id = note.id;

        actions.appendChild(pri);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        card.appendChild(dateEl);
        card.appendChild(h3);
        card.appendChild(p);
        card.appendChild(actions);

        archiveList.appendChild(card);
    });
}

function createNote(title, content, priority='low') {
    const ts = Date.now();
    notes.push({
        id: ts + Math.floor(Math.random()*1000),
        title, content,
        priority,
        createdAt: ts,
        lastSaved: ts
    });
    persist(); renderNotes();
    showStatus('Нотатку збережено');
}

function updateNote(id, title, content, priority) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    n.title = title;
    n.content = content;
    n.priority = priority;
    n.lastSaved = Date.now();
    persist(); renderNotes();
    showStatus('Нотатку оновлено');
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    if (currentEditId === id) resetForm();
    persist(); renderNotes();
    showStatus('Нотатку видалено');
}

function loadNoteToForm(id) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    titleInput.value = n.title;
    contentInput.value = n.content;
    prioritySelect.value = n.priority || 'low';
    currentEditId = id;
    saveBtn.textContent = 'Оновити';
}

function resetForm() {
    noteForm.reset();
    prioritySelect.value = 'low';
    currentEditId = null;
    saveBtn.textContent = 'Зберегти';
}

noteForm.addEventListener('submit', e => {
    e.preventDefault();
    const t = titleInput.value.trim();
    const c = contentInput.value.trim();
    const p = prioritySelect.value;
    if (!t && !c) { showStatus('Заповнить заголовок або текст'); return; }

    currentEditId ? updateNote(currentEditId,t,c,p)
                  : createNote(t,c,p);
    resetForm();
});

archiveList.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') loadNoteToForm(id);
    else if (btn.dataset.action === 'delete' && confirm('Видалити нотатку?')) deleteNote(id);
});

function persist(){
    localStorage.setItem('notes_v1', JSON.stringify(notes));
}
function load(){
    const raw = localStorage.getItem('notes_v1');
    if(!raw) return;
    try{
        const arr = JSON.parse(raw);
        notes = arr.map(n=>({
            ...n,
            priority: n.priority || 'low',
            createdAt: n.createdAt || n.id,
            lastSaved: n.lastSaved || n.createdAt || n.id
        }));
    }catch(e){ notes=[]; }
}

load();
renderNotes();
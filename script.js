// --- API Configuration ---
const API_URL = 'http://localhost:5000/api';

// --- State Management ---
let topicsState = [];
let activeTopicId = null;

const views = ['home', 'dashboard', 'topicDetail'];
const elements = {
    home: document.getElementById('homeView'),
    dashboard: document.getElementById('dashboardView'),
    topicDetail: document.getElementById('topicDetailView'),
    navHome: document.getElementById('navHome'),
    navDashboard: document.getElementById('navDashboard')
};

function showView(viewName) {
    views.forEach(v => elements[v].classList.add('hidden-view'));
    elements[viewName].classList.remove('hidden-view');
    
    // UI highlights
    if (elements.navHome) {
        elements.navHome.className = `text-sm md:text-base font-medium transition-colors ${viewName === 'home' ? 'text-emerald-400' : 'text-slate-400'}`;
    }

    if (viewName === 'dashboard') {
        fetchTopics(); // Refresh on visit
    }
}

// --- Topic Logic ---
const topicList = document.getElementById('topicList');
const topicInput = document.getElementById('topicInput');
const addTopicBtn = document.getElementById('addTopicBtn');

async function fetchTopics() {
    try {
        const res = await fetch(`${API_URL}/topics`);
        topicsState = await res.json();
        renderTopics();
    } catch (err) {
        console.error('Error fetching topics:', err);
    }
}

async function addTopic(name) {
    if (!name) return;
    try {
        const res = await fetch(`${API_URL}/topics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const newTopic = await res.json();
        topicsState.push(newTopic);
        renderTopics();
        topicInput.value = '';
    } catch (err) {
        console.error('Error adding topic:', err);
    }
}

function renderTopics() {
    topicList.innerHTML = '';
    topicsState.forEach(topic => {
        const el = document.createElement('div');
        el.className = 'topic-card flex items-center justify-between bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all fade-in-up';
        el.onclick = () => openTopic(topic.id);
        el.innerHTML = `
            <div class="flex flex-col">
                <span class="text-slate-200 font-medium">${topic.name}</span>
                <span class="text-xs text-slate-500">${topic.dataItems.length} entries</span>
            </div>
            <div class="flex items-center gap-3">
                <button class="text-slate-600 hover:text-red-400 transition-colors p-2" onclick="event.stopPropagation(); deleteTopic('${topic.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <span class="topic-arrow text-emerald-500 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        `;
        topicList.appendChild(el);
    });
    if (topicsState.length === 0) {
        topicList.innerHTML = `<p class="text-center py-10 text-slate-600 italic">No topics yet.</p>`;
    }
}

async function deleteTopic(id) {
    try {
        await fetch(`${API_URL}/topics/${id}`, { method: 'DELETE' });
        topicsState = topicsState.filter(t => t.id !== id);
        renderTopics();
    } catch (err) {
        console.error('Error deleting topic:', err);
    }
}

// --- Topic Detail Logic ---
const dataGrid = document.getElementById('dataGrid');
const dataNameInput = document.getElementById('dataNameInput');
const dataImageInput = document.getElementById('dataImageInput');
const addDataBtn = document.getElementById('addDataBtn');
const dataCountBadge = document.getElementById('dataCountBadge');
const dataEmptyState = document.getElementById('dataEmptyState');

function openTopic(id) {
    activeTopicId = id;
    const topic = topicsState.find(t => t.id === id);
    document.getElementById('currentTopicTitle').innerText = topic.name;
    renderTopicData();
    showView('topicDetail');
}

function renderTopicData() {
    const topic = topicsState.find(t => t.id === activeTopicId);
    dataGrid.innerHTML = '';
    
    if (topic && topic.dataItems.length > 0) {
        dataEmptyState.classList.add('hidden');
        topic.dataItems.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden fade-in-up';
            card.innerHTML = `
                <div class="h-32 w-full bg-slate-900 overflow-hidden cursor-pointer" onclick="openModal('${item.image}')">
                    <img src="${item.image}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                </div>
                <div class="p-3 flex items-center justify-between">
                    <span class="text-sm font-semibold truncate pr-2">${item.name}</span>
                    <button onclick="deleteDataItem('${item.id}', ${idx})" class="text-slate-600 hover:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
            dataGrid.appendChild(card);
        });
    } else {
        dataEmptyState.classList.remove('hidden');
    }

    const count = topic ? topic.dataItems.length : 0;
    dataCountBadge.innerText = `${count} Items`;
    renderTopics(); // Update entry count in dashboard list
}

async function deleteDataItem(dataId, index) {
    try {
        await fetch(`${API_URL}/topics/${activeTopicId}/data/${dataId}`, { method: 'DELETE' });
        const topic = topicsState.find(t => t.id === activeTopicId);
        topic.dataItems.splice(index, 1);
        renderTopicData();
    } catch (err) {
        console.error('Error deleting data item:', err);
    }
}

if (addDataBtn) {
    addDataBtn.onclick = async () => {
        const name = dataNameInput.value.trim();
        const file = dataImageInput.files[0];
        
        if (!name || !file) return;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('image', file);

        addDataBtn.disabled = true;
        addDataBtn.innerText = 'Uploading...';

        try {
            const res = await fetch(`${API_URL}/topics/${activeTopicId}/data`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to upload');

            const newItem = await res.json();
            
            const topic = topicsState.find(t => t.id === activeTopicId);
            topic.dataItems.push(newItem);
            
            dataNameInput.value = '';
            dataImageInput.value = '';
            renderTopicData();
        } catch (err) {
            console.error('Error adding data:', err);
            alert('Failed to upload image. Make sure the server is running!');
        } finally {
            addDataBtn.disabled = false;
            addDataBtn.innerText = 'Upload Data';
        }
    };
}

// --- Init ---
if (addTopicBtn) {
    addTopicBtn.onclick = () => addTopic(topicInput.value.trim());
}
if (topicInput) {
    topicInput.onkeypress = (e) => {
        if (e.key === 'Enter') addTopic(topicInput.value.trim());
    };
}

window.onload = () => {
    fetchTopics();
    if (document.getElementById('gridCanvas')) {
        animate();
    }
    showView('home');
};

// --- Canvas Animation ---
const canvas = document.getElementById('gridCanvas');
let ctx;
if (canvas) {
    ctx = canvas.getContext('2d');
}
let mouse = { x: -1000, y: -1000 };

function resize() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

resize();

class Line {
    constructor() { this.reset(); }
    reset() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = Math.random() * 1.5 + 0.5;
        this.length = Math.random() * 150 + 50;
        this.direction = Math.random() > 0.5 ? 'h' : 'v';
        this.velocity = Math.random() > 0.5 ? 1 : -1;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
        this.width = Math.random() * 1.5 + 0.5;
    }
    draw() {
        if (!ctx) return;
        const fade = 1 - (this.life / this.maxLife);
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const mouseEffect = Math.max(0, 1 - dist / 300);
        ctx.beginPath();
        const alpha = this.opacity * fade * (1 + mouseEffect);
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.lineWidth = this.width + (mouseEffect * 1);
        if (this.direction === 'h') {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + (this.length * this.velocity), this.y);
        } else {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + (this.length * this.velocity));
        }
        ctx.stroke();
    }
    update() {
        if (!canvas) return;
        if (this.direction === 'h') this.x += this.speed * this.velocity;
        else this.y += this.speed * this.velocity;
        this.life++;
        if (this.life >= this.maxLife || this.x < -300 || this.x > canvas.width + 300 || this.y < -300 || this.y > canvas.height + 300) this.reset();
    }
}

let lines = [];
if (canvas) {
    lines = Array.from({ length: 60 }, () => new Line());
}

function drawDots() {
    if (!ctx || !canvas) return;
    const spacing = 50;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    const offsetX = (canvas.width % spacing) / 2;
    const offsetY = (canvas.height % spacing) / 2;
    for (let x = offsetX; x < canvas.width; x += spacing) {
        for (let y = offsetY; y < canvas.height; y += spacing) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150) {
                ctx.fillStyle = `rgba(16, 185, 129, ${0.4 * (1 - dist/150)})`;
                ctx.fillRect(x - 1, y - 1, 3, 3);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
            } else {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

function animate() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawDots();
    lines.forEach(line => { line.update(); line.draw(); });
    requestAnimationFrame(animate);
}

// --- Modal Logic ---
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');

function openModal(imageSrc) {
    if(!imageModal || !modalImage) return;
    modalImage.src = imageSrc;
    imageModal.classList.remove('hidden');
    // small timeout to allow display block to apply before animating opacity
    setTimeout(() => {
        imageModal.classList.remove('opacity-0');
        modalImage.classList.remove('scale-95');
    }, 10);
}

function closeModal() {
    if(!imageModal || !modalImage) return;
    imageModal.classList.add('opacity-0');
    modalImage.classList.add('scale-95');
    setTimeout(() => {
        imageModal.classList.add('hidden');
        modalImage.src = '';
    }, 300);
}

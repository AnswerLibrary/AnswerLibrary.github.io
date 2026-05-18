/**
 * AnswerLibrary Core Controller
 */

// --- Utilities ---
function showToast(message) {
    const existing = document.querySelector('.toast-popup');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-popup fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-2xl z-[100] transition-all duration-300 opacity-0 translate-y-4';
    toast.innerText = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
    });
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function copyCurrentUrl() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied successfully!");
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

document.addEventListener("DOMContentLoaded", function() {
    // 1. Theme Management
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // 2. Scroll & UI logic
    const progress = document.getElementById('scroll-progress');
    const btt = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        const winS = window.pageYOffset;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = (winS / total) * 100 + "%";
        if (btt) {
            btt.classList.toggle('opacity-100', winS > 500);
            btt.classList.toggle('visible', winS > 500);
            btt.classList.toggle('opacity-0', winS <= 500);
            btt.classList.toggle('invisible', winS <= 500);
        }
    });
    if (btt) btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. PAGE SPECIFIC: Dynamic Index (Home Page)
    const listContainer = document.getElementById('questions-list');
    if (listContainer) {
        fetch('questions.json')
            .then(res => res.json())
            .then(data => {
                listContainer.innerHTML = data.map(q => `
                    <a href="${q.url}" class="reveal group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all">
                        <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">${q.category}</span>
                        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2 mb-3 group-hover:text-indigo-600 transition-colors">${q.title}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${q.description}</p>
                    </a>
                `).join('');
                initAnimations();
            }).catch(e => console.error("Index load error:", e));
    }

    // 4. PAGE SPECIFIC: Article Features (Reading Time, Share, Suggestions)
    const content = document.getElementById('markdown-content');
    if (content) {
        // Reading Time
        const words = content.innerText.trim().split(/\s+/).length;
        const rTime = document.getElementById('reading-time');
        if (rTime) rTime.innerText = `${Math.ceil(words / 200)} min read`;

        // Share Buttons
        const share = document.getElementById('share-buttons');
        if (share) {
            share.innerHTML = `<div class="flex flex-wrap gap-4"><a href="https://wa.me/?text=${encodeURIComponent(document.title + " " + window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">📱</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">f</a><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">𝕏</a></div>`;
        }

        // Suggested Questions
        const rel = document.getElementById('related-questions');
        if (rel) {
            const cur = window.location.pathname.split("/").pop();
            fetch('questions.json').then(res => res.json()).then(data => {
                let list = data.filter(q => q.url !== cur).sort(() => 0.5 - Math.random());
                while(list.length > 0 && list.length < 4) list.push(list[0]);
                if (list.length >= 4) {
                    rel.innerHTML = `<h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Suggested for you</h4><div class="grid md:grid-cols-2 gap-4">` + 
                    list.slice(0, 4).map(q => `<a href="${q.url}" class="p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:border-indigo-500 hover:shadow-2xl transition-all flex justify-between items-center group"><span class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">${q.title}</span><svg class="shrink-0 ml-4 text-slate-200 dark:text-slate-800 group-hover:text-indigo-500" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg></a>`).join('') + `</div>`;
                    initAnimations();
                }
            }).catch(() => rel.style.display = 'none');
        }
    }
});

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('opacity-100', 'translate-y-0'); observer.unobserve(e.target); }});
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(el);
    });
}

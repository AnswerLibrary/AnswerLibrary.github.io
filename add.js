// --- Utilities ---
function copyCurrentUrl() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied successfully!");
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-2xl z-[100] transition-all duration-300 opacity-0 translate-y-4';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('opacity-100', 'translate-y-0'), 10);
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

document.addEventListener("DOMContentLoaded", function() {
    // --- Initialization & Theme ---
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    const currentPath = window.location.pathname.split("/").pop();
    const pageTitle = document.title;
    const pageUrl = window.location.href;

    // --- Reading Time ---
    const words = contentArea.innerText.trim().split(/\s+/).length;
    const time = Math.ceil(words / 200);
    const rTimeElem = document.getElementById('reading-time');
    if (rTimeElem) rTimeElem.innerText = `${time} min read`;

    // --- Scroll Logic ---
    const progress = document.getElementById('scroll-progress');
    const btt = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        const windScroll = window.pageYOffset;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = (windScroll / height) * 100 + "%";
        
        if (btt) {
            btt.classList.toggle('opacity-100', windScroll > 500);
            btt.classList.toggle('opacity-0', windScroll <= 500);
        }
    });

    if (btt) btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- Reveal Animations ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        revealObserver.observe(el);
    });

    // --- Dynamic Content Injection ---
    const shareContainer = document.getElementById('share-buttons');
    if (shareContainer) {
        shareContainer.innerHTML = `
            <div class="flex flex-wrap gap-4">
                <a href="https://wa.me/?text=${encodeURIComponent(pageTitle + " " + pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382... (your svg path)"/></svg></a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073... (your svg path)"/></svg></a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308... (your svg path)"/></svg></a>
            </div>
        `;
    }

    // --- Related Questions Section ---
    const relatedContainer = document.getElementById('related-questions');
    if (relatedContainer) {
        fetch('questions.json')
            .then(res => res.json())
            .then(data => {
                const related = data.filter(q => q.url !== currentPath).sort(() => 0.5 - Math.random()).slice(0, 4);
                if (related.length > 0) {
                    relatedContainer.innerHTML = `
                        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Suggested for you</h4>
                        <div class="grid md:grid-cols-2 gap-4">${related.map(q => `
                            <a href="${q.url}" class="p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:border-indigo-500 hover:shadow-2xl transition-all group">
                                <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">${q.category}</span>
                                <h5 class="font-bold text-slate-800 dark:text-slate-100 mt-3 mb-2 group-hover:text-indigo-600 transition-colors">${q.title}</h5>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">${q.description}</p>
                            </a>
                        `).join('')}</div>
                    `;
                }
            }).catch(err => console.error("Error loading related:", err));
    }
});

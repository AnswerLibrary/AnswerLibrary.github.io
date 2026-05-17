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
    // --- Theme Init ---
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    const contentArea = document.getElementById('main-content');
    const listElement = document.getElementById('questions-list');

    // --- Infinite Scroll Logic ---
    if (listElement) {
        let allQuestions = [];
        let displayedCount = 0;
        const step = 6;
        const sentinel = document.getElementById('scroll-sentinel');
        const spinner = document.getElementById('loading-spinner');

        function renderQuestions(items) {
            const html = items.map(q => `
                <a href="${q.url}" class="group p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                    <span class="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg mb-4 uppercase tracking-widest">${q.category}</span>
                    <h3 class="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">${q.title}</h3>
                    <p class="text-sm opacity-70 line-clamp-2">${q.description}</p>
                </a>
            `).join('');
            listElement.insertAdjacentHTML('beforeend', html);
        }

        function loadMore() {
            if (displayedCount >= allQuestions.length) return;
            spinner.classList.remove('hidden');
            
            // Artificial delay for better UX
            setTimeout(() => {
                const nextBatch = allQuestions.slice(displayedCount, displayedCount + step);
                renderQuestions(nextBatch);
                displayedCount += step;
                spinner.classList.add('hidden');
            }, 500);
        }

        fetch('questions.json')
            .then(r => r.json())
            .then(data => {
                allQuestions = data;
                loadMore();
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) loadMore();
                }, { threshold: 0.1 });
                observer.observe(sentinel);
            });
    }

    // --- Page Specific Logic (Article Pages) ---
    if (contentArea) {
        const currentPath = window.location.pathname.split("/").pop();
        const pageTitle = document.title;
        const pageUrl = window.location.href;

        // Reading Time
        const words = contentArea.innerText.trim().split(/\s+/).length;
        const rTimeElem = document.getElementById('reading-time');
        if (rTimeElem) rTimeElem.innerText = `${Math.ceil(words / 200)} min read`;

        // Scroll Progress & BTT
        const progress = document.getElementById('scroll-progress');
        const btt = document.getElementById('back-to-top');
        const headers = Array.from(contentArea.querySelectorAll('h2, h3'));
        
        window.addEventListener('scroll', () => {
            const winScroll = window.pageYOffset;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            if (progress) progress.style.width = (winScroll / height) * 100 + "%";
            
            if (btt) {
                btt.style.opacity = winScroll > 500 ? "1" : "0";
                btt.style.visibility = winScroll > 500 ? "visible" : "hidden";
            }
        });

        if (btt) btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        }
    }
});

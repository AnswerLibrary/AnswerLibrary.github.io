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
                <a href="https://wa.me/?text=${encodeURIComponent(pageTitle + " " + pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a6.57 6.57 0 0 1-3.355-.92l-.24-.143-2.492.654 1.272-2.434-.157-.257a6.62 6.62 0 0 1-1.012-3.535c0-3.666 2.98-6.645 6.642-6.645 1.77 0 3.433.69 4.683 1.944a6.57 6.57 0 0 1 1.94 4.674c.002 3.667-2.978 6.646-6.641 6.646zm6.34-11.758c-1.393-1.393-3.245-2.16-5.215-2.16-4.06 0-7.365 3.305-7.365 7.366 0 1.298.34 2.565.986 3.674l-1.05 3.84 3.926-1.031a7.35 7.35 0 0 0 3.518.896h.004c4.06 0 7.363-3.305 7.364-7.366.002-1.97-.765-3.822-2.158-5.215Z"/></svg>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
            </div>
            <button onclick="copyCurrentUrl()" class="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
                COPY DIRECT LINK
            </button>
        `;
    }
});
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

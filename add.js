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

// --- Initialization ---
document.addEventListener("DOMContentLoaded", function() {
    // 1. Theme Setup
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // 2. Reading Time (Runs after marked.js parsing)
    const markdownContent = document.getElementById('markdown-content');
    if (markdownContent) {
        const words = markdownContent.innerText.trim().split(/\s+/).length;
        const time = Math.ceil(words / 200);
        const rTimeElem = document.getElementById('reading-time');
        if (rTimeElem) rTimeElem.innerText = `${time} min read`;
    }

    // 3. Scroll Logic
    const progress = document.getElementById('scroll-progress');
    const btt = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        const windScroll = window.pageYOffset;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = (windScroll / height) * 100 + "%";
        if (btt) {
            btt.classList.toggle('opacity-100', windScroll > 500);
            btt.classList.toggle('visible', windScroll > 500);
            btt.classList.toggle('opacity-0', windScroll <= 500);
            btt.classList.toggle('invisible', windScroll <= 500);
        }
    });
    if (btt) btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // 4. Reveal Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(el);
    });

    // 5. Dynamic Content Injection
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    const currentPath = window.location.pathname.split("/").pop();

    // Share Buttons
    const shareContainer = document.getElementById('share-buttons');
    if (shareContainer) {
        shareContainer.innerHTML = `
            <div class="flex flex-wrap gap-4">
                <a href="https://wa.me/?text=${encodeURIComponent(pageTitle + " " + pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            </div>
        `;
    }

    // Ad Slot
    const adContainer = document.getElementById('ad-slot');
    if (adContainer) {
        adContainer.innerHTML = `<div class="my-10 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center"><span class="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Advertisement</span><div class="mt-4 min-h-[120px] flex items-center justify-center text-slate-300 dark:text-slate-700 font-black italic text-xl">Your ad here</div></div>`;
    }

    // Related Questions
    const relatedContainer = document.getElementById('related-questions');
    if (relatedContainer) {
        fetch('questions.json')
            .then(res => res.json())
            .then(data => {
                const related = data.filter(q => !q.url.includes(currentPath)).sort(() => 0.5 - Math.random()).slice(0, 4);
                if (related.length > 0) {
                    relatedContainer.innerHTML = `<h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Suggested for you</h4><div class="grid md:grid-cols-2 gap-4">` + 
                    related.map(q => `<a href="${q.url}" class="p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:border-indigo-500 hover:shadow-2xl transition-all flex justify-between items-center group"><span class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">${q.title}</span><svg class="text-slate-200 dark:text-slate-800 group-hover:text-indigo-500 transition-all" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg></a>`).join('') + `</div>`;
                }
            }).catch(e => console.error("Error loading suggestions:", e));
    }
});


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
        // --- Initialization ---
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
        if (rTimeElem) rTimeElem.innerText = `${time} ${'min read'}`;

        // --- Scroll Logic (Progress & Back to Top & ScrollSpy) ---
        const progress = document.getElementById('scroll-progress');
        const btt = document.getElementById('back-to-top');
        const headers = Array.from(contentArea.querySelectorAll('h2, h3'));
        
        window.addEventListener('scroll', () => {
            const windScroll = window.pageYOffset;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (windScroll / height) * 100;
            if (progress) progress.style.width = scrolled + "%";
            
            if (btt) {
                if (windScroll > 500) {
                    btt.classList.add('opacity-100', 'visible');
                    btt.classList.remove('opacity-0', 'invisible');
                } else {
                    btt.classList.remove('opacity-100', 'visible');
                    btt.classList.add('opacity-0', 'invisible');
                }
            }

            // ScrollSpy
            headers.forEach(header => {
                const top = header.offsetTop - 120;
                const bottom = top + header.offsetHeight + 500; // Large buffer for content
                const tocItem = document.querySelector(`#toc-list a[href="#${header.id}"]`);
                if (windScroll >= top && windScroll < bottom) {
                    document.querySelectorAll('#toc-list a').forEach(a => a.classList.remove('text-blue-600', 'dark:text-blue-400', 'font-black'));
                    if (tocItem) tocItem.classList.add('text-blue-600', 'dark:text-blue-400', 'font-black');
                }
            });
        });

        if (btt) btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        // --- Table of Contents Generation ---
        const tocList = document.getElementById('toc-list');
        const tocContainer = document.getElementById('toc-container');
        
        if (headers.length > 0 && tocList && tocContainer) {
            tocContainer.classList.remove('hidden');
            headers.forEach((h, index) => {
                const id = 'section-' + index;
                h.id = id;
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#' + id;
                a.className = 'hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-3 py-1 group';
                a.innerHTML = `<span class="w-2 h-2 rounded-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-blue-400 transition-colors"></span><span>${h.innerText}</span>`;
                a.onclick = (e) => {
                    e.preventDefault();
                    window.scrollTo({ top: h.offsetTop - 100, behavior: 'smooth' });
                };
                li.appendChild(a);
                tocList.appendChild(li);
            });
        }

        // --- Intersection Observer for Reveal Animations ---
        const revealOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, revealOptions);

        document.querySelectorAll('article, #related-questions a, h1, #ad-slot').forEach(el => {
            el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
            revealObserver.observe(el);
        });

        // --- Dynamic Content Injection ---
        const shareContainer = document.getElementById('share-buttons');
        if (shareContainer) {
            shareContainer.innerHTML = `
                <div class="flex flex-wrap gap-4">
                    <a href="https://wa.me/?text=${encodeURIComponent(pageTitle + " " + pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(pageUrl)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                </div>
            `;
        }

        const adContainer = document.getElementById('ad-slot');
        if (adContainer) {
            adContainer.innerHTML = `
                <div class="my-10 p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center group">
                    <span class="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">${pageTitle.length > 0 ? 'ADVERTISEMENT' : ''}</span>
                    <div class="mt-4 min-h-[120px] flex items-center justify-center text-slate-300 dark:text-slate-700 font-black italic text-xl">
                        Your ad will appear here
                    </div>
                </div>
            `;
        }

        const relatedContainer = document.getElementById('related-questions');
        if (relatedContainer) {
            fetch('questions.json')
                .then(response => response.json())
                .then(data => {
                    const related = data
                        .filter(q => !q.url.includes(currentPath))
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 4);

                    if (related.length > 0) {
                        let html = `<h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 lg:mr-2">${'Suggested for you'}</h4><div class="grid md:grid-cols-2 gap-4">`;
                        related.forEach(q => {
                            html += `
                                <a href="${q.url}" class="p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex justify-between items-center group">
                                    <span class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">${q.title}</span>
                                    <svg class="text-slate-200 dark:text-slate-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
                                </a>
                            `;
                        });
                        html += `</div>`;
                        relatedContainer.innerHTML = html;
                    }
                })
                .catch(err => console.error("Could not load related questions:", err));
        }
    });
    
/**
 * AnswerLibrary Core Controller - Scaled for 10,000+ Questions & Optimized
 */

// --- Global App State & Element Caching ---
let allQuestions = [];
let activeCategory = 'all';
let searchTerm = '';
let activeSort = 'newest';

const itemsPerPage = 15; 
let currentPage = 1;

// Cache frequent selectors to optimize DOM lookup speed
const selectors = {
    questionsList: null,
    categoriesFilter: null,
    searchDesktop: null,
    searchMobile: null,
    scrollProgress: null,
    backToTopBtn: null,
    statsCount: null
};

function initSelectors() {
    selectors.questionsList = document.getElementById('questions-list');
    selectors.categoriesFilter = document.getElementById('categories-filter');
    selectors.searchDesktop = document.getElementById('search-input');
    selectors.searchMobile = document.getElementById('search-input-mobile');
    selectors.scrollProgress = document.getElementById('scroll-progress');
    selectors.backToTopBtn = document.getElementById('back-to-top');
    selectors.statsCount = document.getElementById('stats-count');
}

// --- Utilities ---
function showToast(message) {
    const existing = document.querySelector('.toast-popup');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-popup fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xl z-[100] transition-all duration-300 opacity-0 translate-y-3 border border-slate-800 dark:border-slate-700';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Force layout reflow
    toast.offsetHeight;
    
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-3');
        toast.classList.add('opacity-100', 'translate-y-0');
    });
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-3');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

window.copyQuestionLink = function(url) {
    const fullUrl = new URL(url, window.location.href).href;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast("Link copied to clipboard");
    }).catch(() => {
        showToast("Could not copy link");
    });
};

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Debounce helper to prevent performance drops during fast typing
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Stable hashing for predictable metadata generation
function getMockStats(title = '') {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const votes = Math.abs(hash % 85) + 15; 
    const viewsNum = Math.abs(hash % 900) + 100; 
    const views = viewsNum >= 1000 ? (viewsNum / 1000).toFixed(1) + 'k' : viewsNum;
    return { votes, views };
}

// --- Dynamic Rendering Logic ---

function setupCategories(data) {
    if (!selectors.categoriesFilter) return;

    const rawCategories = data.map(q => q.category ? q.category.trim() : 'General');
    const uniqueCategories = ['all', ...new Set(rawCategories.map(c => c.toLowerCase()))];

    // Update categories inside the scrollbar container with 'shrink-0' class
    selectors.categoriesFilter.innerHTML = uniqueCategories.map(cat => {
        const isActive = cat === activeCategory.toLowerCase();
        const displayName = cat === 'all' ? 'All' : rawCategories.find(c => c.toLowerCase() === cat) || cat;

        const bgClass = isActive 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-900/50';
        
        return `
            <button 
                onclick="filterCategory('${cat}')" 
                class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 snap-start ${bgClass}">
                ${displayName}
            </button>
        `;
    }).join('');
}

window.filterCategory = function(category) {
    activeCategory = category;
    currentPage = 1;
    setupCategories(allQuestions);
    renderQuestions();
};

window.setSort = function(sortType) {
    activeSort = sortType;
    currentPage = 1;
    
    const btnNewest = document.getElementById('sort-newest');
    const btnPopular = document.getElementById('sort-popular');
    
    const activeClass = "px-3.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all border border-slate-200/40 dark:border-slate-700/40";
    const inactiveClass = "px-3.5 py-1 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all";

    if (btnNewest && btnPopular) {
        if (sortType === 'newest') {
            btnNewest.className = activeClass;
            btnPopular.className = inactiveClass;
        } else {
            btnPopular.className = activeClass;
            btnNewest.className = inactiveClass;
        }
    }
    renderQuestions();
};

function renderQuestions() {
    if (!selectors.questionsList) return;

    // Filter questions array based on search and category inputs
    const filtered = allQuestions.filter(q => {
        const titleMatch = q.title ? q.title.toLowerCase().includes(searchTerm) : false;
        const descMatch = q.description ? q.description.toLowerCase().includes(searchTerm) : false;
        const catSearchMatch = q.category ? q.category.toLowerCase().includes(searchTerm) : false;
        
        const matchesSearch = titleMatch || descMatch || catSearchMatch;
        const matchesCategory = activeCategory === 'all' || (q.category && q.category.toLowerCase() === activeCategory);
        
        return matchesSearch && matchesCategory;
    });

    // Handle popular sorting order
    if (activeSort === 'popular') {
        filtered.sort((a, b) => {
            const statsA = getMockStats(a.title);
            const statsB = getMockStats(b.title);
            return statsB.votes - statsA.votes;
        });
    }

    if (filtered.length === 0) {
        selectors.questionsList.innerHTML = `
            <div class="reveal p-12 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 w-full">
                <p class="text-xs font-medium text-slate-400 dark:text-slate-500">No matching questions found.</p>
            </div>
        `;
        removeLoadMoreButton();
        initAnimations();
        return;
    }

    const totalFiltered = filtered.length;
    const paginatedQuestions = filtered.slice(0, currentPage * itemsPerPage);

    // Render list nodes to memory chunk before printing to the DOM
    selectors.questionsList.innerHTML = paginatedQuestions.map(q => {
        const stats = getMockStats(q.title);
        const wordCount = q.description ? q.description.trim().split(/\s+/).length : 0;
        const rTime = Math.max(1, Math.ceil(wordCount / 180));

        return `
            <article class="reveal bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all flex gap-4 hover:shadow-sm">
                <div class="hidden sm:flex flex-col items-center gap-3 shrink-0 w-16 text-center text-slate-400 dark:text-slate-500">
                    <div class="flex flex-col items-center">
                        <span class="text-sm font-extrabold text-slate-700 dark:text-slate-300">${stats.votes}</span>
                        <span class="text-[9px] font-bold uppercase tracking-wider">votes</span>
                    </div>
                    <div class="flex flex-col items-center px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                        <span class="text-xs font-extrabold">1</span>
                        <span class="text-[9px] font-bold uppercase tracking-wider">answer</span>
                    </div>
                </div>

                <div class="flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100/30">
                                ${q.category || 'General'}
                            </span>
                            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">${rTime} min read</span>
                        </div>

                        <h2 class="text-base font-bold text-slate-900 dark:text-white mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <a href="${q.url}">${q.title}</a>
                        </h2>

                        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            ${q.description || ''}
                        </p>
                    </div>

                    <div class="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                        <div class="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                            <span class="font-bold text-slate-600 dark:text-slate-400">Curated Answer</span>
                            <span>•</span>
                            <span>Views: ${stats.views}</span>
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="copyQuestionLink('${q.url}')" class="w-7 h-7 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors" title="Copy Link">
                                <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    if (paginatedQuestions.length < totalFiltered) {
        setupLoadMoreButton();
    } else {
        removeLoadMoreButton();
    }

    initAnimations();
}

function setupLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    if (btn) return;

    if (!selectors.questionsList) return;

    btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'w-full py-3 mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs font-bold hover:text-indigo-600 transition-colors shadow-sm';
    btn.innerText = 'Load More Questions';
    btn.onclick = () => {
        currentPage++;
        renderQuestions();
    };
    
    selectors.questionsList.parentNode.insertBefore(btn, selectors.questionsList.nextSibling);
}

function removeLoadMoreButton() {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.remove();
}

// --- DOM Loaded Handlers ---

document.addEventListener("DOMContentLoaded", function() {
    initSelectors();

    // 1. Theme Configuration
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 2. Active Scroll Position Trackers
    window.addEventListener('scroll', () => {
        const winS = window.pageYOffset;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        
        if (selectors.scrollProgress) {
            selectors.scrollProgress.style.width = total > 0 ? (winS / total) * 100 + "%" : "0%";
        }
        
        if (selectors.backToTopBtn) {
            if (winS > 400) {
                selectors.backToTopBtn.classList.remove('opacity-0', 'invisible');
                selectors.backToTopBtn.classList.add('opacity-100', 'visible');
            } else {
                selectors.backToTopBtn.classList.remove('opacity-100', 'visible');
                selectors.backToTopBtn.classList.add('opacity-0', 'invisible');
            }
        }
    });

    if (selectors.backToTopBtn) {
        selectors.backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 3. Search Inputs Event Handling
    const handleSearchInput = debounce((e) => {
        searchTerm = e.target.value.toLowerCase();
        currentPage = 1;
        
        if (selectors.searchDesktop && e.target !== selectors.searchDesktop) selectors.searchDesktop.value = e.target.value;
        if (selectors.searchMobile && e.target !== selectors.searchMobile) selectors.searchMobile.value = e.target.value;

        renderQuestions();
    }, 200);

    if (selectors.searchDesktop) selectors.searchDesktop.addEventListener('input', handleSearchInput);
    if (selectors.searchMobile) selectors.searchMobile.addEventListener('input', handleSearchInput);

    // 4. Remote content loader init
    if (selectors.questionsList) {
        fetch('questions.json')
            .then(res => {
                if (!res.ok) throw new Error("JSON failed to fetch");
                return res.json();
            })
            .then(data => {
                allQuestions = data;
                
                if (selectors.statsCount) {
                    selectors.statsCount.innerText = data.length.toLocaleString();
                }

                setupCategories(allQuestions);
                setSort('newest'); // Trigger first compilation
            })
            .catch(e => console.error("Data load failure:", e));
    }

    // 5. Inner Article Page features (Share buttons & Suggested layout generation)
    const content = document.getElementById('markdown-content');
    if (content) {
        const words = content.innerText.trim().split(/\s+/).length;
        const rTime = document.getElementById('reading-time');
        if (rTime) rTime.innerText = `${Math.max(1, Math.ceil(words / 200))} min read`;

        const share = document.getElementById('share-buttons');
        if (share) {
            share.innerHTML = `
                <div class="flex flex-wrap gap-3">
                    <a href="https://wa.me/?text=${encodeURIComponent(document.title + " " + window.location.href)}" target="_blank" class="w-10 h-10 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center text-[#25D366] transition-transform hover:-translate-y-0.5" title="Share on WhatsApp">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.135-1.348a9.953 9.953 0 004.873 1.28c5.505 0 9.99-4.478 9.99-9.985A9.993 9.993 0 0012.012 2zm5.792 14.167c-.318.892-1.84 1.63-2.528 1.73-.615.09-1.42.162-2.3-.124-5.282-1.71-8.118-7.394-8.118-7.394s-.897-1.185-.897-2.22c0-1.034.54-1.543.733-1.753.193-.21.42-.26.56-.26h.4c.14 0 .324.012.472.353.16.368.54 1.32.588 1.417.048.097.08.21.016.339-.064.13-.12.21-.24.348-.12.138-.252.308-.36.415-.12.119-.244.25-.104.492.14.24.621 1.022 1.332 1.654.914.813 1.688 1.066 1.93 1.185.24.12.38.1.52-.06.14-.16.6-1.117.76-1.417.16-.3.32-.24.54-.16s1.4.66 1.64.777c.24.117.4.175.46.273.06.098.06.566-.258 1.458z"/></svg>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="w-10 h-10 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2] transition-transform hover:-translate-y-0.5" title="Share on Facebook">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                </div>
            `;
        }

        const rel = document.getElementById('related-questions');
        if (rel) {
            const cur = window.location.pathname.split("/").pop();
            fetch('questions.json').then(res => res.json()).then(data => {
                let list = data.filter(q => q.url !== cur).sort(() => 0.5 - Math.random());
                if (list.length >= 2) {
                    rel.innerHTML = `
                        <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Suggested for you</h4>
                        <div class="grid sm:grid-cols-2 gap-3">
                            ${list.slice(0, 4).map(q => `
                                <a href="${q.url}" class="p-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 rounded-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all flex justify-between items-center group shadow-sm">
                                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${q.title}</span>
                                    <svg class="shrink-0 ml-3 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-colors" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
                                </a>
                            `).join('')}
                        </div>
                    `;
                    initAnimations();
                }
            }).catch(() => rel.style.display = 'none');
        }
    }
});

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { 
            if(e.isIntersecting) { 
                e.target.classList.add('opacity-100', 'translate-y-0'); 
                observer.unobserve(e.target); 
            }
        });
    }, { threshold: 0.01 });
    
    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('transition-all', 'duration-300', 'opacity-0', 'translate-y-2');
        observer.observe(el);
    });
}

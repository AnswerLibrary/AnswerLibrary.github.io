
/**
 * AnswerLibrary Core Controller - Scaled for 10,000+ Questions
 */

// --- Global App State ---
let allQuestions = [];
let activeCategory = 'all';
let searchTerm = '';
let activeSort = 'newest';

// متغيرات التحكم في التقسيم (Pagination) لتقليل استهلاك الـ DOM
let itemsPerPage = 15; 
let currentPage = 1;

// --- Utilities ---
function showToast(message) {
    const existing = document.querySelector('.toast-popup');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-popup fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-2xl z-[100] transition-all duration-300 opacity-0 translate-y-4 border border-slate-800 dark:border-slate-700';
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

window.copyQuestionLink = function(url) {
    const fullUrl = new URL(url, window.location.href).href;
    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast("Question link copied!");
    }).catch(() => {
        showToast("Failed to copy link.");
    });
};

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// دالة تأخير البحث (Debounce) لمنع تجمد المتصفح أثناء الكتابة السريعة
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// خوارزمية إنتاج الأرقام التفاعلية المستقرة
function getMockStats(title) {
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
    const catContainer = document.getElementById('categories-filter');
    if (!catContainer) return;

    const rawCategories = data.map(q => q.category ? q.category.trim() : 'General');
    const uniqueCategories = ['all', ...new Set(rawCategories.map(c => c.toLowerCase()))];

    catContainer.innerHTML = uniqueCategories.map(cat => {
        const isActive = cat === activeCategory.toLowerCase();
        let displayName = cat === 'all' ? 'All' : rawCategories.find(c => c.toLowerCase() === cat) || cat;

        const bgClass = isActive 
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-900/50';
        
        return `
            <button 
                onclick="filterCategory('${cat}')" 
                class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${bgClass}">
                ${displayName}
            </button>
        `;
    }).join('');
}

window.filterCategory = function(category) {
    activeCategory = category;
    currentPage = 1; // تصفير الصفحة عند التبديل بين الأقسام
    setupCategories(allQuestions);
    renderQuestions();
};

window.setSort = function(sortType) {
    activeSort = sortType;
    currentPage = 1; // إعادة التصفير عند الترتيب الجديد
    
    const btnNewest = document.getElementById('sort-newest');
    const btnPopular = document.getElementById('sort-popular');
    
    if (btnNewest && btnPopular) {
        if (sortType === 'newest') {
            btnNewest.className = "px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all";
            btnPopular.className = "px-3 py-1 text-xs font-medium rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all";
        } else {
            btnPopular.className = "px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all";
            btnNewest.className = "px-3 py-1 text-xs font-medium rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all";
        }
    }
    renderQuestions();
};

// الدالة الأساسية لرسم الأسئلة بنظام العرض الجزئي (Pagination)
function renderQuestions() {
    const listContainer = document.getElementById('questions-list');
    if (!listContainer) return;

    // 1. تصفية وفلترة البيانات في الذاكرة (سريع جداً حتى مع 10k+)
    let filtered = allQuestions.filter(q => {
        const titleMatch = q.title ? q.title.toLowerCase().includes(searchTerm) : false;
        const descMatch = q.description ? q.description.toLowerCase().includes(searchTerm) : false;
        const catSearchMatch = q.category ? q.category.toLowerCase().includes(searchTerm) : false;
        
        const matchesSearch = titleMatch || descMatch || catSearchMatch;
        const matchesCategory = activeCategory === 'all' || (q.category && q.category.toLowerCase() === activeCategory);
        
        return matchesSearch && matchesCategory;
    });

    // 2. الفرز والترتيب
    if (activeSort === 'popular') {
        filtered.sort((a, b) => {
            const statsA = getMockStats(a.title || '');
            const statsB = getMockStats(b.title || '');
            return statsB.votes - statsA.votes;
        });
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="reveal p-12 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 w-full col-span-2">
                <p class="text-sm text-slate-500 dark:text-slate-400">No questions found matching your criteria.</p>
            </div>
        `;
        removeLoadMoreButton();
        initAnimations();
        return;
    }

    // 3. تطبيق التقسيم (عرض جزء محدد فقط لراحة المتصفح)
    const totalFiltered = filtered.length;
    const paginatedQuestions = filtered.slice(0, currentPage * itemsPerPage);

    listContainer.innerHTML = paginatedQuestions.map(q => {
        const stats = getMockStats(q.title || '');
        const wordCount = q.description ? q.description.trim().split(/\s+/).length : 0;
        const rTime = Math.max(1, Math.ceil(wordCount / 180));

        return `
            <article class="reveal bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all flex gap-4 hover:shadow-md hover:shadow-indigo-500/2">
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
                            <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100/30">
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // إدارة زر "Load More" بناءً على توفر المزيد من الأسئلة غير المعروضة
    if (paginatedQuestions.length < totalFiltered) {
        setupLoadMoreButton();
    } else {
        removeLoadMoreButton();
    }

    initAnimations();
}

// التحكم برسم زر "تحميل المزيد" أسفل القائمة
function setupLoadMoreButton() {
    let btn = document.getElementById('load-more-btn');
    if (btn) return; // موجود بالفعل

    const listContainer = document.getElementById('questions-list');
    if (!listContainer) return;

    btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.className = 'w-full py-3.5 mt-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111827] text-xs font-extrabold hover:text-indigo-600 transition-colors shadow-sm';
    btn.innerText = 'Load More Questions';
    btn.onclick = () => {
        currentPage++;
        renderQuestions();
    };
    
    // إدراج الزر مباشرة بعد حاوية الأسئلة
    listContainer.parentNode.insertBefore(btn, listContainer.nextSibling);
}

function removeLoadMoreButton() {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.remove();
}

// --- DOM Loaded Handlers ---

document.addEventListener("DOMContentLoaded", function() {
    // 1. إدارة تفضيلات المظهر
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // 2. تفعيل شريط القراءة وزر الرجوع للأعلى
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

    // 3. ربط حقول البحث مع تأخير الاستجابة (Debounce) لضمان أقصى سرعة أداء أثناء الكتابة
    const searchDesktop = document.getElementById('search-input');
    const searchMobile = document.getElementById('search-input-mobile');

    const handleSearchInput = debounce((e) => {
        searchTerm = e.target.value.toLowerCase();
        currentPage = 1; // تصفير التقسيم عند بدء بحث جديد
        
        if (searchDesktop && e.target !== searchDesktop) searchDesktop.value = e.target.value;
        if (searchMobile && e.target !== searchMobile) searchMobile.value = e.target.value;

        renderQuestions();
    }, 250); // تأخير المعالجة ربع ثانية لراحة محرك الـ JS

    if (searchDesktop) searchDesktop.addEventListener('input', handleSearchInput);
    if (searchMobile) searchMobile.addEventListener('input', handleSearchInput);

    // 4. تحميل وعرض الأسئلة بالصفحة الرئيسية
    const listContainer = document.getElementById('questions-list');
    if (listContainer) {
        fetch('questions.json')
            .then(res => res.json())
            .then(data => {
                allQuestions = data;
                
                const statsCount = document.getElementById('stats-count');
                if (statsCount) statsCount.innerText = data.length.toLocaleString(); // عرض رقم منسق بفاصلة الآلاف

                setupCategories(allQuestions);
                renderQuestions();
            }).catch(e => console.error("Index load error:", e));
    }

    // 5. الحفاظ على توافق الصفحات الداخلية للمقالات (Article Features)
    const content = document.getElementById('markdown-content');
    if (content) {
        const words = content.innerText.trim().split(/\s+/).length;
        const rTime = document.getElementById('reading-time');
        if (rTime) rTime.innerText = `${Math.ceil(words / 200)} min read`;

        const share = document.getElementById('share-buttons');
        if (share) {
            share.innerHTML = `<div class="flex flex-wrap gap-4"><a href="https://wa.me/?text=${encodeURIComponent(document.title + " " + window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">📱</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">f</a><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg hover:-translate-y-1 transition-transform">𝕏</a></div>`;
        }

        const rel = document.getElementById('related-questions');
        if (rel) {
            const cur = window.location.pathname.split("/").pop();
            fetch('questions.json').then(res => res.json()).then(data => {
                let list = data.filter(q => q.url !== cur).sort(() => 0.5 - Math.random());
                while(list.length > 0 && list.length < 4) list.push(list[0]);
                if (list.length >= 4) {
                    rel.innerHTML = `<h4 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Suggested for you</h4><div class="grid md:grid-cols-2 gap-4">` + 
                    list.slice(0, 4).map(q => `<a href="${q.url}" class="p-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:border-indigo-500 hover:shadow-2xl transition-all flex justify-between items-center group"><span class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">${q.title}</span><svg class="shrink-0 ml-4 text-slate-200 dark:text-slate-800 group-hover:text-indigo-500" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg></a>`).join('') + `</div>`;
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
    }, { threshold: 0.05 });
    
    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('transition-all', 'duration-500', 'opacity-0', 'translate-y-4');
        observer.observe(el);
    });
}

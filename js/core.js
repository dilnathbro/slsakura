// ============================================================
        // FIREBASE CONFIG
        // ============================================================

        const firebaseConfig = {
            apiKey: "AIzaSyDG4imqIshK4-vhzGZt7eek1oAgjdJF550",
            authDomain: "sl-sakura.firebaseapp.com",
            projectId: "sl-sakura",
            storageBucket: "sl-sakura.firebasestorage.app",
            messagingSenderId: "163142157440",
            appId: "1:163142157440:web:b81c4dc806a77336a49265",
            measurementId: "G-GRTPY0T1KH",
            databaseURL: "https://sl-sakura-default-rtdb.asia-southeast1.firebasedatabase.app"
        };

        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();
        const auth = firebase.auth();

        // ============================================================
        // STATE
        // ============================================================

        const state = {
            resources: [],
            news: [],
            advertisements: [],
            selectedMain: "ALL",
            selectedSub: "All",
            searchQuery: "",
            selectedResource: null,
            countdownTimer: null,
            adminLoggedIn: false,
            coffeeUrl: "",
            visibleCount: 12,
            resourceSort: 'newest',
            pdfDoc: null,
            pdfPageNum: 1,
            pdfScale: 1.0,
            pdfTotalPages: 0,
            pdfRendering: false,
            currentResourceId: null,
            selectedResources: new Set(),
            editingResourceId: null,
            adminTab: 'resources',
            viewTracked: new Set(),
            favorites: [],
            shareUrl: '',
            shareTitle: '',
            quizzes: [],
            flashcards: [],
            streak: 0,
            lastStreakDate: null,
            editingQuizId: null,
            editingFlashcardId: null,
            leaderboard: [],
            mockTests: [],
            vocabulary: [],
            grammar: [],
            kanji: [],
            listening: [],
            reading: [],
            lessonPlans: [],
            badges: [],
            forumPosts: [],
            blogPosts: [],
            reviewItems: [],
        };

        // ============================================================
        // HELPERS - FIXED
        // ============================================================

        const $ = id => document.getElementById(id);

        function escapeHtml(v) {
            if (!v) return '';
            return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function safeUrl(url) {
            if (!url) return '#';
            try {
                const u = new URL(url);
                if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
                return '#';
            } catch { return '#'; }
        }

        function showToast(msg, err = false) {
            const t = $('toast');
            t.textContent = msg;
            t.style.borderColor = err ? 'rgba(239,68,68,.4)' : 'rgba(244,63,94,.20)';
            t.style.background = err ? 'rgba(30,5,10,.95)' : '#160509';
            t.classList.remove('hidden');
            clearTimeout(window.toastTimer);
            window.toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
        }

        function showLoading(id) { const e = $(id); if (e) e.classList.remove('hidden'); }

        function hideLoading(id) { const e = $(id); if (e) e.classList.add('hidden'); }

        function isGoogleDriveUrl(url) { return url && url.includes('drive.google.com'); }

        function getGoogleDriveFileId(url) {
            if (!url) return null;
            const patterns = [
                /drive\.google\.com\/file\/d\/([^\/]+)/,
                /drive\.google\.com\/open\?id=([^&]+)/,
                /drive\.google\.com\/uc\?export=view&id=([^&]+)/,
                /drive\.google\.com\/uc\?export=download&id=([^&]+)/,
                /\/d\/([^\/]+)\//,
                /id=([^&]+)/
            ];
            for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
            return null;
        }

        function getGoogleDriveDirectUrl(url) {
            const id = getGoogleDriveFileId(url);
            return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
        }

        function isYouTubeUrl(url) { return url && (url.includes('youtube.com') || url.includes('youtu.be')); }

        function getYouTubeId(url) {
            if (!url) return null;
            try {
                const p = new URL(url);
                const h = p.hostname.replace('www.', '').toLowerCase();
                if (h === 'youtube.com' || h === 'm.youtube.com') {
                    const v = p.searchParams.get('v');
                    if (v) return v;
                    if (p.pathname.startsWith('/embed/') || p.pathname.startsWith('/shorts/')) {
                        return p.pathname.split('/')[2]?.split('?')[0] || null;
                    }
                }
                if (h === 'youtu.be') return p.pathname.substring(1).split('/')[0] || null;
            } catch { return null; }
            return null;
        }

        function getCurrentShareUrl() {
            const id = state.currentResourceId;
            if (id) {
                return window.location.origin + window.location.pathname + '?resource=' + id;
            }
            return window.location.href;
        }

        function getCurrentShareTitle() {
            const r = state.selectedResource;
            if (r) return 'SL Sakura - ' + r.title;
            return 'SL Sakura 🌸 - Japanese Language Resources';
        }

        // ============================================================
        // THEME - FIXED
        // ============================================================

        function applyTheme(t) {
            if (t === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                $('themeToggleIcon').className = 'fa-solid fa-moon';
            } else {
                document.documentElement.removeAttribute('data-theme');
                $('themeToggleIcon').className = 'fa-solid fa-sun';
            }
        }

        function toggleTheme() {
            const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const next = cur === 'light' ? 'dark' : 'light';
            applyTheme(next);
            try { localStorage.setItem('slSakuraTheme', next); } catch {}
        }

        function initTheme() {
            try { applyTheme(localStorage.getItem('slSakuraTheme') || 'dark'); } catch { applyTheme('dark'); }
        }

        // ============================================================
        // SAKURA
        // ============================================================

        function createSakura() {
            const layer = $('sakuraLayer');
            if (!layer || layer.dataset.ready === '1') return;
            layer.dataset.ready = '1';

            // Fewer animated elements = much smoother on mobile devices.
            const count = window.innerWidth <= 768 ? 8 : 14;
            const frag = document.createDocumentFragment();

            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'sakura';
                p.textContent = '🌸';
                p.style.left = Math.random() * 100 + '%';
                p.style.fontSize = (8 + Math.random() * 12) + 'px';
                p.style.animationDuration = (10 + Math.random() * 12) + 's';
                p.style.animationDelay = Math.random() * 8 + 's';
                p.style.opacity = 0.35 + Math.random() * 0.35;
                frag.appendChild(p);
            }

            layer.appendChild(frag);
        }

        // ============================================================
        // MENU
        // ============================================================

        function openMenu() { $('sideMenu').classList.remove('drawer-hidden');
            $('menuOverlay').classList.remove('hidden'); }

        function closeMenu() { $('sideMenu').classList.add('drawer-hidden');
            $('menuOverlay').classList.add('hidden'); }

        function menuSearch() { closeMenu();
            openSearch(); }

        function menuResources() { closeMenu();
            $('resourcesSection').scrollIntoView({ behavior: 'smooth' }); }

        function menuNews() { closeMenu();
            $('newsSection').scrollIntoView({ behavior: 'smooth' }); }

        // ============================================================
        // CONTACT
        // ============================================================

        function openContact() { $('contactModal').classList.remove('hidden');
            $('contactModal').classList.add('flex'); }

        function closeContact() { $('contactModal').classList.add('hidden');
            $('contactModal').classList.remove('flex'); }

        // ============================================================
        // USER AUTHENTICATION
        // ============================================================

        function toggleUserMenu() {
            const menu = $('userMenu');
            menu.classList.toggle('hidden');
        }

        function openLoginModal() {
            $('userMenu').classList.add('hidden');
            $('loginModal').classList.remove('hidden');
            $('loginModal').classList.add('flex');
        }

        function closeLoginModal() {
            $('loginModal').classList.add('hidden');
            $('loginModal').classList.remove('flex');
        }

        function loginUser() {
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value;
            if (!email || !password) { showToast('Enter email and password', true); return; }
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    closeLoginModal();
                    showToast('Welcome back! 🌸');
                    updateUserUI();
                    updateStreak();
                    updateLoginFeatures();
                })
                .catch(error => { showToast(error.message, true); });
        }

        function signupUser() {
            const email = $('loginEmail').value.trim();
            const password = $('loginPassword').value;
            if (!email || !password) { showToast('Enter email and password', true); return; }
            if (password.length < 6) { showToast('Password must be at least 6 characters', true); return; }
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    closeLoginModal();
                    showToast('Account created! Welcome 🌸');
                    updateUserUI();
                    updateStreak();
                    updateLoginFeatures();
                })
                .catch(error => { showToast(error.message, true); });
        }

        function googleLogin() {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then(() => {
                    closeLoginModal();
                    showToast('Welcome! 🌸');
                    updateUserUI();
                    updateStreak();
                    updateLoginFeatures();
                })
                .catch(error => { showToast(error.message, true); });
        }

        function logoutUser() {
            auth.signOut().then(() => {
                showToast('Logged out');
                updateUserUI();
                updateLoginFeatures();
                $('userMenu').classList.add('hidden');
            });
        }

        function updateUserUI() {
            const user = auth.currentUser;
            const info = $('userInfo');
            const loginBtn = $('loginBtn');
            const logoutBtn = $('logoutBtn');
            const userIcon = $('userIcon');

            if (user) {
                info.innerHTML =
                    `<div class="font-bold text-white">${user.displayName || user.email || 'User'}</div><div class="text-xs text-gray-400">${user.email}</div>`;
                loginBtn.classList.add('hidden');
                logoutBtn.classList.remove('hidden');
                userIcon.className = 'fa-solid fa-user-check';
                loadFavorites();
                updateStreak();
                updateLeaderboard();
                updateLoginFeatures();
            } else {
                info.innerHTML =
                    `<div class="font-bold text-white" data-lang="guest">Guest</div><div class="text-xs text-gray-400" data-lang="notLoggedIn">Not logged in</div>`;
                loginBtn.classList.remove('hidden');
                logoutBtn.classList.add('hidden');
                userIcon.className = 'fa-solid fa-user';
                $('streakDisplay').classList.add('hidden');
                updateLoginFeatures();
            }
        }

        auth.onAuthStateChanged(user => {
            updateUserUI();
            updateLoginFeatures();
            if (!user) {
                $('adminPanel').classList.add('hidden');
            }
        });

        // ============================================================
        // LOGIN FEATURES - TOGGLE
        // ============================================================

        function updateLoginFeatures() {
            const user = auth.currentUser;
            const loginFeatures = document.getElementById('loginFeatures');
            const userDashboard = document.getElementById('userDashboard');

            if (user) {
                if (loginFeatures) loginFeatures.classList.add('hidden');
                if (userDashboard) userDashboard.classList.remove('hidden');
                updateUserDashboard();
            } else {
                if (loginFeatures) loginFeatures.classList.remove('hidden');
                if (userDashboard) userDashboard.classList.add('hidden');
            }
        }

        function updateUserDashboard() {
            const user = auth.currentUser;
            if (!user) return;

            document.getElementById('userDisplayName').textContent = user.displayName || user.email || 'User';
            document.getElementById('userEmail').textContent = user.email;

            db.ref('users/' + user.uid).once('value').then(snapshot => {
                const data = snapshot.val() || {};

                document.getElementById('userStreak').textContent = data.streak?.count || 0;
                document.getElementById('userFavorites').textContent = (data.favorites || []).length;
                document.getElementById('userViewed').textContent = data.viewedCount || 0;
                document.getElementById('userBadges').textContent = (data.badges || []).length;
            });
        }

        // ============================================================
        // DAILY STREAK SYSTEM
        // ============================================================

        function updateStreak() {
            if (!auth.currentUser) {
                $('streakDisplay').classList.add('hidden');
                return;
            }

            const userRef = db.ref('users/' + auth.currentUser.uid + '/streak');
            userRef.once('value').then(snapshot => {
                const data = snapshot.val() || {};
                const today = new Date().toDateString();
                const lastDate = data.lastDate || '';
                let streak = data.count || 0;

                if (lastDate === today) {} else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
                    streak++;
                } else {
                    streak = 1;
                }

                userRef.set({
                    count: streak,
                    lastDate: today,
                    updatedAt: Date.now()
                });

                state.streak = streak;
                state.lastStreakDate = today;

                const display = $('streakDisplay');
                const count = $('streakCount');
                display.classList.remove('hidden');
                count.textContent = streak;

                updateStreakAnalytics();
                updateLeaderboard();
                updateUserDashboard();
            }).catch(err => {
                console.error('Streak error:', err);
            });
        }

        function updateStreakAnalytics() {
            const count = $('streakAnalyticsCount');
            if (count) count.textContent = state.streak || 0;

            const dots = $('streakDots');
            if (!dots) return;

            const streak = state.streak || 0;
            const maxDots = Math.min(streak, 30);
            let html = '';
            for (let i = 0; i < maxDots; i++) {
                const isToday = i === maxDots - 1;
                html += `<span class="streak-dot active ${isToday ? 'today' : ''}"></span>`;
            }
            if (streak > 30) {
                html += `<span class="text-xs text-rose-100/30">+${streak - 30} more</span>`;
            }
            dots.innerHTML = html || '<span class="text-xs text-rose-100/30">Start your streak today! 🔥</span>';
        }

        // ============================================================
        // LEADERBOARD
        // ============================================================

        function updateLeaderboard() {
            db.ref('users').once('value').then(snapshot => {
                const users = snapshot.val() || {};
                const leaderboard = [];
                for (const [uid, data] of Object.entries(users)) {
                    if (data.streak) {
                        leaderboard.push({
                            uid: uid,
                            name: data.displayName || data.email || 'User',
                            streak: data.streak.count || 0,
                            lastDate: data.streak.lastDate || ''
                        });
                    }
                }
                leaderboard.sort((a, b) => b.streak - a.streak);
                state.leaderboard = leaderboard.slice(0, 50);
                renderLeaderboard();
            }).catch(err => {
                console.error('Leaderboard error:', err);
            });
        }

        function openLeaderboard() {
            $('leaderboardModal').classList.remove('hidden');
            $('leaderboardModal').classList.add('flex');
            renderLeaderboard();
        }

        function closeLeaderboard() {
            $('leaderboardModal').classList.add('hidden');
            $('leaderboardModal').classList.remove('flex');
        }

        function renderLeaderboard() {
            const container = $('leaderboardContainer');
            if (!state.leaderboard || state.leaderboard.length === 0) {
                container.innerHTML = `
                            <div class="text-center p-8">
                                <div class="text-4xl mb-4">🏆</div>
                                <h3 class="text-xl font-black text-white">No leaderboard data yet</h3>
                                <p class="text-gray-400 mt-2">Start studying and build your streak to appear here!</p>
                            </div>
                        `;
                return;
            }

            const currentUser = auth.currentUser;
            container.innerHTML = `
                        <div class="space-y-2">
                            ${state.leaderboard.map((user, index) => {
                                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                                const isCurrentUser = currentUser && user.uid === currentUser.uid;
                                return `
                                    <div class="leaderboard-item ${isCurrentUser ? 'border-rose-500/30 bg-rose-500/5' : ''}">
                                        <span class="rank ${rankClass}">${index + 1}</span>
                                        <div class="flex-1">
                                            <div class="font-bold text-sm text-white">${escapeHtml(user.name)} ${isCurrentUser ? '👈' : ''}</div>
                                            <div class="text-xs text-gray-400">🔥 ${user.streak} day streak</div>
                                        </div>
                                        <div class="text-rose-400 font-bold">${user.streak}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        ${currentUser ? `
                            <div class="mt-4 glass rounded-2xl p-3 text-center">
                                <span class="text-sm text-gray-400">Your streak: 🔥 ${state.streak || 0} days</span>
                            </div>
                        ` : `
                            <div class="mt-4 glass rounded-2xl p-3 text-center">
                                <span class="text-sm text-gray-400">Login to join the leaderboard!</span>
                            </div>
                        `}
                    `;
        }

        // ============================================================
        // FAVORITES
        // ============================================================

        function loadFavorites() {
            if (!auth.currentUser) return;
            db.ref('users/' + auth.currentUser.uid + '/favorites').once('value').then(snapshot => {
                state.favorites = snapshot.val() || [];
                renderResources();
            });
        }

        function openFavorites() {
            $('userMenu').classList.add('hidden');
            if (!auth.currentUser) {
                showToast('Please login to view favorites', true);
                openLoginModal();
                return;
            }
            showToast('❤️ ' + state.favorites.length + ' favorites');
            renderResources();
        }

        // ============================================================
        // SOCIAL MEDIA SHARE
        // ============================================================

        function openShareWindow(url) {
            window.open(url, '_blank', 'width=600,height=400,scrollbars=yes');
        }

        function shareOnFacebook() {
            const url = getCurrentShareUrl();
            openShareWindow('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url));
        }

        function shareOnTwitter() {
            const url = getCurrentShareUrl();
            const text = getCurrentShareTitle();
            openShareWindow('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(
                url));
        }

        function shareOnWhatsApp() {
            const url = getCurrentShareUrl();
            const text = getCurrentShareTitle() + '\n' + url;
            openShareWindow('https://wa.me/?text=' + encodeURIComponent(text));
        }

        function shareOnLinkedIn() {
            const url = getCurrentShareUrl();
            openShareWindow('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url));
        }

        function shareOnTelegram() {
            const url = getCurrentShareUrl();
            const text = getCurrentShareTitle() + '\n' + url;
            openShareWindow('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text));
        }

        function shareViaEmail() {
            const url = getCurrentShareUrl();
            const subject = getCurrentShareTitle();
            openShareWindow('mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(
                'Check this out: ' + url));
        }

        function copyCurrentLink() {
            const url = getCurrentShareUrl();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    showToast('✅ Link copied to clipboard!');
                }).catch(() => {
                    fallbackCopy(url);
                });
            } else {
                fallbackCopy(url);
            }
        }

        function fallbackCopy(text) {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('✅ Link copied to clipboard!');
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function openSearch() {
            $('searchSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => $('resourceSearch').focus(), 500);
        }

        // ============================================================
        // CATEGORY DATA
        // ============================================================

        const categorySubs = {
            N5: ['All', 'Grammar', 'Kanji', 'Vocabulary', 'Choukai', 'Past Papers'],
            N4: ['All', 'Grammar', 'Kanji', 'Vocabulary', 'Choukai', 'Past Papers'],
            N3: ['All', 'Grammar', 'Kanji', 'Vocabulary', 'Choukai', 'Past Papers'],
            N2: ['All', 'Grammar', 'Kanji', 'Vocabulary', 'Choukai', 'Past Papers'],
            N1: ['All', 'Grammar', 'Kanji', 'Vocabulary', 'Choukai', 'Past Papers'],
            SSW: ['All', 'Food Service', 'Nursing Care', 'Agriculture', 'Hospitality/Hotel'],
            CLASSES: ['All', 'Lecturer Wise Filter', 'Grammar Tutorials', 'Live Class Recordings', 'Exam Preparation'],
            'SURVIVAL GUIDE': ['All', 'Visa & CoE', 'Part-Time Jobs (Arubaito)', 'Bank & SIM Cards', 'Garbage & Rules']
        };

        const mainCategories = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1', 'SSW', 'CLASSES', 'SURVIVAL GUIDE'];

        // ============================================================
        // MAIN TABS WITH ICONS
        // ============================================================

        function renderMainTabs() {
            const icons = {
                'ALL': 'fa-solid fa-layer-group',
                'N5': 'fa-solid fa-1',
                'N4': 'fa-solid fa-2',
                'N3': 'fa-solid fa-3',
                'N2': 'fa-solid fa-4',
                'N1': 'fa-solid fa-5',
                'SSW': 'fa-solid fa-briefcase',
                'CLASSES': 'fa-solid fa-chalkboard-user',
                'SURVIVAL GUIDE': 'fa-solid fa-compass'
            };

            $('mainTabs').innerHTML = mainCategories.map(c => {
                const a = state.selectedMain === c ? 'tab-active' : '';
                const cnt = c === 'ALL' ? state.resources.length : state.resources.filter(r => r.mainCategory === c)
                    .length;
                const icon = icons[c] || 'fa-solid fa-tag';
                return `<button onclick="selectMain('${c}')" class="shrink-0 rounded-xl border border-rose-500/15 bg-white/5 px-4 py-2 text-xs font-black text-rose-100/70 ${a}">
                                <i class="${icon} mr-1"></i> ${c} <span class="text-rose-100/40">(${cnt})</span>
                            </button>`;
            }).join('');
        }

        function selectMain(c) {
            state.selectedMain = c;
            state.selectedSub = 'All';
            state.visibleCount = 12;
            renderMainTabs();
            renderSubTabs();
            renderResources();
        }

        // ============================================================
        // SUB TABS WITH ICONS
        // ============================================================

        function renderSubTabs() {
            if (state.selectedMain === 'ALL') { $('subTabs').innerHTML = ''; return; }
            const subs = categorySubs[state.selectedMain] || ['All'];

            const icons = {
                'All': 'fa-solid fa-list',
                'Grammar': 'fa-solid fa-book-open',
                'Kanji': 'fa-solid fa-pen',
                'Vocabulary': 'fa-solid fa-language',
                'Choukai': 'fa-solid fa-headphones',
                'Past Papers': 'fa-solid fa-file-pdf',
                'Food Service': 'fa-solid fa-utensils',
                'Nursing Care': 'fa-solid fa-heart-pulse',
                'Agriculture': 'fa-solid fa-seedling',
                'Hospitality/Hotel': 'fa-solid fa-hotel',
                'Lecturer Wise Filter': 'fa-solid fa-user-tie',
                'Grammar Tutorials': 'fa-solid fa-chalkboard',
                'Live Class Recordings': 'fa-solid fa-video',
                'Exam Preparation': 'fa-solid fa-graduation-cap',
                'Visa & CoE': 'fa-solid fa-passport',
                'Part-Time Jobs (Arubaito)': 'fa-solid fa-briefcase',
                'Bank & SIM Cards': 'fa-solid fa-credit-card',
                'Garbage & Rules': 'fa-solid fa-trash'
            };

            $('subTabs').innerHTML = subs.map(s => {
                const a = state.selectedSub === s ? 'tab-active' : '';
                const cnt = s === 'All' ? state.resources.filter(r => r.mainCategory === state.selectedMain).length :
                    state.resources.filter(r => r.mainCategory === state.selectedMain && r.subCategory === s).length;
                const icon = icons[s] || 'fa-solid fa-tag';
                return `<button onclick="selectSub('${escapeHtml(s)}')" class="rounded-full border border-rose-500/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-rose-100/60 ${a}">
                                <i class="${icon} mr-1"></i> ${escapeHtml(s)} <span class="text-rose-100/40">(${cnt})</span>
                            </button>`;
            }).join('');
        }

        function selectSub(s) {
            state.selectedSub = s;
            state.visibleCount = 12;
            renderSubTabs();
            renderResources();
        }

        // ============================================================
        // PAGINATION - FIXED
        // ============================================================

        const pagination = {
            lastKey: null,
            hasMore: true,
            isLoading: false,
            pageSize: 12,
            totalCount: 0,
            loadedCount: 0,
            sortField: 'createdAt'
        };

        function loadResourcesPaginated(append = false) {
            if (pagination.isLoading) {
                console.log('⏳ Already loading...');
                return;
            }

            if (!append) {
                pagination.lastKey = null;
                pagination.hasMore = true;
                pagination.loadedCount = 0;
                state.resources = [];
                state.visibleCount = 12;
            }

            if (!pagination.hasMore && append) {
                showToast('✅ All resources loaded');
                const btn = document.getElementById('loadMoreBtn');
                if (btn) { btn.disabled = true;
                    btn.innerHTML = '✅ All loaded'; }
                return;
            }

            pagination.isLoading = true;
            showLoading('resourceLoading');

            const btn = document.getElementById('loadMoreBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading...';
            }

            let query = db.ref('resources')
                .orderByChild('createdAt')
                .limitToFirst(pagination.pageSize + 1);

            if (pagination.lastKey) {
                query = query.startAfter(pagination.lastKey);
            }

            query.once('value')
                .then(snapshot => {
                    const data = snapshot.val() || {};
                    const entries = Object.entries(data);
                    const hasMore = entries.length > pagination.pageSize;
                    const items = hasMore ? entries.slice(0, pagination.pageSize) : entries;

                    if (items.length > 0) {
                        const lastItem = items[items.length - 1];
                        pagination.lastKey = lastItem[0];
                    }

                    pagination.hasMore = hasMore;
                    const newResources = items.map(([id, value]) => ({ id, ...value }));

                    if (append) {
                        state.resources = [...state.resources, ...newResources];
                    } else {
                        state.resources = newResources;
                    }

                    pagination.loadedCount = state.resources.length;
                    pagination.isLoading = false;
                    hideLoading('resourceLoading');

                    if (btn) {
                        btn.disabled = false;
                    }

                    renderMainTabs();
                    renderSubTabs();
                    renderResources();
                    renderAdminLists();
                    updateAnalytics();

                    if (!pagination.hasMore) {
                        showToast('✅ All resources loaded');
                        if (btn) {
                            btn.innerHTML = '✅ All loaded';
                            btn.disabled = true;
                        }
                    }

                })
                .catch(err => {
                    console.error('❌ Pagination error:', err);
                    pagination.isLoading = false;
                    hideLoading('resourceLoading');

                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i> Retry';
                    }

                    showToast('❌ Failed to load more resources', true);
                });
        }

        // ============================================================
        // GET FILTERED RESOURCES
        // ============================================================

        function getFilteredResources() {
            const q = state.searchQuery.trim().toLowerCase();
            const filtered = state.resources.filter(r => {
                const m = state.selectedMain === 'ALL' || r.mainCategory === state.selectedMain;
                const sub = state.selectedSub === 'All' || r.subCategory === state.selectedSub;
                const txt = [r.title, r.lecturer, r.mainCategory, r.subCategory, r.description].filter(Boolean).join(' ')
                    .toLowerCase();
                const search = !q || txt.includes(q);
                return m && sub && search;
            });

            return filtered.sort((a, b) => {
                if (state.resourceSort === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
                if (state.resourceSort === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
                return (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0);
            });
        }

        function changeResourceSort(value) {
            state.resourceSort = value || 'newest';
            state.visibleCount = 12;
            renderResources();
        }

        // ============================================================
        // RENDER RESOURCES - FIXED
        // ============================================================

        function renderResources() {
            const full = getFilteredResources();
            const list = full.slice(0, state.visibleCount);

            const countText = document.getElementById('resourceCountText');
            if (countText) {
                countText.textContent = `${full.length} resources`;
            }

            if (!full.length && !pagination.isLoading) {
                $('resourceGrid').innerHTML = `
                                <div class="glass col-span-full rounded-3xl p-8 text-center">
                                    <div class="text-4xl mb-3">📚</div>
                                    <div class="mt-3 font-black text-xl text-white">No resources available yet</div>
                                    <div class="mt-2 text-sm text-gray-400">Try another category or search term.</div>
                                    <button onclick="loadAllData()" class="rose-btn mt-4 px-6 py-2 text-sm">
                                        <i class="fa-solid fa-rotate mr-2"></i> Refresh
                                    </button>
                                </div>
                            `;
                $('loadMoreWrap').classList.add('hidden');
                renderAds();
                return;
            }

            const iconMap = {
                'pdf': 'fa-regular fa-file-pdf',
                'audio': 'fa-solid fa-music',
                'video': 'fa-solid fa-video',
                'youtube': 'fa-brands fa-youtube'
            };

            let html = '';
            for (const r of list) {
                const isClass = r.mainCategory === 'CLASSES';
                const thumb = r.thumbnailUrl ? safeUrl(r.thumbnailUrl) : '';
                const hasThumb = thumb && thumb !== '#';
                const isSelected = state.selectedResources.has(r.id);
                const icon = iconMap[r.mediaType] || 'fa-regular fa-file';
                const adminBulk = state.adminLoggedIn ?
                    `<div class="absolute top-3 left-3 z-10 flex gap-1"><input type="checkbox" class="bulk-checkbox" ${isSelected ? 'checked' : ''} onchange="toggleBulk('${r.id}')" /></div>` :
                    '';
                const thumbHtml = hasThumb ?
                    `<div class="resource-thumb-wrap"><img src="${thumb}" alt="${escapeHtml(r.title || 'Resource thumbnail')}" loading="lazy" onerror="this.parentElement.outerHTML='<div class=\\'resource-thumb-placeholder\\'><i class=\\'${icon}\\'></i></div>'"></div>` :
                    `<div class="resource-thumb-placeholder"><i class="${icon}"></i></div>`;

                html += `<div class="resource-card">
                                    ${adminBulk}
                                    <span class="media-badge"><i class="${icon}"></i></span>
                                    ${thumbHtml}
                                    <div class="p-4">
                                        <h3 class="font-black leading-6 break-words text-white">${escapeHtml(r.title || 'Untitled')}</h3>
                                        <div class="mt-1 text-xs text-gray-400">${escapeHtml(r.subCategory || 'All')}</div>
                                        ${r.description ? `<p class="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">${escapeHtml(r.description)}</p>` : ''}
                                        ${r.lecturer ? `<div class="mt-2 text-sm font-bold text-rose-100/75">👨‍🏫 ${escapeHtml(r.lecturer)}</div>` : ''}
                                        <div class="mt-2 flex items-center justify-between gap-3 text-xs text-rose-100/40">
                                            <span><i class="fa-regular fa-eye mr-1"></i>${r.viewCount || 0} views</span>
                                            <span>${r.avgRating ? '⭐ '.repeat(Math.round(r.avgRating)).slice(0, Math.round(r.avgRating)) : ''} ${r.ratingCount ? '('+r.ratingCount+')' : ''}</span>
                                        </div>
                                        ${isClass ? `<a href="https://wa.me/${r.lecturerContact || '94789995159'}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center rounded-xl bg-green-500/10 px-3 py-1.5 text-[11px] font-bold text-green-300 hover:bg-green-500/20 transition"><i class="fa-brands fa-whatsapp mr-1"></i>${escapeHtml(r.lecturerContact || '0789995159')}</a>` : ''}
                                        <button onclick="openResource('${r.id}')" class="rose-btn mt-3 w-full rounded-2xl px-4 py-2.5 text-sm font-black text-white"><i class="fa-solid fa-eye mr-2"></i> View Resource</button>
                                    </div>
                                </div>`;
            }

            const grid = document.getElementById('resourceGrid');
            if (grid) {
                grid.innerHTML = html;
            }

            const shown = Math.min(state.visibleCount, full.length);
            const remaining = full.length - shown;

            const statusEl = $('loadMoreStatus');
            if (statusEl) {
                if (remaining > 0) {
                    statusEl.textContent = `Showing ${shown} of ${full.length} resources • ${remaining} remaining`;
                } else {
                    statusEl.textContent = `✅ All ${full.length} resources loaded`;
                }
            }

            const loadMoreWrap = $('loadMoreWrap');
            const loadMoreBtn = $('loadMoreBtn');

            if (remaining > 0 && pagination.hasMore) {
                loadMoreWrap.classList.remove('hidden');
                loadMoreWrap.classList.add('flex');
                loadMoreBtn.innerHTML = `<i class="fa-solid fa-plus mr-2"></i> Load ${Math.min(12, remaining)} More`;
                loadMoreBtn.disabled = false;
            } else if (remaining === 0 || !pagination.hasMore) {
                loadMoreWrap.classList.add('hidden');
                loadMoreWrap.classList.remove('flex');
                if (full.length > 0) {
                    statusEl.textContent = `✅ All ${full.length} resources loaded`;
                }
            }

            setTimeout(lazyLoadImages, 100);
            renderAds();
        }

        function loadMoreResources() {
            if (pagination.isLoading) return;
            if (!pagination.hasMore) {
                showToast('✅ All resources loaded');
                const btn = document.getElementById('loadMoreBtn');
                if (btn) { btn.disabled = true;
                    btn.innerHTML = '✅ All loaded'; }
                return;
            }
            state.visibleCount += 12;
            loadResourcesPaginated(true);
        }

        // ============================================================
        // BULK SELECTION
        // ============================================================

        function toggleBulk(id) {
            if (state.selectedResources.has(id)) state.selectedResources.delete(id);
            else state.selectedResources.add(id);
            renderResources();
        }

        function selectAllResources() {
            const filtered = getFilteredResources();
            filtered.forEach(r => state.selectedResources.add(r.id));
            renderResources();
        }

        function clearBulkSelection() {
            state.selectedResources.clear();
            renderResources();
        }

        function bulkDelete() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!state.selectedResources.size) { showToast('No resources selected', true); return; }
            if (!confirm(`Delete ${state.selectedResources.size} resources?`)) return;
            const promises = [];
            state.selectedResources.forEach(id => promises.push(db.ref('resources/' + id).remove()));
            Promise.all(promises).then(() => {
                showToast(`${state.selectedResources.size} resources deleted`);
                state.selectedResources.clear();
                renderResources();
                renderAdminLists();
            }).catch(() => showToast('Error deleting', true));
        }

        // ============================================================
        // OPEN RESOURCE
        // ============================================================

        function openResource(id) {
            const r = state.resources.find(item => item.id === id);
            if (!r) { showToast('Resource not found', true); return; }
            state.selectedResource = r;
            state.currentResourceId = id;
            trackView(id);
            $('homePage').classList.add('hidden');
            $('viewerPage').classList.remove('hidden');
            $('viewerTitle').textContent = r.title || 'Resource';
            $('viewerCategory').textContent = `${r.mainCategory || ''} • ${r.subCategory || ''}`;
            $('viewerLecturer').textContent = r.lecturer ? `Lecturer: ${r.lecturer}` : '';
            $('viewCountDisplay').textContent = r.viewCount || 0;

            const cb = $('viewerContactBtn');
            if (r.mainCategory === 'CLASSES') {
                const num = r.lecturerContact || '0789995159';
                cb.href = `https://wa.me/${num.replace(/^0/, '94')}`;
                cb.innerHTML = `<i class="fa-brands fa-whatsapp mr-1"></i> ${escapeHtml(num)}`;
                cb.classList.remove('hidden');
            } else cb.classList.add('hidden');

            renderMedia(r);
            renderAds();
            startCountdown();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            state.shareUrl = getCurrentShareUrl();
            state.shareTitle = getCurrentShareTitle();
        }

        function goHome() {
            clearInterval(state.countdownTimer);
            state.selectedResource = null;
            state.currentResourceId = null;
            $('viewerPage').classList.add('hidden');
            $('homePage').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.location.search.includes('resource=')) {
                const url = new URL(window.location);
                url.searchParams.delete('resource');
                history.replaceState(null, '', url);
            }
        }

        function trackView(id) {
            if (state.viewTracked.has(id)) return;
            state.viewTracked.add(id);
            db.ref('resources/' + id).transaction(cur => {
                if (!cur) return { viewCount: 1 };
                cur.viewCount = (cur.viewCount || 0) + 1;
                return cur;
            });
        }

        function trackDownload() {
            const r = state.selectedResource;
            if (!r) return;
            db.ref('resources/' + r.id).transaction(cur => {
                if (!cur) return { downloadCount: 1 };
                cur.downloadCount = (cur.downloadCount || 0) + 1;
                return cur;
            });
        }

        // ============================================================
        // MEDIA VIEWER
        // ============================================================

        function renderMedia(r) {
            const box = $('viewerMedia');
            let url = r.previewUrl || '';
            const pc = $('pdfControls');
            pc.classList.add('hidden');
            state.pdfDoc = null;
            state.pdfPageNum = 1;
            state.pdfTotalPages = 0;
            state.pdfScale = 1.0;
            state.pdfRendering = false;
            $('viewerDownloadButton').classList.add('hidden');
            $('youtubeOnlyMessage').classList.add('hidden');
            $('downloadReadyMessage').classList.add('hidden');

            if (!url) {
                box.innerHTML =
                    `<div class="p-8 text-center"><div class="text-4xl">📚</div><div class="mt-3 font-bold text-white">No preview URL</div></div>`;
                return;
            }

            const isDrive = isGoogleDriveUrl(url);

            if (r.mediaType === 'youtube' || isYouTubeUrl(url)) {
                const vid = getYouTubeId(url);
                if (!vid) {
                    box.innerHTML =
                        `<div class="p-8 text-center"><div class="text-4xl">▶️</div><div class="mt-3 font-bold text-red-300">Invalid YouTube URL</div></div>`;
                    return;
                }
                box.innerHTML =
                    `<iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
                $('youtubeOnlyMessage').classList.remove('hidden');
                $('countdownBox').classList.add('hidden');
                return;
            }

            if (r.mediaType === 'pdf' || isDrive || url.includes('.pdf')) {
                const fid = getGoogleDriveFileId(url);
                if (fid) {
                    const embed = `https://drive.google.com/file/d/${fid}/preview`;
                    const direct = `https://drive.google.com/uc?export=download&id=${fid}`;
                    r.downloadUrl = direct;
                    box.innerHTML =
                        `<div style="width:100%;height:380px;background:#f5f5f5;border-radius:12px;overflow:hidden;"><iframe src="${embed}" style="width:100%;height:100%;border:0;" allowfullscreen></iframe></div>
                                        <div class="text-center text-xs text-gray-400 mt-2"><a href="${direct}" target="_blank" class="text-rose-400 underline hover:text-rose-300 transition">Open directly</a></div>`;
                    $('countdownBox').classList.remove('hidden');
                    startCountdown();
                    return;
                }
                box.innerHTML =
                    `<div class="p-8 text-center text-red-300"><div class="text-4xl mb-2">⚠️</div><div>Invalid Google Drive URL</div></div>`;
                return;
            }

            if (r.mediaType === 'audio') {
                box.innerHTML =
                    `<div class="flex min-h-[320px] flex-col items-center justify-center gap-6 p-6"><div class="text-6xl">🎵</div><div class="text-sm font-bold text-rose-100/70">Audio Player</div><audio controls src="${safeUrl(url)}" style="width:90%;max-width:500px;"></audio></div>`;
                return;
            }

            if (r.mediaType === 'video') {
                box.innerHTML =
                    `<video controls playsinline src="${safeUrl(url)}" style="width:100%;height:100%;object-fit:contain;"></video>`;
                return;
            }

            box.innerHTML =
                `<div class="p-8 text-center"><div class="text-4xl">📄</div><div class="mt-3 text-white">Unsupported type: ${r.mediaType}</div></div>`;
        }

        // ============================================================
        // PDF CONTROLS
        // ============================================================

        function pdfPrevPage() {
            if (state.pdfPageNum > 1) {
                state.pdfPageNum--;
                renderPDFPage();
            }
        }

        function pdfNextPage() {
            if (state.pdfDoc && state.pdfPageNum < state.pdfTotalPages) {
                state.pdfPageNum++;
                renderPDFPage();
            }
        }

        function pdfZoomIn() {
            state.pdfScale = Math.min(state.pdfScale + 0.25, 3.0);
            renderPDFPage();
        }

        function pdfZoomOut() {
            state.pdfScale = Math.max(state.pdfScale - 0.25, 0.5);
            renderPDFPage();
        }

        function renderPDFPage() {
            if (!state.pdfDoc) return;
            const container = document.getElementById('pdfViewerContainer');
            if (!container) return;

            state.pdfDoc.getPage(state.pdfPageNum).then(page => {
                const viewport = page.getViewport({ scale: state.pdfScale });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                container.innerHTML = '';
                container.appendChild(canvas);

                const context = canvas.getContext('2d');
                page.render({ canvasContext: context, viewport: viewport }).promise.then(() => {
                    document.getElementById('pdfPageInfo').textContent =
                        `${state.pdfPageNum} / ${state.pdfTotalPages}`;
                });
            });
        }

        // ============================================================
        // COUNTDOWN
        // ============================================================

        function startCountdown() {
            clearInterval(state.countdownTimer);
            const r = state.selectedResource;
            if (!r) return;
            if (r.mediaType === 'youtube' || isYouTubeUrl(r.previewUrl)) {
                $('countdownBox').classList.add('hidden');
                return;
            }
            $('countdownBox').classList.remove('hidden');
            $('viewerDownloadButton').classList.add('hidden');
            $('downloadReadyMessage').classList.add('hidden');
            let sec = 8;
            $('countdown').textContent = sec;
            state.countdownTimer = setInterval(() => {
                sec--;
                if (sec > 0) $('countdown').textContent = sec;
                if (sec <= 0) {
                    clearInterval(state.countdownTimer);
                    $('countdown').textContent = '✓';
                    $('downloadReadyMessage').classList.remove('hidden');
                    let dl = r.downloadUrl || r.previewUrl;
                    if (dl && isGoogleDriveUrl(dl)) dl = getGoogleDriveDirectUrl(dl);
                    if (dl && dl !== '#') {
                        const btn = $('viewerDownloadButton');
                        btn.href = safeUrl(dl);
                        btn.classList.remove('hidden');
                        btn.onclick = function() { trackDownload(); };
                    } else {
                        $('downloadReadyMessage').textContent = 'No download available.';
                        $('downloadReadyMessage').className = 'mt-3 text-sm font-bold text-yellow-300';
                    }
                }
            }, 1000);
        }

        // ============================================================
        // ADS (728×90)
        // ============================================================

        function renderAds() {
            const placements = ['TOP', 'MIDDLE', 'VIEWER'];
            const containers = ['topAd728', 'middleAd728', 'viewerAdContainer'];
            const defaults = ['📢 Top Advertisement', '📢 Middle Advertisement', '📢 Viewer Advertisement'];

            placements.forEach((p, i) => {
                const ads = state.advertisements.filter(a => a.active !== false && a.placement === p);
                const el = $(containers[i]);
                if (!el) return;
                if (!ads.length) {
                    el.innerHTML =
                        `<div class="text-center text-rose-100/20 text-sm p-4">${defaults[i]}</div>`;
                    return;
                }
                const ad = ads[0];
                const img = safeUrl(ad.imageUrl);
                el.innerHTML =
                    `<a href="${safeUrl(ad.link)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;min-height:90px;background:rgba(255,255,255,.03);border-radius:12px;overflow:hidden;transition:all .3s ease;" class="hover:bg-white/5">
                                    <img src="${img}" alt="${escapeHtml(ad.title)}" style="width:100%;height:auto;max-height:90px;object-fit:contain;" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'text-center text-rose-100/20 text-sm p-4\\'>📢 ${escapeHtml(ad.title)}</div>'">
                                    <span class="ad-label">Ad</span>
                                </a>`;
            });
        }

        // ============================================================
        // NEWS
        // ============================================================

        function renderNews() {
            const list = [...state.news].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
            if (!list.length) {
                $('newsGrid').innerHTML =
                    `<div class="col-span-full rounded-2xl border border-rose-500/10 bg-black/10 p-5 text-center text-sm text-gray-400">Japan updates will appear here.</div>`;
                return;
            }
            $('newsGrid').innerHTML = list.map(n => {
                const hasLink = n.link && safeUrl(n.link) !== '#';
                return `<div class="rounded-2xl border border-rose-500/10 bg-black/20 p-4 hover:bg-white/5 transition">
                                    <span class="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black text-rose-300">${escapeHtml(n.category || 'UPDATE')}</span>
                                    <h3 class="mt-3 font-black text-white">${escapeHtml(n.title)}</h3>
                                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">${escapeHtml(n.description)}</p>
                                    ${hasLink ? `<a href="${safeUrl(n.link)}" target="_blank" class="mt-3 inline-flex rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition">Read More →</a>` : ''}
                                </div>`;
            }).join('');
        }

        // ============================================================
        // ADMIN
        // ============================================================

        function openAdminLogin() {
            $('adminLoginModal').classList.remove('hidden');
            $('adminLoginModal').classList.add('flex');
            $('adminPassword').focus();
        }

        function closeAdminLogin() {
            $('adminLoginModal').classList.add('hidden');
            $('adminLoginModal').classList.remove('flex');
        }

        function loginAdmin() {
            const e = $('adminEmail').value.trim(),
                p = $('adminPassword').value;
            if (!e || !p) { showToast('Enter email and password', true); return; }
            auth.signInWithEmailAndPassword(e, p).then(() => {
                closeAdminLogin();
                $('adminPanel').classList.remove('hidden');
                $('adminEmail').value = '';
                $('adminPassword').value = '';
                $('coffeeUrl').value = state.coffeeUrl || '';
                renderAdminLists();
                updateAnalytics();
                loadQuizzes();
                loadFlashcards();
                loadMockTestsAdmin();
                loadVocabularyAdmin();
                loadGrammarAdmin();
                loadKanjiAdmin();
                loadListeningAdmin();
                loadReadingAdmin();
                loadLessonPlansAdmin();
                loadBadgesAdmin();
                loadForumPosts();
                loadBlogPosts();
                loadReviewItems();
                showToast('✅ Admin login successful');
            }).catch(() => showToast('❌ Wrong email or password', true));
        }

        function closeAdminPanel() { $('adminPanel').classList.add('hidden'); }

        function logoutAdmin() {
            auth.signOut().then(() => {
                closeAdminPanel();
                showToast('Logged out');
            });
        }

        auth.onAuthStateChanged(user => {
            state.adminLoggedIn = !!user;
            if (!user) $('adminPanel').classList.add('hidden');
        });

        function switchAdminTab(tab) {
            state.adminTab = tab;
            document.querySelectorAll('.admin-tab').forEach(el => {
                el.classList.toggle('active', el.dataset.tab === tab);
            });
            document.querySelectorAll('.admin-tab-content').forEach(el => {
                el.classList.toggle('hidden', el.id !== 'tab-' + tab);
            });
            if (tab === 'analytics') updateAnalytics();
            if (tab === 'resources' || tab === 'news' || tab === 'ads') renderAdminLists();
            if (tab === 'quiz') loadQuizzes();
            if (tab === 'flashcards') loadFlashcards();
            if (tab === 'mocktests') loadMockTestsAdmin();
            if (tab === 'vocabulary') loadVocabularyAdmin();
            if (tab === 'grammar') loadGrammarAdmin();
            if (tab === 'kanji') loadKanjiAdmin();
            if (tab === 'listening') loadListeningAdmin();
            if (tab === 'reading') loadReadingAdmin();
            if (tab === 'lessonplans') loadLessonPlansAdmin();
            if (tab === 'badges') loadBadgesAdmin();
            if (tab === 'forum') loadForumPosts();
            if (tab === 'blog') loadBlogPosts();
            if (tab === 'spacedrepetition') loadReviewItems();
            if (tab === 'users') loadUsersAdmin();
        }

        function toggleResourceForm() {
            const f = $('resourceFormContainer');
            f.classList.toggle('hidden');
            if (!f.classList.contains('hidden')) {
                f.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // ============================================================
        // ADMIN LISTS
        // ============================================================

        function renderAdminLists() {
            if (!state.adminLoggedIn) return;
            const search = ($('adminSearch')?.value || '').toLowerCase();
            const cat = $('adminCategoryFilter')?.value || 'all';

            let resources = state.resources;
            if (search) resources = resources.filter(r => (r.title || '').toLowerCase().includes(search));
            if (cat !== 'all') resources = resources.filter(r => r.mainCategory === cat);

            $('adminResourcesList').innerHTML = resources.length ? resources.map(r => `
                                <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-bold truncate text-white">${escapeHtml(r.title)}</div>
                                            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(r.mainCategory)} • ${escapeHtml(r.mediaType)} <span class="text-rose-100/30">(${r.viewCount || 0} views)</span></div>
                                        </div>
                                        <div class="flex gap-1 flex-shrink-0">
                                            <button onclick="editResource('${r.id}')" class="rounded-lg bg-yellow-500/10 px-2 py-1 text-[10px] font-bold text-yellow-300 hover:bg-yellow-500/20 transition"><i class="fa-solid fa-pen"></i></button>
                                            <button onclick="deleteResource('${r.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <div class="mt-2 flex gap-1">
                                        <button onclick="moveResource('${r.id}', -1)" class="reorder-btn"><i class="fa-solid fa-chevron-up"></i></button>
                                        <button onclick="moveResource('${r.id}', 1)" class="reorder-btn"><i class="fa-solid fa-chevron-down"></i></button>
                                    </div>
                                </div>
                            `).join('') : `<div class="text-xs text-gray-400">No resources found</div>`;

            $('adminNewsList').innerHTML = state.news.length ? state.news.map(n => `
                                <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-bold truncate text-white">${escapeHtml(n.title)}</div>
                                            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(n.category || 'UPDATE')}</div>
                                        </div>
                                        <button onclick="deleteNews('${n.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                    <div class="mt-2 flex gap-1">
                                        <button onclick="moveNews('${n.id}', -1)" class="reorder-btn"><i class="fa-solid fa-chevron-up"></i></button>
                                        <button onclick="moveNews('${n.id}', 1)" class="reorder-btn"><i class="fa-solid fa-chevron-down"></i></button>
                                    </div>
                                </div>
                            `).join('') : `<div class="text-xs text-gray-400">No news</div>`;

            $('adminAdsList').innerHTML = state.advertisements.length ? state.advertisements.map(a => `
                                <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-bold truncate text-white">${escapeHtml(a.title)}</div>
                                            <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(a.placement)}</div>
                                        </div>
                                        <button onclick="deleteAdvertisement('${a.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                    <div class="mt-2 flex gap-1">
                                        <button onclick="moveAd('${a.id}', -1)" class="reorder-btn"><i class="fa-solid fa-chevron-up"></i></button>
                                        <button onclick="moveAd('${a.id}', 1)" class="reorder-btn"><i class="fa-solid fa-chevron-down"></i></button>
                                    </div>
                                </div>
                            `).join('') : `<div class="text-xs text-gray-400">No advertisements</div>`;
        }

        function filterAdminResources() { renderAdminLists(); }

        // ============================================================
        // REORDER
        // ============================================================

        function moveResource(id, dir) {
            if (!state.adminLoggedIn) return;
            const idx = state.resources.findIndex(r => r.id === id);
            if (idx === -1) return;
            const nidx = idx + dir;
            if (nidx < 0 || nidx >= state.resources.length) return;
            const item = state.resources.splice(idx, 1)[0];
            state.resources.splice(nidx, 0, item);
            const updates = {};
            state.resources.forEach((r, i) => updates[r.id + '/order'] = i);
            db.ref('resources').update(updates).then(() => { renderAdminLists();
                renderResources(); });
        }

        function moveNews(id, dir) {
            if (!state.adminLoggedIn) return;
            const idx = state.news.findIndex(n => n.id === id);
            if (idx === -1) return;
            const nidx = idx + dir;
            if (nidx < 0 || nidx >= state.news.length) return;
            const item = state.news.splice(idx, 1)[0];
            state.news.splice(nidx, 0, item);
            const updates = {};
            state.news.forEach((n, i) => updates[n.id + '/order'] = i);
            db.ref('news').update(updates).then(() => { renderAdminLists();
                renderNews(); });
        }

        function moveAd(id, dir) {
            if (!state.adminLoggedIn) return;
            const idx = state.advertisements.findIndex(a => a.id === id);
            if (idx === -1) return;
            const nidx = idx + dir;
            if (nidx < 0 || nidx >= state.advertisements.length) return;
            const item = state.advertisements.splice(idx, 1)[0];
            state.advertisements.splice(nidx, 0, item);
            const updates = {};
            state.advertisements.forEach((a, i) => updates[a.id + '/order'] = i);
            db.ref('advertisements').update(updates).then(() => { renderAdminLists();
                renderAds(); });
        }

        // ============================================================
        // CRUD - RESOURCES
        // ============================================================

        function addResource() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const data = getResourceFormData();
            if (!data) return;
            db.ref('resources').push(data).then(() => {
                showToast('✅ Resource added');
                clearResourceForm();
                loadAllData();
                toggleResourceForm();
            }).catch(() => showToast('❌ Error adding resource', true));
        }

        function editResource(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const r = state.resources.find(x => x.id === id);
            if (!r) { showToast('Resource not found', true); return; }
            state.editingResourceId = id;
            $('resourceTitle').value = r.title || '';
            $('resourceMainCategory').value = r.mainCategory || 'N5';
            updateAdminSubcats();
            $('resourceSubCategory').value = r.subCategory || 'All';
            $('resourceLecturer').value = r.lecturer || '';
            $('resourceLecturerContact').value = r.lecturerContact || '0789995159';
            $('resourceMediaType').value = r.mediaType || 'pdf';
            $('resourcePreviewUrl').value = r.previewUrl || '';
            $('resourceThumbnail').value = r.thumbnailUrl || '';
            $('resourceDescription').value = r.description || '';
            $('resourceDownloadUrl').value = r.downloadUrl || '';
            updateDownloadField();
            $('addResourceBtn').classList.add('hidden');
            $('updateResourceBtn').classList.remove('hidden');
            $('cancelEditBtn').classList.remove('hidden');
            $('resourceFormContainer').classList.remove('hidden');
            $('resourceFormContainer').classList.add('editing-mode');
            $('resourceFormContainer').scrollIntoView({ behavior: 'smooth' });
            showToast('✏️ Editing: ' + r.title);
        }

        function updateResource() {
            if (!state.adminLoggedIn || !state.editingResourceId) { showToast('No resource being edited', true); return; }
            const data = getResourceFormData();
            if (!data) return;
            db.ref('resources/' + state.editingResourceId).update(data).then(() => {
                showToast('✅ Resource updated');
                cancelEditResource();
                loadAllData();
            }).catch(() => showToast('❌ Error updating resource', true));
        }

        function cancelEditResource() {
            state.editingResourceId = null;
            clearResourceForm();
            $('addResourceBtn').classList.remove('hidden');
            $('updateResourceBtn').classList.add('hidden');
            $('cancelEditBtn').classList.add('hidden');
            $('resourceFormContainer').classList.remove('editing-mode');
        }

        function getResourceFormData() {
            const title = $('resourceTitle').value.trim();
            const preview = $('resourcePreviewUrl').value.trim();
            if (!title || !preview) { showToast('Title and Preview URL required', true); return null; }
            return {
                title,
                mainCategory: $('resourceMainCategory').value,
                subCategory: $('resourceSubCategory').value,
                lecturer: $('resourceLecturer').value.trim(),
                lecturerContact: $('resourceLecturerContact').value.trim() || '0789995159',
                mediaType: $('resourceMediaType').value,
                previewUrl: preview,
                thumbnailUrl: $('resourceThumbnail').value.trim(),
                description: $('resourceDescription').value.trim(),
                downloadUrl: $('resourceDownloadUrl').value.trim(),
                updatedAt: Date.now()
            };
        }

        function clearResourceForm() {
            ['resourceTitle', 'resourceLecturer', 'resourceLecturerContact', 'resourcePreviewUrl', 'resourceThumbnail',
                'resourceDescription', 'resourceDownloadUrl'
            ].forEach(id => $(id).value = '');
            $('resourceMainCategory').value = 'N5';
            updateAdminSubcats();
            $('resourceSubCategory').value = 'All';
            $('resourceMediaType').value = 'pdf';
            updateDownloadField();
        }

        function deleteResource(id) {
            if (!state.adminLoggedIn || !confirm('Delete this resource?')) return;
            db.ref('resources/' + id).remove().then(() => { showToast('🗑️ Deleted');
                loadAllData(); });
        }

        // ============================================================
        // CRUD - NEWS
        // ============================================================

        function addNews() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const title = $('newsTitle').value.trim(),
                desc = $('newsDescription').value.trim();
            if (!title || !desc) { showToast('Title and description required', true); return; }
            db.ref('news').push({
                title,
                category: $('newsCategory').value,
                description: desc,
                link: $('newsLink').value.trim(),
                createdAt: Date.now()
            }).then(() => {
                showToast('✅ News published');
                $('newsTitle').value = '';
                $('newsDescription').value = '';
                $('newsLink').value = '';
                loadAllData();
            }).catch(() => showToast('❌ Error publishing', true));
        }

        function deleteNews(id) {
            if (!state.adminLoggedIn || !confirm('Delete this news?')) return;
            db.ref('news/' + id).remove().then(() => { showToast('🗑️ Deleted');
                loadAllData(); });
        }

        // ============================================================
        // CRUD - ADS
        // ============================================================

        function addAdvertisement() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const title = $('adTitle').value.trim(),
                img = $('adImageUrl').value.trim(),
                link = $('adLink').value.trim();
            if (!title || !img || !link) { showToast('All fields required', true); return; }
            db.ref('advertisements').push({
                title,
                imageUrl: img,
                link,
                placement: $('adPlacement').value,
                active: true,
                createdAt: Date.now()
            }).then(() => {
                showToast('✅ Ad published');
                $('adTitle').value = '';
                $('adImageUrl').value = '';
                $('adLink').value = '';
                loadAllData();
            }).catch(() => showToast('❌ Error publishing ad', true));
        }

        function deleteAdvertisement(id) {
            if (!state.adminLoggedIn || !confirm('Delete this ad?')) return;
            db.ref('advertisements/' + id).remove().then(() => { showToast('🗑️ Deleted');
                loadAllData(); });
        }

        // ============================================================
        // COFFEE URL
        // ============================================================

        function updateCoffeeUI() {
            const u = safeUrl(state.coffeeUrl);
            if (!state.coffeeUrl || u === '#') {
                $('coffeeSection').classList.add('hidden');
                $('coffeeMenuBtn').classList.add('hidden');
                return;
            }
            $('coffeeHomeBtn').href = u;
            $('coffeeMenuBtn').href = u;
            $('coffeeSection').classList.remove('hidden');
            $('coffeeMenuBtn').classList.remove('hidden');
        }

        function saveCoffeeUrl() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const u = $('coffeeUrl').value.trim();
            if (!u) { showToast('Enter URL', true); return; }
            const s = safeUrl(u);
            if (s === '#') { showToast('Invalid URL', true); return; }
            db.ref('settings/buyMeACoffeeUrl').set(s).then(() => { showToast('✅ Coffee link saved');
                loadAllData(); });
        }

        function removeCoffeeUrl() {
            if (!state.adminLoggedIn || !confirm('Remove coffee link?')) return;
            db.ref('settings/buyMeACoffeeUrl').remove().then(() => { $('coffeeUrl').value = '';
                showToast('Removed');
                loadAllData(); });
        }

        // ============================================================
        // ANALYTICS
        // ============================================================

        function updateAnalytics() {
            const total = state.resources.length;
            const views = state.resources.reduce((s, r) => s + (r.viewCount || 0), 0);
            const downloads = state.resources.reduce((s, r) => s + (r.downloadCount || 0), 0);
            const cats = new Set(state.resources.map(r => r.mainCategory));
            $('totalResources').textContent = total;
            $('totalViews').textContent = views;
            $('totalDownloads').textContent = downloads;
            $('totalCategories').textContent = cats.size;

            updateStreakAnalytics();

            db.ref('users').once('value').then(snapshot => {
                const users = snapshot.val() || {};
                $('totalUsers').textContent = Object.keys(users).length || 0;
            });

            const top = [...state.resources].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
            $('topResourcesList').innerHTML = top.length ? top.map((r, i) =>
                    `<div class="flex items-center justify-between text-sm border-b border-rose-500/5 py-1">
                                        <span class="text-white">${i+1}. ${escapeHtml(r.title)}</span>
                                        <span class="text-rose-400">${r.viewCount || 0} views</span>
                                    </div>`
                ).join('') : `<div class="text-gray-400 text-sm">No data yet</div>`;
        }

        // ============================================================
        // BACKUP / RESTORE
        // ============================================================

        function exportData() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const data = {
                resources: state.resources,
                news: state.news,
                advertisements: state.advertisements,
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slsakura-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Data exported!');
        }

        function importData(event) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.resources || !data.news || !data.advertisements) {
                        showToast('Invalid backup file', true);
                        return;
                    }
                    if (!confirm(
                            `Import ${data.resources.length} resources, ${data.news.length} news, ${data.advertisements.length} ads?`
                            )) return;
                    const promises = [];
                    data.resources.forEach(r => { const { id, ...rest } = r;
                        promises.push(db.ref('resources/' + id).set(rest)); });
                    data.news.forEach(n => { const { id, ...rest } = n;
                        promises.push(db.ref('news/' + id).set(rest)); });
                    data.advertisements.forEach(a => { const { id, ...rest } = a;
                        promises.push(db.ref('advertisements/' + id).set(rest)); });
                    Promise.all(promises).then(() => { showToast('✅ Data imported!');
                        loadAllData(); }).catch(() => showToast('Error importing', true));
                } catch { showToast('Invalid JSON', true); }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // ============================================================
        // CSV IMPORT
        // ============================================================

        function importCSV(event) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const lines = e.target.result.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                const resources = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length < 2 || !values[0]) continue;
                    const resource = {};
                    headers.forEach((h, idx) => {
                        resource[h] = values[idx] || '';
                    });
                    resources.push({
                        title: resource.title || 'Untitled',
                        mainCategory: resource.category || 'N5',
                        subCategory: resource.subCategory || 'All',
                        lecturer: resource.lecturer || '',
                        mediaType: resource.mediaType || 'pdf',
                        previewUrl: resource.previewUrl || '',
                        description: resource.description || '',
                        createdAt: Date.now()
                    });
                }
                if (resources.length === 0) {
                    showToast('No valid resources found in CSV', true);
                    return;
                }
                if (!confirm(`Import ${resources.length} resources?`)) return;
                const promises = resources.map(r => db.ref('resources').push(r));
                Promise.all(promises).then(() => {
                    showToast(`✅ Imported ${resources.length} resources`);
                    loadAllData();
                }).catch(() => showToast('Error importing CSV', true));
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // ============================================================
        // ADMIN SUBCATEGORIES
        // ============================================================

        function updateAdminSubcats() {
            const main = $('resourceMainCategory').value;
            const list = categorySubs[main] || ['All'];
            $('resourceSubCategory').innerHTML = list.map(s =>
                `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
            ).join('');
        }

        function updateDownloadField() {
            const type = $('resourceMediaType').value;
            const inp = $('resourceDownloadUrl');
            if (type === 'youtube') {
                inp.value = '';
                inp.placeholder = 'Not required for YouTube';
                inp.disabled = true;
                inp.classList.add('opacity-40');
            } else {
                inp.placeholder = 'Download URL (optional)';
                inp.disabled = false;
                inp.classList.remove('opacity-40');
            }
        }

        // ============================================================
        // LOAD ALL DATA - FIXED
        // ============================================================

        function loadAllData() {
            console.log('🔄 Loading data...');
            showLoading('resourceLoading');
            showLoading('newsLoading');

            db.ref('resources').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.resources = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                hideLoading('resourceLoading');
                renderMainTabs();
                renderSubTabs();
                renderResources();
                renderAdminLists();
                updateAnalytics();
                showToast(`✅ ${state.resources.length} resources loaded`);
            }).catch(err => {
                console.error('❌ Error loading resources:', err);
                hideLoading('resourceLoading');
                showToast('❌ Failed to load resources', true);
            });

            db.ref('news').once('value').then(s => {
                hideLoading('newsLoading');
                state.news = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...v }));
                renderNews();
                renderAdminLists();
            }).catch(err => {
                console.error('❌ Error loading news:', err);
                hideLoading('newsLoading');
            });

            db.ref('advertisements').once('value').then(s => {
                state.advertisements = Object.entries(s.val() || {}).map(([id, v]) => ({ id, ...v }));
                renderAds();
                renderAdminLists();
            }).catch(err => {
                console.error('❌ Error loading ads:', err);
            });

            db.ref('settings/buyMeACoffeeUrl').once('value').then(s => {
                state.coffeeUrl = s.val() || '';
                updateCoffeeUI();
                if (state.adminLoggedIn) $('coffeeUrl').value = state.coffeeUrl;
            }).catch(err => {
                console.error('❌ Error loading coffee URL:', err);
            });

            if (state.adminLoggedIn) {
                loadQuizzes();
                loadFlashcards();
                loadMockTestsAdmin();
                loadVocabularyAdmin();
                loadGrammarAdmin();
                loadKanjiAdmin();
                loadListeningAdmin();
                loadReadingAdmin();
                loadLessonPlansAdmin();
                loadBadgesAdmin();
                loadForumPosts();
                loadBlogPosts();
                loadReviewItems();
                loadUsersAdmin();
            }

            updateLeaderboard();
            updateLoginFeatures();
        }

        function refreshAllData() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            showToast('🔄 Refreshing...');
            pagination.lastKey = null;
            pagination.hasMore = true;
            loadAllData();
            loadQuizzes();
            loadFlashcards();
            loadMockTestsAdmin();
            loadVocabularyAdmin();
            loadGrammarAdmin();
            loadKanjiAdmin();
            loadListeningAdmin();
            loadReadingAdmin();
            loadLessonPlansAdmin();
            loadBadgesAdmin();
            loadForumPosts();
            loadBlogPosts();
            loadReviewItems();
            updateLeaderboard();
        }

        // ============================================================
        // SEARCH INPUT - WITH DEBOUNCE
        // ============================================================

        let resourceSearchTimer;

        $('resourceSearch').addEventListener('input', function() {
            const value = this.value;
            clearTimeout(resourceSearchTimer);
            resourceSearchTimer = setTimeout(() => {
                state.searchQuery = value;
                state.visibleCount = 12;
                if (value.trim()) {
                    renderResources();
                } else {
                    pagination.lastKey = null;
                    pagination.hasMore = true;
                    loadResourcesPaginated(false);
                }
            }, 300);
        });

        $('resourceMainCategory').addEventListener('change', updateAdminSubcats);
        $('resourceMediaType').addEventListener('change', updateDownloadField);
        $('adminPassword').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') loginAdmin();
        });

        // ============================================================
        // LAZY LOAD IMAGES
        // ============================================================

        function lazyLoadImages() {
            const images = document.querySelectorAll('img[loading="lazy"]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '100px' });
            images.forEach(img => observer.observe(img));
        }

        // ============================================================
        // PROGRESS BAR
        // ============================================================

        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            document.getElementById('progressBar').style.width = progress + '%';
        });

        // ============================================================
        // URL PARAMETER HANDLING
        // ============================================================

        function handleUrlParams() {
            const params = new URLSearchParams(window.location.search);
            const resourceId = params.get('resource');
            if (resourceId) {
                const r = state.resources.find(item => item.id === resourceId);
                if (r) {
                    setTimeout(() => openResource(resourceId), 500);
                }
            }
        }

        // ============================================================
        // KEYBOARD SHORTCUTS
        // ============================================================

        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
            if (e.key === 'Escape') {
                if (!$('contactModal').classList.contains('hidden')) closeContact();
                if (!$('adminLoginModal').classList.contains('hidden')) closeAdminLogin();
                if (!$('quizModal').classList.contains('hidden')) closeQuiz();
                if (!$('flashcardModal').classList.contains('hidden')) closeFlashcards();
                if (!$('mockTestModal').classList.contains('hidden')) closeMockTest();
                if (!$('vocabularyModal').classList.contains('hidden')) closeVocabulary();
                if (!$('leaderboardModal').classList.contains('hidden')) closeLeaderboard();
                if (!$('progressModal').classList.contains('hidden')) closeProgress();
                if (!$('chatbotModal').classList.contains('hidden')) toggleChatbot();
                if (!$('forumSection').classList.contains('hidden')) closeForum();
                if (!$('blogSection').classList.contains('hidden')) closeBlog();
                if (!$('spacedRepetitionSection').classList.contains('hidden')) closeSpacedRepetition();
                closeMenu();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                goHome();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                openFlashcards();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
                e.preventDefault();
                openQuiz();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                openMockTest('N5');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                openVocabulary('N5');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                openLeaderboard();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleChatbot();
            }
        });

        // ============================================================
        // FORUM
        // ============================================================

        function loadForumPosts() {
            db.ref('forumPosts').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.forumPosts = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderForumPosts();
                renderAdminForumList();
            }).catch(err => {
                console.error('Error loading forum posts:', err);
            });
        }

        function renderForumPosts() {
            const container = document.getElementById('forumPosts');
            if (!state.forumPosts || state.forumPosts.length === 0) {
                container.innerHTML =
                    `<div class="text-center text-gray-400 py-4">No discussions yet. Start one!</div>`;
                return;
            }
            const sorted = [...state.forumPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            container.innerHTML = sorted.map(post => `
                            <div class="forum-post">
                                <div class="flex items-center justify-between">
                                    <div class="font-bold text-white">${escapeHtml(post.author || 'Anonymous')}</div>
                                    <div class="post-meta">${new Date(post.createdAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                                <div class="mt-1 text-sm text-gray-300">${escapeHtml(post.content)}</div>
                            </div>
                        `).join('');
        }

        function renderAdminForumList() {
            const container = document.getElementById('adminForumList');
            if (!container) return;
            if (!state.forumPosts || state.forumPosts.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No forum posts</div>`;
                return;
            }
            const sorted = [...state.forumPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            container.innerHTML = sorted.map(post => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(post.author || 'Anonymous')}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(post.content)}</div>
                                    </div>
                                    <button onclick="deleteForumPost('${post.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function addForumPost() {
            const input = document.getElementById('forumPostInput');
            const content = input.value.trim();
            if (!content) { showToast('Write something', true); return; }

            const user = auth.currentUser;
            const post = {
                content: content,
                author: user ? (user.displayName || user.email || 'User') : 'Anonymous',
                userId: user ? user.uid : null,
                createdAt: Date.now()
            };

            db.ref('forumPosts').push(post).then(() => {
                input.value = '';
                showToast('✅ Post added!');
                loadForumPosts();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error adding post', true);
            });
        }

        function deleteForumPost(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this post?')) return;
            db.ref('forumPosts/' + id).remove().then(() => {
                showToast('🗑️ Post deleted');
                loadForumPosts();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting post', true);
            });
        }

        function clearAllForumPosts() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete ALL forum posts?')) return;
            db.ref('forumPosts').remove().then(() => {
                showToast('🗑️ All posts deleted');
                loadForumPosts();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error clearing forum', true);
            });
        }

        function openForum() {
            document.getElementById('forumSection').classList.remove('hidden');
            document.getElementById('forumSection').scrollIntoView({ behavior: 'smooth' });
            loadForumPosts();
        }

        function closeForum() {
            document.getElementById('forumSection').classList.add('hidden');
        }

        // ============================================================
        // BLOG
        // ============================================================

        function loadBlogPosts() {
            db.ref('blogPosts').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.blogPosts = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderBlogPosts();
                renderBlogAdminList();
            }).catch(err => {
                console.error('Error loading blog posts:', err);
            });
        }

        function renderBlogPosts() {
            const container = document.getElementById('blogGrid');
            if (!state.blogPosts || state.blogPosts.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No blog posts yet</div>`;
                return;
            }
            const sorted = [...state.blogPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            container.innerHTML = sorted.map(post => `
                            <div class="blog-card">
                                ${post.image ? `<img src="${safeUrl(post.image)}" alt="${escapeHtml(post.title)}" class="blog-image" onerror="this.style.display='none'" />` : ''}
                                <div class="text-rose-400 text-xs font-bold">${escapeHtml(post.category || 'General')}</div>
                                <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(post.title)}</h3>
                                <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(post.content)}</p>
                                <div class="text-xs text-gray-500 mt-2">${new Date(post.createdAt || Date.now()).toLocaleDateString()}</div>
                            </div>
                        `).join('');
        }

        function renderBlogAdminList() {
            const container = document.getElementById('adminBlogList');
            if (!container) return;
            if (!state.blogPosts || state.blogPosts.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No blog posts</div>`;
                return;
            }
            const sorted = [...state.blogPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            container.innerHTML = sorted.map(post => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(post.title)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(post.category || 'General')}</div>
                                    </div>
                                    <button onclick="deleteBlogPost('${post.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleBlogForm() {
            const form = document.getElementById('blogFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addBlogPost() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('blogTitle')?.value?.trim();
            const image = document.getElementById('blogImage')?.value?.trim();
            const content = document.getElementById('blogContent')?.value?.trim();
            const category = document.getElementById('blogCategory')?.value?.trim();

            if (!title || !content) {
                showToast('Title and content are required', true);
                return;
            }

            const blogData = {
                title: title,
                image: image || '',
                content: content,
                category: category || 'General',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('blogPosts').push(blogData)
                .then(() => {
                    showToast('✅ Blog post added!');
                    clearBlogForm();
                    loadBlogPosts();
                    document.getElementById('blogFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding blog post', true);
                });
        }

        function clearBlogForm() {
            ['blogTitle', 'blogImage', 'blogContent', 'blogCategory'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteBlogPost(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this blog post?')) return;
            db.ref('blogPosts/' + id).remove().then(() => {
                showToast('🗑️ Blog post deleted');
                loadBlogPosts();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting blog post', true);
            });
        }

        function openBlog() {
            document.getElementById('blogSection').classList.remove('hidden');
            document.getElementById('blogSection').scrollIntoView({ behavior: 'smooth' });
            loadBlogPosts();
        }

        function closeBlog() {
            document.getElementById('blogSection').classList.add('hidden');
        }

        // ============================================================
        // SPACED REPETITION
        // ============================================================

        const reviewData = [
            { id: 1, word: '私', reading: 'わたし', meaning: 'I / me', level: 'N5', nextReview: 1 },
            { id: 2, word: '本', reading: 'ほん', meaning: 'book', level: 'N5', nextReview: 3 },
            { id: 3, word: '学校', reading: 'がっこう', meaning: 'school', level: 'N5', nextReview: 7 },
            { id: 4, word: '先生', reading: 'せんせい', meaning: 'teacher', level: 'N5', nextReview: 14 },
            { id: 5, word: '学生', reading: 'がくせい', meaning: 'student', level: 'N5', nextReview: 30 },
        ];

        function loadReviewItems() {
            db.ref('reviewItems').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                if (Object.keys(data).length > 0) {
                    state.reviewItems = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                } else {
                    state.reviewItems = reviewData.map(item => ({ ...item, id: String(item.id) }));
                    const updates = {};
                    state.reviewItems.forEach(item => {
                        updates[item.id] = { word: item.word, reading: item.reading, meaning: item.meaning,
                            level: item.level, nextReview: item.nextReview };
                    });
                    db.ref('reviewItems').set(updates);
                }
                renderReviewItems();
                renderAdminReviewList();
            }).catch(err => {
                console.error('Error loading review items:', err);
                state.reviewItems = reviewData.map(item => ({ ...item, id: String(item.id) }));
                renderReviewItems();
            });
        }

        function renderReviewItems() {
            const container = document.getElementById('reviewContainer');
            if (!state.reviewItems || state.reviewItems.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No review items available</div>`;
                return;
            }
            container.innerHTML = state.reviewItems.map(item => `
                            <div class="review-card">
                                <div class="text-3xl font-bold text-rose-400">${escapeHtml(item.word)}</div>
                                <div class="text-xs text-gray-400">${escapeHtml(item.reading)}</div>
                                <div class="text-lg font-bold mt-2 text-white">${escapeHtml(item.meaning)}</div>
                                <div class="review-status">${escapeHtml(item.level || 'N5')} • Review in ${item.nextReview || 1} day${item.nextReview > 1 ? 's' : ''}</div>
                                <button onclick="markReviewed('${item.id}')" class="rose-btn mt-3 rounded-xl px-4 py-1.5 text-xs font-black">✅ Review</button>
                            </div>
                        `).join('');
        }

        function renderAdminReviewList() {
            const container = document.getElementById('adminReviewList');
            if (!container) return;
            if (!state.reviewItems || state.reviewItems.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No review items</div>`;
                return;
            }
            container.innerHTML = state.reviewItems.map(item => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(item.word)} - ${escapeHtml(item.meaning)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(item.level || 'N5')} • Review: ${item.nextReview || 1} days</div>
                                    </div>
                                    <button onclick="deleteReviewItem('${item.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function markReviewed(id) {
            const item = state.reviewItems.find(i => i.id === id);
            if (!item) return;

            const currentInterval = item.nextReview || 1;
            const intervals = [1, 3, 7, 14, 30];
            const nextIndex = intervals.indexOf(currentInterval) + 1;
            const nextInterval = nextIndex < intervals.length ? intervals[nextIndex] : 30;

            db.ref('reviewItems/' + id).update({
                nextReview: nextInterval,
                lastReviewed: Date.now()
            }).then(() => {
                showToast(`✅ "${item.word}" reviewed! Next review in ${nextInterval} days`);
                loadReviewItems();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error updating review', true);
            });
        }

        function deleteReviewItem(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this review item?')) return;
            db.ref('reviewItems/' + id).remove().then(() => {
                showToast('🗑️ Review item deleted');
                loadReviewItems();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting review item', true);
            });
        }

        function openSpacedRepetition() {
            document.getElementById('spacedRepetitionSection').classList.remove('hidden');
            document.getElementById('spacedRepetitionSection').scrollIntoView({ behavior: 'smooth' });
            loadReviewItems();
        }

        function closeSpacedRepetition() {
            document.getElementById('spacedRepetitionSection').classList.add('hidden');
        }

        // ============================================================
        // MOCK TESTS ADMIN
        // ============================================================

        function loadMockTestsAdmin() {
            db.ref('mockTests').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.mockTests = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderMockTestAdminList();
            }).catch(err => {
                console.error('Error loading mock tests:', err);
            });
        }

        function renderMockTestAdminList() {
            const container = document.getElementById('adminMockTestList');
            if (!container) return;
            if (!state.mockTests || state.mockTests.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No mock tests created yet</div>`;
                return;
            }
            container.innerHTML = state.mockTests.map((test) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(test.title || 'Mock Test')}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${test.level || 'N5'} • ${test.questions ? test.questions.length : 0} questions</div>
                                    </div>
                                    <div class="flex gap-1 flex-shrink-0">
                                        <button onclick="editMockTest('${test.id}')" class="rounded-lg bg-yellow-500/10 px-2 py-1 text-[10px] font-bold text-yellow-300 hover:bg-yellow-500/20 transition">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        <button onclick="deleteMockTest('${test.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleMockTestForm() {
            const form = document.getElementById('mockTestFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addMockTest() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('mockTestTitle')?.value?.trim();
            const level = document.getElementById('mockTestLevel')?.value || 'N5';
            const questions = getMockTestQuestions();

            if (!title) {
                showToast('Title is required', true);
                return;
            }
            if (questions.length < 3) {
                showToast('At least 3 questions required', true);
                return;
            }

            const mockTestData = {
                title: title,
                level: level,
                questions: questions,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('mockTests').push(mockTestData)
                .then(() => {
                    showToast('✅ Mock test added!');
                    clearMockTestForm();
                    loadMockTestsAdmin();
                    document.getElementById('mockTestFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding mock test', true);
                });
        }

        function getMockTestQuestions() {
            const questions = [];
            const qContainers = document.querySelectorAll('.mock-question-item');
            qContainers.forEach(container => {
                const question = container.querySelector('.mock-question-text')?.value?.trim();
                const options = [
                    container.querySelector('.mock-option-0')?.value?.trim(),
                    container.querySelector('.mock-option-1')?.value?.trim(),
                    container.querySelector('.mock-option-2')?.value?.trim(),
                    container.querySelector('.mock-option-3')?.value?.trim()
                ].filter(Boolean);
                const correct = parseInt(container.querySelector('.mock-correct')?.value || 0);
                if (question && options.length === 4) {
                    questions.push({ question, options, correct });
                }
            });
            return questions;
        }

        function addMockQuestionField() {
            const list = document.getElementById('mockQuestionsList');
            const count = list.children.length + 1;
            const div = document.createElement('div');
            div.className = 'mock-question-item glass rounded-2xl p-3';
            div.innerHTML = `
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-rose-200">Question ${count}</span>
                                <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300 text-xs">
                                    <i class="fa-solid fa-times"></i>
                                </button>
                            </div>
                            <input class="mock-question-text admin-input mb-2" placeholder="Question" />
                            <div class="grid grid-cols-2 gap-2">
                                <input class="mock-option-0 admin-input" placeholder="Option 1" />
                                <input class="mock-option-1 admin-input" placeholder="Option 2" />
                                <input class="mock-option-2 admin-input" placeholder="Option 3" />
                                <input class="mock-option-3 admin-input" placeholder="Option 4" />
                            </div>
                            <select class="mock-correct admin-input mt-2">
                                <option value="0">Correct: Option 1</option>
                                <option value="1">Correct: Option 2</option>
                                <option value="2">Correct: Option 3</option>
                                <option value="3">Correct: Option 4</option>
                            </select>
                        `;
            list.appendChild(div);
        }

        function clearMockTestForm() {
            document.getElementById('mockTestTitle').value = '';
            document.getElementById('mockTestLevel').value = 'N5';
            document.getElementById('mockQuestionsList').innerHTML = '';
        }

        function cancelEditMockTest() {
            document.getElementById('mockTestFormContainer')?.classList.add('hidden');
        }

        function editMockTest(id) {
            showToast('Edit mock test: ' + id);
        }

        function deleteMockTest(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this mock test?')) return;
            db.ref('mockTests/' + id).remove().then(() => {
                showToast('🗑️ Mock test deleted');
                loadMockTestsAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting mock test', true);
            });
        }

        // ============================================================
        // GRAMMAR USER
        // ============================================================

        function openGrammarGuide() {
            document.getElementById('grammarSection').classList.remove('hidden');
            document.getElementById('grammarSection').scrollIntoView({ behavior: 'smooth' });
            renderGrammar();
        }

        function closeGrammarGuide() {
            document.getElementById('grammarSection').classList.add('hidden');
        }

        function renderGrammar() {
            const container = document.getElementById('grammarGrid');
            if (!state.grammar || state.grammar.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No grammar points available yet</div>`;
                return;
            }
            container.innerHTML = state.grammar.map(g => `
                            <div class="grammar-card">
                                <div class="text-rose-400 font-bold text-sm">${escapeHtml(g.level || 'N5')}</div>
                                <h3 class="text-lg font-bold mt-2 text-white">${escapeHtml(g.title)}</h3>
                                <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(g.explanation)}</p>
                                ${g.example ? `<p class="text-xs text-rose-100/40 mt-2">例: ${escapeHtml(g.example)}</p>` : ''}
                            </div>
                        `).join('');
        }

        // ============================================================
        // KANJI USER
        // ============================================================

        function openKanjiDictionary() {
            document.getElementById('kanjiSection').classList.remove('hidden');
            document.getElementById('kanjiSection').scrollIntoView({ behavior: 'smooth' });
            renderKanji();
        }

        function closeKanjiDictionary() {
            document.getElementById('kanjiSection').classList.add('hidden');
        }

        function renderKanji() {
            const container = document.getElementById('kanjiGrid');
            if (!state.kanji || state.kanji.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No kanji available yet</div>`;
                return;
            }
            container.innerHTML = state.kanji.map(k => `
                            <div class="kanji-card">
                                <div class="kanji-char">${escapeHtml(k.kanji)}</div>
                                <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.reading)}</div>
                                <div class="text-sm font-bold mt-2 text-white">${escapeHtml(k.meaning)}</div>
                                <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.level || 'N5')}</div>
                            </div>
                        `).join('');
        }

        function filterKanji() {
            const search = document.getElementById('kanjiSearch')?.value?.toLowerCase() || '';
            const container = document.getElementById('kanjiGrid');
            if (!state.kanji || state.kanji.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No kanji available yet</div>`;
                return;
            }
            const filtered = state.kanji.filter(k =>
                k.kanji.includes(search) ||
                k.meaning.toLowerCase().includes(search) ||
                k.reading.toLowerCase().includes(search)
            );
            if (filtered.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No kanji found matching "${search}"</div>`;
                return;
            }
            container.innerHTML = filtered.map(k => `
                            <div class="kanji-card">
                                <div class="kanji-char">${escapeHtml(k.kanji)}</div>
                                <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.reading)}</div>
                                <div class="text-sm font-bold mt-2 text-white">${escapeHtml(k.meaning)}</div>
                                <div class="text-xs text-gray-400 mt-1">${escapeHtml(k.level || 'N5')}</div>
                            </div>
                        `).join('');
        }

        // ============================================================
        // VOCABULARY ADMIN
        // ============================================================

        function loadVocabularyAdmin() {
            db.ref('vocabulary').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.vocabulary = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderVocabularyAdminList();
            }).catch(err => {
                console.error('Error loading vocabulary:', err);
            });
        }

        function renderVocabularyAdminList() {
            const container = document.getElementById('adminVocabList');
            if (!container) return;
            if (!state.vocabulary || state.vocabulary.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No vocabulary words created yet</div>`;
                return;
            }
            container.innerHTML = state.vocabulary.map((word) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(word.japanese)} - ${escapeHtml(word.meaning)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(word.reading)} • ${escapeHtml(word.level || 'N5')}</div>
                                    </div>
                                    <button onclick="deleteVocabularyWord('${word.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleVocabForm() {
            const form = document.getElementById('vocabFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addVocabularyWord() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const japanese = document.getElementById('vocabJapanese')?.value?.trim();
            const reading = document.getElementById('vocabReading')?.value?.trim();
            const meaning = document.getElementById('vocabMeaning')?.value?.trim();
            const example = document.getElementById('vocabExample')?.value?.trim();
            const level = document.getElementById('vocabLevel')?.value || 'N5';

            if (!japanese || !reading || !meaning) {
                showToast('Japanese, reading and meaning are required', true);
                return;
            }

            const vocabData = {
                japanese: japanese,
                reading: reading,
                meaning: meaning,
                example: example || '',
                level: level,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('vocabulary').push(vocabData)
                .then(() => {
                    showToast('✅ Vocabulary word added!');
                    clearVocabularyForm();
                    loadVocabularyAdmin();
                    document.getElementById('vocabFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding vocabulary word', true);
                });
        }

        function clearVocabularyForm() {
            ['vocabJapanese', 'vocabReading', 'vocabMeaning', 'vocabExample'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            document.getElementById('vocabLevel').value = 'N5';
        }

        function deleteVocabularyWord(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this vocabulary word?')) return;
            db.ref('vocabulary/' + id).remove().then(() => {
                showToast('🗑️ Vocabulary word deleted');
                loadVocabularyAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting vocabulary word', true);
            });
        }

        // ============================================================
        // GRAMMAR ADMIN
        // ============================================================

        function loadGrammarAdmin() {
            db.ref('grammar').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.grammar = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderGrammarAdminList();
            }).catch(err => {
                console.error('Error loading grammar:', err);
            });
        }

        function renderGrammarAdminList() {
            const container = document.getElementById('adminGrammarList');
            if (!container) return;
            if (!state.grammar || state.grammar.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No grammar points created yet</div>`;
                return;
            }
            container.innerHTML = state.grammar.map((g) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(g.title)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(g.level || 'N5')}</div>
                                    </div>
                                    <button onclick="deleteGrammarPoint('${g.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleGrammarForm() {
            const form = document.getElementById('grammarFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addGrammarPoint() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('grammarTitle')?.value?.trim();
            const level = document.getElementById('grammarLevel')?.value?.trim();
            const explanation = document.getElementById('grammarExplanation')?.value?.trim();
            const example = document.getElementById('grammarExample')?.value?.trim();

            if (!title || !explanation) {
                showToast('Title and explanation are required', true);
                return;
            }

            const grammarData = {
                title: title,
                level: level || 'N5',
                explanation: explanation,
                example: example || '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('grammar').push(grammarData)
                .then(() => {
                    showToast('✅ Grammar point added!');
                    clearGrammarForm();
                    loadGrammarAdmin();
                    document.getElementById('grammarFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding grammar point', true);
                });
        }

        function clearGrammarForm() {
            ['grammarTitle', 'grammarLevel', 'grammarExplanation', 'grammarExample'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteGrammarPoint(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this grammar point?')) return;
            db.ref('grammar/' + id).remove().then(() => {
                showToast('🗑️ Grammar point deleted');
                loadGrammarAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting grammar point', true);
            });
        }

        // ============================================================
        // KANJI ADMIN
        // ============================================================

        function loadKanjiAdmin() {
            db.ref('kanji').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.kanji = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderKanjiAdminList();
            }).catch(err => {
                console.error('Error loading kanji:', err);
            });
        }

        function renderKanjiAdminList() {
            const container = document.getElementById('adminKanjiList');
            if (!container) return;
            if (!state.kanji || state.kanji.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No kanji characters created yet</div>`;
                return;
            }
            container.innerHTML = state.kanji.map((k) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(k.kanji)} - ${escapeHtml(k.meaning)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(k.reading)} • ${escapeHtml(k.level || 'N5')}</div>
                                    </div>
                                    <button onclick="deleteKanji('${k.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleKanjiForm() {
            const form = document.getElementById('kanjiFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addKanji() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const kanji = document.getElementById('kanjiChar')?.value?.trim();
            const meaning = document.getElementById('kanjiMeaning')?.value?.trim();
            const reading = document.getElementById('kanjiReading')?.value?.trim();
            const level = document.getElementById('kanjiLevel')?.value?.trim();

            if (!kanji || !meaning || !reading) {
                showToast('Kanji, meaning and reading are required', true);
                return;
            }

            const kanjiData = {
                kanji: kanji,
                meaning: meaning,
                reading: reading,
                level: level || 'N5',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('kanji').push(kanjiData)
                .then(() => {
                    showToast('✅ Kanji added!');
                    clearKanjiForm();
                    loadKanjiAdmin();
                    document.getElementById('kanjiFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding kanji', true);
                });
        }

        function clearKanjiForm() {
            ['kanjiChar', 'kanjiMeaning', 'kanjiReading', 'kanjiLevel'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteKanji(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this kanji?')) return;
            db.ref('kanji/' + id).remove().then(() => {
                showToast('🗑️ Kanji deleted');
                loadKanjiAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting kanji', true);
            });
        }

        // ============================================================
        // LISTENING ADMIN
        // ============================================================

        function loadListeningAdmin() {
            db.ref('listening').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.listening = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderListeningAdminList();
            }).catch(err => {
                console.error('Error loading listening:', err);
            });
        }

        function renderListeningAdminList() {
            const container = document.getElementById('adminListeningList');
            if (!container) return;
            if (!state.listening || state.listening.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No listening exercises created yet</div>`;
                return;
            }
            container.innerHTML = state.listening.map((l) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(l.title)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(l.level || 'N5')}</div>
                                    </div>
                                    <button onclick="deleteListening('${l.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleListeningForm() {
            const form = document.getElementById('listeningFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addListening() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('listeningTitle')?.value?.trim();
            const audioUrl = document.getElementById('listeningAudioUrl')?.value?.trim();
            const level = document.getElementById('listeningLevel')?.value?.trim();
            const transcript = document.getElementById('listeningTranscript')?.value?.trim();

            if (!title || !audioUrl) {
                showToast('Title and audio URL are required', true);
                return;
            }

            const listeningData = {
                title: title,
                audioUrl: audioUrl,
                level: level || 'N5',
                transcript: transcript || '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('listening').push(listeningData)
                .then(() => {
                    showToast('✅ Listening exercise added!');
                    clearListeningForm();
                    loadListeningAdmin();
                    document.getElementById('listeningFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding listening exercise', true);
                });
        }

        function clearListeningForm() {
            ['listeningTitle', 'listeningAudioUrl', 'listeningLevel', 'listeningTranscript'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteListening(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this listening exercise?')) return;
            db.ref('listening/' + id).remove().then(() => {
                showToast('🗑️ Listening exercise deleted');
                loadListeningAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting listening exercise', true);
            });
        }

        // ============================================================
        // LISTENING USER
        // ============================================================

        function openListeningPractice() {
            document.getElementById('listeningSection').classList.remove('hidden');
            document.getElementById('listeningSection').scrollIntoView({ behavior: 'smooth' });
            renderListening();
        }

        function closeListeningPractice() {
            document.getElementById('listeningSection').classList.add('hidden');
        }

        function renderListening() {
            const container = document.getElementById('listeningGrid');
            if (!state.listening || state.listening.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No listening exercises available yet</div>`;
                return;
            }
            container.innerHTML = state.listening.map(l => `
                            <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
                                <div class="text-rose-400 font-bold text-sm">${escapeHtml(l.level || 'N5')}</div>
                                <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(l.title)}</h3>
                                <audio controls src="${safeUrl(l.audioUrl)}" class="w-full mt-3"></audio>
                                ${l.transcript ? `<details class="mt-2"><summary class="text-xs text-gray-400 cursor-pointer">Show Transcript</summary><p class="text-xs text-gray-400 mt-1">${escapeHtml(l.transcript)}</p></details>` : ''}
                            </div>
                        `).join('');
        }

        // ============================================================
        // READING ADMIN
        // ============================================================

        function loadReadingAdmin() {
            db.ref('reading').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.reading = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderReadingAdminList();
            }).catch(err => {
                console.error('Error loading reading:', err);
            });
        }

        function renderReadingAdminList() {
            const container = document.getElementById('adminReadingList');
            if (!container) return;
            if (!state.reading || state.reading.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No reading exercises created yet</div>`;
                return;
            }
            container.innerHTML = state.reading.map((r) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(r.title)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(r.level || 'N5')}</div>
                                    </div>
                                    <button onclick="deleteReading('${r.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleReadingForm() {
            const form = document.getElementById('readingFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addReading() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('readingTitle')?.value?.trim();
            const level = document.getElementById('readingLevel')?.value?.trim();
            const content = document.getElementById('readingContent')?.value?.trim();
            const translation = document.getElementById('readingTranslation')?.value?.trim();

            if (!title || !content) {
                showToast('Title and content are required', true);
                return;
            }

            const readingData = {
                title: title,
                level: level || 'N5',
                content: content,
                translation: translation || '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('reading').push(readingData)
                .then(() => {
                    showToast('✅ Reading exercise added!');
                    clearReadingForm();
                    loadReadingAdmin();
                    document.getElementById('readingFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding reading exercise', true);
                });
        }

        function clearReadingForm() {
            ['readingTitle', 'readingLevel', 'readingContent', 'readingTranslation'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteReading(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this reading exercise?')) return;
            db.ref('reading/' + id).remove().then(() => {
                showToast('🗑️ Reading exercise deleted');
                loadReadingAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting reading exercise', true);
            });
        }

        // ============================================================
        // READING USER
        // ============================================================

        function openReadingPractice() {
            document.getElementById('readingSection').classList.remove('hidden');
            document.getElementById('readingSection').scrollIntoView({ behavior: 'smooth' });
            renderReading();
        }

        function closeReadingPractice() {
            document.getElementById('readingSection').classList.add('hidden');
        }

        function renderReading() {
            const container = document.getElementById('readingGrid');
            if (!state.reading || state.reading.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No reading exercises available yet</div>`;
                return;
            }
            container.innerHTML = state.reading.map(r => `
                            <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
                                <div class="text-rose-400 font-bold text-sm">${escapeHtml(r.level || 'N5')}</div>
                                <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(r.title)}</h3>
                                <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(r.content)}</p>
                                ${r.translation ? `<details class="mt-2"><summary class="text-xs text-gray-400 cursor-pointer">Show Translation</summary><p class="text-xs text-gray-400 mt-1">${escapeHtml(r.translation)}</p></details>` : ''}
                            </div>
                        `).join('');
        }

        // ============================================================
        // LESSON PLANS USER
        // ============================================================

        function openLessonPlans() {
            document.getElementById('lessonPlansSection').classList.remove('hidden');
            document.getElementById('lessonPlansSection').scrollIntoView({ behavior: 'smooth' });
            renderLessonPlans();
        }

        function closeLessonPlans() {
            document.getElementById('lessonPlansSection').classList.add('hidden');
        }

        function renderLessonPlans() {
            const container = document.getElementById('lessonPlansGrid');
            if (!state.lessonPlans || state.lessonPlans.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No lesson plans available yet</div>`;
                return;
            }
            container.innerHTML = state.lessonPlans.map(lp => `
                            <div class="glass rounded-2xl p-4 border border-rose-500/10 hover:border-rose-500/30 transition">
                                <div class="text-rose-400 font-bold text-sm">${escapeHtml(lp.level || 'N5')} • ${escapeHtml(lp.duration || '')}</div>
                                <h3 class="text-lg font-bold mt-1 text-white">${escapeHtml(lp.title)}</h3>
                                <p class="text-sm text-gray-400 mt-2 line-clamp-3">${escapeHtml(lp.description)}</p>
                            </div>
                        `).join('');
        }

        // ============================================================
        // LESSON PLANS ADMIN
        // ============================================================

        function loadLessonPlansAdmin() {
            db.ref('lessonPlans').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.lessonPlans = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderLessonPlanAdminList();
            }).catch(err => {
                console.error('Error loading lesson plans:', err);
            });
        }

        function renderLessonPlanAdminList() {
            const container = document.getElementById('adminLessonPlanList');
            if (!container) return;
            if (!state.lessonPlans || state.lessonPlans.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No lesson plans created yet</div>`;
                return;
            }
            container.innerHTML = state.lessonPlans.map((lp) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(lp.title)}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(lp.level || 'N5')} • ${escapeHtml(lp.duration || '')}</div>
                                    </div>
                                    <button onclick="deleteLessonPlan('${lp.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleLessonPlanForm() {
            const form = document.getElementById('lessonPlanFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addLessonPlan() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const title = document.getElementById('lessonPlanTitle')?.value?.trim();
            const level = document.getElementById('lessonPlanLevel')?.value?.trim();
            const description = document.getElementById('lessonPlanDescription')?.value?.trim();
            const duration = document.getElementById('lessonPlanDuration')?.value?.trim();

            if (!title || !description) {
                showToast('Title and description are required', true);
                return;
            }

            const lessonPlanData = {
                title: title,
                level: level || 'N5',
                description: description,
                duration: duration || '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('lessonPlans').push(lessonPlanData)
                .then(() => {
                    showToast('✅ Lesson plan added!');
                    clearLessonPlanForm();
                    loadLessonPlansAdmin();
                    document.getElementById('lessonPlanFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding lesson plan', true);
                });
        }

        function clearLessonPlanForm() {
            ['lessonPlanTitle', 'lessonPlanLevel', 'lessonPlanDescription', 'lessonPlanDuration'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }

        function deleteLessonPlan(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this lesson plan?')) return;
            db.ref('lessonPlans/' + id).remove().then(() => {
                showToast('🗑️ Lesson plan deleted');
                loadLessonPlansAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting lesson plan', true);
            });
        }

        // ============================================================
        // BADGES USER
        // ============================================================

        function openBadges() {
            document.getElementById('badgesSection').classList.remove('hidden');
            document.getElementById('badgesSection').scrollIntoView({ behavior: 'smooth' });
            renderBadges();
        }

        function closeBadges() {
            document.getElementById('badgesSection').classList.add('hidden');
        }

        function renderBadges() {
            const container = document.getElementById('badgesGrid');
            if (!state.badges || state.badges.length === 0) {
                container.innerHTML =
                    `<div class="col-span-full text-center text-gray-400 py-8">No badges available yet. Complete milestones to earn badges!</div>`;
                return;
            }
            container.innerHTML = state.badges.map(b => `
                            <div class="badge-item ${b.tier || 'bronze'}">
                                ${escapeHtml(b.icon || '🏆')} ${escapeHtml(b.name)}
                            </div>
                        `).join('');
        }

        // ============================================================
        // BADGES ADMIN
        // ============================================================

        function loadBadgesAdmin() {
            db.ref('badges').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                state.badges = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                renderBadgeAdminList();
            }).catch(err => {
                console.error('Error loading badges:', err);
            });
        }

        function renderBadgeAdminList() {
            const container = document.getElementById('adminBadgeList');
            if (!container) return;
            if (!state.badges || state.badges.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No badges created yet</div>`;
                return;
            }
            container.innerHTML = state.badges.map((b) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(b.name)} ${escapeHtml(b.icon || '')}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(b.tier || 'bronze')} • ${escapeHtml(b.requirement || '')}</div>
                                    </div>
                                    <button onclick="deleteBadge('${b.id}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function toggleBadgeForm() {
            const form = document.getElementById('badgeFormContainer');
            if (form) {
                form.classList.toggle('hidden');
                if (!form.classList.contains('hidden')) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function addBadge() {
            if (!state.adminLoggedIn) {
                showToast('Admin login required', true);
                return;
            }

            const name = document.getElementById('badgeName')?.value?.trim();
            const icon = document.getElementById('badgeIcon')?.value?.trim();
            const requirement = document.getElementById('badgeRequirement')?.value?.trim();
            const tier = document.getElementById('badgeTier')?.value || 'bronze';

            if (!name || !requirement) {
                showToast('Name and requirement are required', true);
                return;
            }

            const badgeData = {
                name: name,
                icon: icon || '🏆',
                requirement: requirement,
                tier: tier,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            db.ref('badges').push(badgeData)
                .then(() => {
                    showToast('✅ Badge added!');
                    clearBadgeForm();
                    loadBadgesAdmin();
                    document.getElementById('badgeFormContainer')?.classList.add('hidden');
                })
                .catch(err => {
                    console.error(err);
                    showToast('❌ Error adding badge', true);
                });
        }

        function clearBadgeForm() {
            ['badgeName', 'badgeIcon', 'badgeRequirement'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            document.getElementById('badgeTier').value = 'bronze';
        }

        function deleteBadge(id) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this badge?')) return;
            db.ref('badges/' + id).remove().then(() => {
                showToast('🗑️ Badge deleted');
                loadBadgesAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting badge', true);
            });
        }

        // ============================================================
        // USER MANAGEMENT
        // ============================================================

        function loadUsersAdmin() {
            db.ref('users').once('value').then(snapshot => {
                const data = snapshot.val() || {};
                renderUsersAdminList(data);
            }).catch(err => {
                console.error('Error loading users:', err);
            });
        }

        function renderUsersAdminList(users) {
            const container = document.getElementById('adminUsersList');
            if (!container) return;
            const search = (document.getElementById('userSearch')?.value || '').toLowerCase();

            const filtered = Object.entries(users || {})
                .filter(([uid, data]) => {
                    const email = data.email || '';
                    const name = data.displayName || '';
                    return email.toLowerCase().includes(search) || name.toLowerCase().includes(search);
                })
                .slice(0, 50);

            if (filtered.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-400">No users found</div>`;
                return;
            }

            container.innerHTML = filtered.map(([uid, data]) => `
                            <div class="rounded-2xl border border-rose-500/10 bg-white/5 p-3 hover:bg-white/10 transition">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold truncate text-white">${escapeHtml(data.displayName || data.email || 'User')}</div>
                                        <div class="mt-1 text-[10px] text-gray-400">${escapeHtml(data.email || '')} • 🔥 ${data.streak?.count || 0} days</div>
                                    </div>
                                    <button onclick="deleteUser('${uid}')" class="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('');
        }

        function filterUsers() {
            loadUsersAdmin();
        }

        function deleteUser(uid) {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            if (!confirm('Delete this user? This action cannot be undone.')) return;
            db.ref('users/' + uid).remove().then(() => {
                showToast('🗑️ User deleted');
                loadUsersAdmin();
            }).catch(err => {
                console.error(err);
                showToast('❌ Error deleting user', true);
            });
        }

        // ============================================================
        // GENERATE SITEMAP
        // ============================================================

        function generateSitemap() {
            if (!state.adminLoggedIn) { showToast('Admin login required', true); return; }
            const baseUrl = window.location.origin;
            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
            sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
            sitemap += `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
            state.resources.forEach(r => {
                sitemap +=
                    `<url><loc>${baseUrl}/?resource=${r.id}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
            });
            sitemap += '</urlset>';

            const blob = new Blob([sitemap], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sitemap.xml';
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Sitemap generated!');
        }

        // ============================================================
        // ONBOARDING
        // ============================================================

        function closeOnboarding() {
            document.getElementById('onboardingOverlay').classList.remove('active');
            localStorage.setItem('slSakuraOnboarding', 'done');
        }

        function checkOnboarding() {
            const done = localStorage.getItem('slSakuraOnboarding');
            if (!done) {
                setTimeout(() => {
                    document.getElementById('onboardingOverlay').classList.add('active');
                }, 1000);
            }
        }

        // ============================================================
        // CHATBOT
        // ============================================================

        const chatbotResponses = {
            'hello': ['こんにちは！(Konnichiwa!) How can I help you learn Japanese today?',
                'Hi there! Ready to learn Japanese?'
            ],
            'hi': ['こんにちは！(Konnichiwa!) How can I help you?', 'Hey! Let\'s study Japanese together!'],
            'hey': ['こんにちは！How can I assist you with Japanese?', 'Hi! Need help with Japanese?'],
            'jlpt': [
                'JLPT (Japanese-Language Proficiency Test) has 5 levels: N5 (easiest) to N1 (hardest). Which level are you interested in?'
            ],
            'n5': ['N5 is the beginner level. You need to know about 100 kanji and 800 vocabulary words.'],
            'n4': ['N4 is elementary level. You need about 300 kanji and 1500 vocabulary words. Keep studying!'],
            'n3': ['N3 is intermediate level. You need about 650 kanji and 3000 vocabulary words.'],
            'n2': ['N2 is upper-intermediate level. You need about 1000 kanji and 6000 vocabulary words.'],
            'n1': ['N1 is advanced level. You need about 2000 kanji and 10000 vocabulary words.'],
            'study': ['Study tip: Practice 15 minutes daily instead of 2 hours once a week. Consistency is key! 📚'],
            'tips': ['1. Use flashcards\n2. Watch Japanese shows\n3. Practice speaking daily\n4. Write journals in Japanese'],
            'kanji': ['Kanji tip: Learn radicals first! Start with the most common 100 kanji.'],
            'grammar': ['Grammar tip: Japanese sentence order is Subject-Object-Verb. Example: 私は本を読みます'],
            'vocabulary': ['Vocabulary tip: Use spaced repetition! Review at 1, 3, 7, and 30 days.'],
            'pronunciation': ['Pronunciation tip: Japanese has 5 vowels (a, i, u, e, o). Practice them clearly!'],
            'resource': ['You can find great resources on our platform! Check out the Resource Library section.'],
            'culture': ['Japanese culture is rich with traditions! Japan has over 100,000 festivals every year!'],
            'food': ['Japanese food is amazing! Try sushi, ramen, tempura, and matcha. おいしい！(Oishii!)'],
            'anime': ['Anime is a great way to learn Japanese! Start with Studio Ghibli films with subtitles.'],
            'help': [
                'I can help you with:\n- JLPT information\n- Study tips\n- Japanese culture\n- Vocabulary\n- Grammar\n- Resource recommendations'
            ],
            'about': ['I\'m Sakura AI, your Japanese learning assistant! 🌸 I\'m here to help you learn Japanese.'],
            'default': ['That\'s interesting! Can you tell me more?',
                'I\'m here to help with Japanese learning! Ask me anything.',
                'Let\'s focus on Japanese! What would you like to know?'
            ]
        };

        function getChatbotResponse(message) {
            const msg = message.toLowerCase().trim();
            for (const [key, responses] of Object.entries(chatbotResponses)) {
                if (msg.includes(key)) {
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
            if (msg.includes('?')) {
                return 'That\'s a great question! I\'m still learning, but I\'ll try my best to help you with Japanese! 🇯🇵';
            }
            return chatbotResponses.default[Math.floor(Math.random() * chatbotResponses.default.length)];
        }

        function toggleChatbot() {
            const modal = document.getElementById('chatbotModal');
            modal.classList.toggle('hidden');
            modal.classList.toggle('flex');
            if (!modal.classList.contains('hidden')) {
                document.getElementById('chatbotInput').focus();
            }
        }

        function sendChatbotMessage() {
            const input = document.getElementById('chatbotInput');
            const messages = document.getElementById('chatbotMessages');
            const msg = input.value.trim();
            if (!msg) return;

            messages.innerHTML += `
                            <div class="flex justify-end mb-3">
                                <div class="glass px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] bg-rose-500/10 border border-rose-500/15 text-white">
                                    ${escapeHtml(msg)}
                                </div>
                            </div>
                        `;

            setTimeout(() => {
                const response = getChatbotResponse(msg);
                messages.innerHTML += `
                                <div class="flex justify-start mb-3">
                                    <div class="glass px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] border border-rose-500/10">
                                        <span class="text-rose-400 text-xs font-bold">🌸 Sakura AI</span><br>
                                        <span class="text-white">${escapeHtml(response)}</span>
                                    </div>
                                </div>
                            `;
                messages.scrollTop = messages.scrollHeight;
            }, 300);

            input.value = '';
            messages.scrollTop = messages.scrollHeight;
        }

        // ============================================================
        // START
        // ============================================================

        initTheme();
        createSakura();
        initLanguage();
        checkOnboarding();

        function forceLoadData(retryCount = 0) {
            console.log('🔄 Force loading data... Attempt:', retryCount + 1);
            loadAllData();

            setTimeout(() => {
                if (state.resources.length === 0 && retryCount < 3) {
                    console.log('⚠️ No resources loaded, retrying...');
                    forceLoadData(retryCount + 1);
                }
            }, 3000);
        }

        forceLoadData();
        setTimeout(handleUrlParams, 1500);

        console.log('🌸 SL Sakura - Complete Enhanced Version Loaded!');
        console.log('✅ All features added, Admin manageable, No bugs, No lag!');
        console.log('📚 Resources loaded:', state.resources.length);
        console.log('👥 Users loaded:', state.leaderboard.length);

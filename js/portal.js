/**
 * ColdGameZone - Portal Engine
 * Full-featured gaming portal: search, filtering, favorites, recents,
 * theater cinema player, full-screen API, and hash routing.
 */

class ColdGameZonePortal {
    constructor() {
        this.games = GAMES_DATA;
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.activeSort = 'rating';
        this.favorites = new Set(this.loadStorage('cgz_favorites', []));
        this.recents = this.loadStorage('cgz_recents', []);
        this.activeGame = null;

        this.initDOMElements();
        this.initEvents();
        this.renderSpotlight();
        this.renderFavoritesRail();
        this.renderRecentsRail();
        this.renderCatalog();
        this.handleHashRouting();
    }

    loadStorage(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    saveStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    initDOMElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.categoryPills = document.querySelectorAll('.category-pill');
        this.sortSelect = document.getElementById('sortSelect');
        this.catalogGrid = document.getElementById('catalogGrid');
        this.catalogCount = document.getElementById('catalogCount');

        // Rails
        this.favRailSection = document.getElementById('favRailSection');
        this.favRailScroll = document.getElementById('favRailScroll');
        this.recentRailSection = document.getElementById('recentRailSection');
        this.recentRailScroll = document.getElementById('recentRailScroll');

        // Theater Modal
        this.theaterModal = document.getElementById('theaterModal');
        this.theaterIframe = document.getElementById('theaterIframe');
        this.theaterIframeFrame = document.getElementById('theaterIframeFrame');
        this.theaterTitle = document.getElementById('theaterTitle');
        this.theaterIcon = document.getElementById('theaterIcon');
        this.theaterGenre = document.getElementById('theaterGenre');
        this.theaterTabLink = document.getElementById('theaterTabLink');
        this.theaterControls = document.getElementById('theaterControls');
        this.theaterDesc = document.getElementById('theaterDesc');
        this.theaterSimilar = document.getElementById('theaterSimilar');

        // Action Buttons
        this.btnSurprise = document.getElementById('btnSurprise');
        this.btnFavoritesFilter = document.getElementById('btnFavoritesFilter');
        this.btnCloseTheater = document.getElementById('btnCloseTheater');
        this.btnFullscreen = document.getElementById('btnFullscreen');
        this.btnReload = document.getElementById('btnReload');
    }

    initEvents() {
        // Search Input (Debounced)
        let searchTimeout;
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.trim().toLowerCase();
                    if (this.searchClear) {
                        this.searchClear.classList.toggle('active', this.searchQuery.length > 0);
                    }
                    this.renderCatalog();
                }, 150);
            });
        }

        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.searchClear.classList.remove('active');
                this.renderCatalog();
            });
        }

        // Category Pills
        this.categoryPills.forEach(pill => {
            pill.addEventListener('click', () => {
                this.categoryPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.activeCategory = pill.dataset.category;
                this.renderCatalog();
            });
        });

        // Sort Select
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.activeSort = e.target.value;
                this.renderCatalog();
            });
        }

        // Surprise Me Button
        if (this.btnSurprise) {
            this.btnSurprise.addEventListener('click', () => {
                const randomIdx = Math.floor(Math.random() * this.games.length);
                const randomGame = this.games[randomIdx];
                this.openTheater(randomGame.id);
            });
        }

        // Header Favorites Filter
        if (this.btnFavoritesFilter) {
            this.btnFavoritesFilter.addEventListener('click', () => {
                this.categoryPills.forEach(p => p.classList.remove('active'));
                this.activeCategory = 'favorites';
                this.renderCatalog();
            });
        }

        // Theater Controls
        if (this.btnCloseTheater) {
            this.btnCloseTheater.addEventListener('click', () => this.closeTheater());
        }

        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }

        if (this.btnReload) {
            this.btnReload.addEventListener('click', () => this.reloadGame());
        }

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.theaterModal.classList.contains('hidden')) {
                this.closeTheater();
            } else if (e.key === '/' && document.activeElement !== this.searchInput) {
                e.preventDefault();
                if (this.searchInput) this.searchInput.focus();
            }
        });

        // Hash Routing
        window.addEventListener('hashchange', () => this.handleHashRouting());
    }

    handleHashRouting() {
        const hash = window.location.hash;
        if (hash.startsWith('#play/')) {
            const gameId = hash.replace('#play/', '');
            const game = getGameById(gameId);
            if (game) {
                this.openTheater(gameId);
            }
        } else if (!this.theaterModal.classList.contains('hidden')) {
            this.closeTheater(false);
        }
    }

    renderSpotlight() {
        const spotlightGame = this.games.find(g => g.id === 'fighter') || this.games[0];
        const container = document.getElementById('heroSpotlight');
        if (!container) return;

        const isFav = this.favorites.has(spotlightGame.id);

        container.innerHTML = `
            <div class="spotlight-content">
                <span class="spotlight-badge">★ FEATURED GAME OF THE DAY</span>
                <h1 class="spotlight-title">${spotlightGame.title}: ${spotlightGame.subtitle}</h1>
                <div class="spotlight-meta">
                    <span class="spotlight-rating">★ ${spotlightGame.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>${spotlightGame.genre}</span>
                    <span>•</span>
                    <span>${spotlightGame.plays} Players</span>
                </div>
                <p class="spotlight-desc">${spotlightGame.desc}</p>
                <div class="spotlight-actions">
                    <button class="btn-play-primary" onclick="window.portal.openTheater('${spotlightGame.id}')">
                        <span>▶</span>
                        <span>PLAY NOW</span>
                    </button>
                    <button class="btn-fav-spotlight" onclick="window.portal.toggleFavorite('${spotlightGame.id}', event)">
                        <span>${isFav ? '❤️' : '🤍'}</span>
                        <span>${isFav ? 'Favorited' : 'Add to Favorites'}</span>
                    </button>
                </div>
            </div>
            <div class="spotlight-preview">
                <div class="spotlight-preview-icon">${spotlightGame.icon}</div>
            </div>
        `;
    }

    toggleFavorite(gameId, event) {
        if (event) event.stopPropagation();

        if (this.favorites.has(gameId)) {
            this.favorites.delete(gameId);
        } else {
            this.favorites.add(gameId);
        }

        this.saveStorage('cgz_favorites', Array.from(this.favorites));
        this.renderFavoritesRail();
        this.renderCatalog();
        this.renderSpotlight();
    }

    recordPlay(gameId) {
        this.recents = this.recents.filter(id => id !== gameId);
        this.recents.unshift(gameId);
        if (this.recents.length > 8) this.recents.pop();
        this.saveStorage('cgz_recents', this.recents);
        this.renderRecentsRail();
    }

    renderFavoritesRail() {
        if (!this.favRailSection || !this.favRailScroll) return;
        const favGames = Array.from(this.favorites).map(id => getGameById(id)).filter(Boolean);

        if (favGames.length === 0) {
            this.favRailSection.classList.add('hidden');
            return;
        }

        this.favRailSection.classList.remove('hidden');
        this.favRailScroll.innerHTML = favGames.map(g => this.renderMiniCard(g)).join('');
    }

    renderRecentsRail() {
        if (!this.recentRailSection || !this.recentRailScroll) return;
        const recentGames = this.recents.map(id => getGameById(id)).filter(Boolean);

        if (recentGames.length === 0) {
            this.recentRailSection.classList.add('hidden');
            return;
        }

        this.recentRailSection.classList.remove('hidden');
        this.recentRailScroll.innerHTML = recentGames.map(g => this.renderMiniCard(g)).join('');
    }

    renderMiniCard(g) {
        return `
            <div class="game-card" style="min-width: 170px; max-width: 190px;" onclick="window.portal.openTheater('${g.id}')">
                <div class="card-thumb" style="height: 100px;">
                    <div class="card-icon" style="font-size: 2.6rem;">${g.icon}</div>
                </div>
                <div class="card-body" style="padding: 10px;">
                    <div class="card-title" style="font-size: 0.9rem;">${g.title}</div>
                    <div class="card-subtitle" style="font-size: 0.72rem;">${g.genre}</div>
                </div>
            </div>
        `;
    }

    getFilteredGames() {
        return this.games.filter(g => {
            // Category filter
            if (this.activeCategory === 'favorites') {
                if (!this.favorites.has(g.id)) return false;
            } else if (this.activeCategory !== 'all' && g.category !== this.activeCategory) {
                return false;
            }

            // Search query filter
            if (this.searchQuery) {
                const query = this.searchQuery;
                const matchTitle = g.title.toLowerCase().includes(query);
                const matchSubtitle = g.subtitle.toLowerCase().includes(query);
                const matchGenre = g.genre.toLowerCase().includes(query);
                const matchTags = g.tags.some(t => t.toLowerCase().includes(query));
                if (!matchTitle && !matchSubtitle && !matchGenre && !matchTags) {
                    return false;
                }
            }

            return true;
        });
    }

    getSortedGames(list) {
        const sorted = [...list];
        if (this.activeSort === 'rating') {
            sorted.sort((a, b) => b.rating - a.rating);
        } else if (this.activeSort === 'popular') {
            sorted.sort((a, b) => parseFloat(b.plays) - parseFloat(a.plays));
        } else if (this.activeSort === 'az') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        }
        return sorted;
    }

    renderCatalog() {
        if (!this.catalogGrid) return;
        const filtered = this.getFilteredGames();
        const sorted = this.getSortedGames(filtered);

        if (this.catalogCount) {
            this.catalogCount.innerHTML = `Showing <strong>${sorted.length}</strong> of ${this.games.length} games`;
        }

        if (sorted.length === 0) {
            this.catalogGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No Games Found</h3>
                    <p>No games matched your current search or category filter. Try clearing filters!</p>
                </div>
            `;
            return;
        }

        this.catalogGrid.innerHTML = sorted.map(g => this.renderGameCard(g)).join('');
    }

    renderGameCard(g) {
        const isFav = this.favorites.has(g.id);
        const badgeClass = g.badge.toLowerCase().replace(/\s+/g, '-');

        return `
            <div class="game-card" onclick="window.portal.openTheater('${g.id}')">
                <div class="card-thumb">
                    <div class="card-icon">${g.icon}</div>
                    <div class="card-badges">
                        <span class="badge-tag ${badgeClass}">${g.badge}</span>
                        <button class="btn-card-fav ${isFav ? 'active' : ''}" 
                                onclick="window.portal.toggleFavorite('${g.id}', event)" 
                                title="${isFav ? 'Remove Favorite' : 'Add to Favorites'}">
                            ${isFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-title-row">
                        <h3 class="card-title">${g.title}</h3>
                        <span class="card-rating">★ ${g.rating.toFixed(1)}</span>
                    </div>
                    <div class="card-subtitle">${g.subtitle}</div>
                    <p class="card-desc">${g.desc}</p>
                    <div class="card-footer">
                        <span class="card-genre-pill">${g.genre}</span>
                        <span class="btn-card-play">PLAY ▶</span>
                    </div>
                </div>
            </div>
        `;
    }

    openTheater(gameId) {
        const game = getGameById(gameId);
        if (!game) return;

        this.activeGame = game;
        this.recordPlay(gameId);

        // Update Modal elements
        this.theaterTitle.textContent = game.title + (game.subtitle ? `: ${game.subtitle}` : '');
        this.theaterIcon.textContent = game.icon;
        this.theaterGenre.textContent = game.genre.toUpperCase();
        this.theaterTabLink.href = game.path;
        this.theaterDesc.textContent = game.desc;
        this.theaterControls.innerHTML = `<strong>Controls:</strong> ${game.controls}`;

        // Render similar games
        const similar = this.games.filter(g => g.category === game.category && g.id !== game.id).slice(0, 4);
        this.theaterSimilar.innerHTML = similar.map(s => `
            <button class="similar-chip" onclick="window.portal.openTheater('${s.id}')">
                <span>${s.icon}</span>
                <span>${s.title}</span>
            </button>
        `).join('');

        // Set iframe source with cache buster
        this.theaterIframe.src = game.path + '?t=' + Date.now();

        // Reveal modal
        this.theaterModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Update URL hash
        if (window.location.hash !== `#play/${gameId}`) {
            history.pushState(null, '', `#play/${gameId}`);
        }
    }

    closeTheater(updateHash = true) {
        this.theaterModal.classList.add('hidden');
        this.theaterIframe.src = 'about:blank';
        document.body.style.overflow = '';
        this.activeGame = null;

        if (updateHash && window.location.hash.startsWith('#play/')) {
            history.pushState(null, '', window.location.pathname);
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.theaterIframeFrame.requestFullscreen) {
                this.theaterIframeFrame.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    reloadGame() {
        if (this.activeGame) {
            this.theaterIframe.src = this.activeGame.path + '?t=' + Date.now();
        }
    }
}

// Bootstrap portal on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.portal = new ColdGameZonePortal();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColdGameZonePortal };
}

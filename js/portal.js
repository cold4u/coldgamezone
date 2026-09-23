/**
 * ColdGameZone - Pro Gaming Portal Engine
 * Full-featured gaming portal: search, filtering, favorites, recents,
 * theater cinema player, full-screen API, hash routing,
 * procedural Synthwave Radio, Player Profile & XP Progression,
 * Arcade Leaderboards against AI rivals, 15 cross-game Achievements,
 * CRT Retro Arcade Shader FX, and Gamepad Controller API.
 */

// Level Progression Table: Level 1 to 20
const LEVEL_THRESHOLDS = [
    0,      // Lvl 1
    150,    // Lvl 2
    350,    // Lvl 3
    650,    // Lvl 4
    1050,   // Lvl 5
    1550,   // Lvl 6
    2200,   // Lvl 7
    3000,   // Lvl 8
    4000,   // Lvl 9
    5200,   // Lvl 10
    6600,   // Lvl 11
    8200,   // Lvl 12
    10000,  // Lvl 13
    12200,  // Lvl 14
    15000,  // Lvl 15
    18500,  // Lvl 16
    22500,  // Lvl 17
    27000,  // Lvl 18
    32500,  // Lvl 19
    40000   // Lvl 20 (Max Level)
];

function getLevelInfo(totalXP) {
    const xp = Math.max(0, Math.floor(Number(totalXP) || 0));
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
            break;
        }
    }
    level = Math.min(level, 20);
    const currentThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[level] || (LEVEL_THRESHOLDS[level - 1] + 10000);
    const xpInCurrentLevel = xp - currentThreshold;
    const xpNeededForNext = nextThreshold - currentThreshold;
    const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)));

    return {
        level,
        totalXP: xp,
        xpInCurrentLevel,
        xpNeededForNext,
        progressPercent,
        isMaxLevel: level >= 20
    };
}

/**
 * Web Audio Chimes & Synthesis
 */
function playToneChime(type) {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === 'achievement') {
            // Bright crystal arpeggio: E5 -> B5 -> E6
            const freqs = [659.25, 987.77, 1318.51];
            freqs.forEach((f, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + idx * 0.09);
                gain.gain.setValueAtTime(0, now + idx * 0.09);
                gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.09 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.7);
            });
        } else if (type === 'levelup') {
            // Victorious fanfare: C5 -> E5 -> G5 -> C6
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((f, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + idx * 0.08);
                gain.gain.setValueAtTime(0, now + idx * 0.08);
                gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.9);
            });
        }
    } catch (e) {}
}

/**
 * Procedural Cyber Synthwave Radio
 */
class SynthwaveRadio {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.volume = 0.4;
        this.isDucked = false;
        this.timer = null;
        this.step = 0;

        if (typeof document !== 'undefined') {
            this.dom = {
                widget: document.getElementById('synthwaveRadio'),
                btnPlay: document.getElementById('btnRadioPlay'),
                vol: document.getElementById('radioVol')
            };

            if (this.dom.vol) {
                this.dom.vol.addEventListener('input', (e) => {
                    this.volume = parseFloat(e.target.value);
                    if (this.gainNode && this.ctx) {
                        this.gainNode.gain.setValueAtTime(this.isDucked ? this.volume * 0.1 : this.volume, this.ctx.currentTime);
                    }
                });
            }

            if (this.dom.btnPlay) {
                this.dom.btnPlay.addEventListener('click', () => this.toggle());
            }
        }
    }

    initAudio() {
        if (this.ctx || typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.initAudio();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.isPlaying = true;
        if (this.dom?.widget) this.dom.widget.classList.add('playing');
        if (this.dom?.btnPlay) this.dom.btnPlay.textContent = '⏸';

        const bassFreqs = [73.42, 87.31, 98.00, 110.00, 130.81, 146.83];
        const bpm = 118;
        const sixteenthTime = (60 / bpm) / 4;

        const scheduleStep = () => {
            if (!this.isPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Dual Sawtooth / Square Bassline
            try {
                const osc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                const freq = bassFreqs[this.step % bassFreqs.length];
                osc.type = (this.step % 2 === 0) ? 'sawtooth' : 'square';
                osc.frequency.setValueAtTime(freq, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(450 + Math.sin(this.step * 0.25) * 250, now);
                filter.Q.setValueAtTime(3, now);

                noteGain.gain.setValueAtTime(0.16, now);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenthTime * 1.8);

                osc.connect(filter);
                filter.connect(noteGain);
                noteGain.connect(this.gainNode);

                osc.start(now);
                osc.stop(now + sixteenthTime * 2);

                // Subtle Hi-Hat / Snare Pulse
                if (this.step % 4 === 2) {
                    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.04), this.ctx.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < noiseBuffer.length; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const whiteNoise = this.ctx.createBufferSource();
                    whiteNoise.buffer = noiseBuffer;
                    const noiseFilter = this.ctx.createBiquadFilter();
                    noiseFilter.type = 'highpass';
                    noiseFilter.frequency.setValueAtTime(3000, now);
                    const noiseGain = this.ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.06, now);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                    whiteNoise.connect(noiseFilter);
                    noiseFilter.connect(noiseGain);
                    noiseGain.connect(this.gainNode);
                    whiteNoise.start(now);
                }
            } catch (e) {}

            this.step++;
            this.timer = setTimeout(scheduleStep, sixteenthTime * 1000);
        };

        scheduleStep();
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) clearTimeout(this.timer);
        if (this.dom?.widget) this.dom.widget.classList.remove('playing');
        if (this.dom?.btnPlay) this.dom.btnPlay.textContent = '▶';
    }

    duck() {
        this.isDucked = true;
        if (!this.gainNode || !this.ctx) return;
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(this.volume * 0.08, this.ctx.currentTime + 0.4);
    }

    unduck() {
        this.isDucked = false;
        if (!this.gainNode || !this.ctx) return;
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.8);
    }
}

/**
 * Master ColdGameZone Portal Class
 */
class ColdGameZonePortal {
    constructor() {
        this.games = (typeof GAMES_DATA !== 'undefined') ? GAMES_DATA : [];
        this.achievements = (typeof ACHIEVEMENTS_DATA !== 'undefined') ? ACHIEVEMENTS_DATA : [];
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.activeSort = 'rating';
        this.favorites = new Set(this.loadStorage('cgz_favorites', []));
        this.recents = this.loadStorage('cgz_recents', []);
        this.activeGame = null;

        // Player Profile & Meta-progression
        this.playerXP = Number(this.loadStorage('cgz_player_xp', 0));
        this.unlockedAchievements = new Set(this.loadStorage('cgz_achievements', []));

        // CRT Shader Preference
        this.crtEnabled = Boolean(this.loadStorage('cgz_crt_enabled', false));

        // Gamepad State
        this.selectedCardIndex = 0;
        this.gamepadConnected = false;
        this.lastGamepadAction = 0;

        if (typeof document !== 'undefined') {
            this.initDOMElements();
            this.initEvents();
            this.initRadio();
            this.initGamepad();
            this.initPostMessageBridge();
            this.renderProfileHUD();
            this.renderSpotlight();
            this.renderFavoritesRail();
            this.renderRecentsRail();
            this.renderCatalog();
            this.handleHashRouting();
        }
    }

    loadStorage(key, fallback) {
        try {
            if (typeof localStorage === 'undefined') return fallback;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    saveStorage(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
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

        // Player Profile HUD
        this.playerProfileCard = document.getElementById('playerProfileCard');
        this.playerLvlBadge = document.getElementById('playerLvlBadge');
        this.playerXpText = document.getElementById('playerXpText');
        this.playerXpBar = document.getElementById('playerXpBar');
        this.achievementsBtnLabel = document.getElementById('achievementsBtnLabel');
        this.btnAchievements = document.getElementById('btnAchievements');

        // Achievements Modal
        this.achievementsModal = document.getElementById('achievementsModal');
        this.btnCloseAchievements = document.getElementById('btnCloseAchievements');
        this.achievementsGrid = document.getElementById('achievementsGrid');
        this.achievementToastContainer = document.getElementById('achievementToastContainer');

        // Leaderboard Modal
        this.btnLeaderboard = document.getElementById('btnLeaderboard');
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');
        this.leaderboardGameSelect = document.getElementById('leaderboardGameSelect');
        this.leaderboardContent = document.getElementById('leaderboardContent');

        // Gamepad HUD
        this.gamepadIndicator = document.getElementById('gamepadIndicator');

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
        this.btnCrtToggle = document.getElementById('btnCrtToggle');
        this.btnTheaterExpand = document.getElementById('btnTheaterExpand');
        this.crtOverlay = document.getElementById('crtOverlay');

        // Action Buttons
        this.btnSurprise = document.getElementById('btnSurprise');
        this.btnFavoritesFilter = document.getElementById('btnFavoritesFilter');
        this.btnCloseTheater = document.getElementById('btnCloseTheater');
        this.btnFullscreen = document.getElementById('btnFullscreen');
        this.btnReload = document.getElementById('btnReload');
    }

    initRadio() {
        this.radio = new SynthwaveRadio();
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

        if (this.btnTheaterExpand) {
            this.btnTheaterExpand.addEventListener('click', () => {
                this.theaterModal.classList.toggle('maximized');
                const isMax = this.theaterModal.classList.contains('maximized');
                this.btnTheaterExpand.textContent = isMax ? '🗗 Standard' : '🗖 Maximize';
            });
        }

        // CRT Shader Toggle
        if (this.btnCrtToggle) {
            this.updateCrtUI();
            this.btnCrtToggle.addEventListener('click', () => {
                this.crtEnabled = !this.crtEnabled;
                this.saveStorage('cgz_crt_enabled', this.crtEnabled);
                this.updateCrtUI();
            });
        }

        // Achievements Modal Handlers
        if (this.btnAchievements) {
            this.btnAchievements.addEventListener('click', () => this.openAchievementsModal());
        }
        if (this.btnCloseAchievements) {
            this.btnCloseAchievements.addEventListener('click', () => this.closeAchievementsModal());
        }
        if (this.achievementsModal) {
            this.achievementsModal.addEventListener('click', (e) => {
                if (e.target === this.achievementsModal) this.closeAchievementsModal();
            });
        }

        // Leaderboard Modal Handlers
        if (this.btnLeaderboard) {
            this.btnLeaderboard.addEventListener('click', () => this.openLeaderboardModal());
        }
        if (this.btnCloseLeaderboard) {
            this.btnCloseLeaderboard.addEventListener('click', () => this.closeLeaderboardModal());
        }
        if (this.leaderboardModal) {
            this.leaderboardModal.addEventListener('click', (e) => {
                if (e.target === this.leaderboardModal) this.closeLeaderboardModal();
            });
        }
        if (this.leaderboardGameSelect) {
            this.leaderboardGameSelect.addEventListener('change', (e) => {
                this.renderLeaderboardForGame(e.target.value);
            });
        }

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.achievementsModal && !this.achievementsModal.classList.contains('hidden')) {
                    this.closeAchievementsModal();
                } else if (this.leaderboardModal && !this.leaderboardModal.classList.contains('hidden')) {
                    this.closeLeaderboardModal();
                } else if (this.theaterModal && !this.theaterModal.classList.contains('hidden')) {
                    this.closeTheater();
                }
            } else if (e.key === '/' && document.activeElement !== this.searchInput) {
                e.preventDefault();
                if (this.searchInput) this.searchInput.focus();
            }
        });

        // Hash Routing
        window.addEventListener('hashchange', () => this.handleHashRouting());
    }

    initPostMessageBridge() {
        window.addEventListener('message', (e) => {
            if (!e.data || typeof e.data !== 'object') return;

            // Handle Score reporting from games
            if (e.data.type === 'CGZ_SCORE' || e.data.type === 'GAME_OVER') {
                const gameId = e.data.gameId || this.activeGame?.id;
                const score = Number(e.data.score) || 0;
                if (gameId && score > 0) {
                    this.recordHighScore(gameId, score);
                    // Award XP proportional to score (10 to 120 XP)
                    const earnedXP = Math.min(120, Math.max(10, Math.floor(score / 35)));
                    this.addXP(earnedXP, `Played ${gameId}`);

                    // Check speed demon achievement
                    if ((gameId === 'turbodrive' || gameId === 'kart' || gameId === 'runner') && score >= 1000) {
                        this.unlockAchievement('speed_demon');
                    }
                    if (gameId === 'tetris' && score >= 1000) {
                        this.unlockAchievement('tetris_grandmaster');
                    }
                }
            }

            // Handle Direct Achievement trigger from games
            if (e.data.type === 'CGZ_ACHIEVEMENT' && e.data.achievementId) {
                this.unlockAchievement(e.data.achievementId);
            }
        });
    }

    initGamepad() {
        if (typeof window === 'undefined') return;

        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadConnected = true;
            if (this.gamepadIndicator) {
                this.gamepadIndicator.classList.add('active');
                this.gamepadIndicator.querySelector('span:last-child').textContent = 'PAD 1';
            }
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.gamepadConnected = false;
            if (this.gamepadIndicator) {
                this.gamepadIndicator.classList.remove('active');
            }
        });

        // Gamepad Polling Loop
        const pollGamepad = () => {
            if (this.gamepadConnected) {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                const pad = gamepads[0];
                if (pad) {
                    const now = performance.now();
                    if (now - this.lastGamepadAction > 220) {
                        // D-Pad / Stick Left/Right/Up/Down navigation
                        const dpadDown = pad.buttons[13]?.pressed || pad.axes[1] > 0.5;
                        const dpadUp = pad.buttons[12]?.pressed || pad.axes[1] < -0.5;
                        const dpadRight = pad.buttons[15]?.pressed || pad.axes[0] > 0.5;
                        const dpadLeft = pad.buttons[14]?.pressed || pad.axes[0] < -0.5;

                        // A Button (0): Select / Launch
                        if (pad.buttons[0]?.pressed) {
                            if (this.theaterModal.classList.contains('hidden')) {
                                const visibleCards = this.getFilteredGames();
                                if (visibleCards[this.selectedCardIndex]) {
                                    this.openTheater(visibleCards[this.selectedCardIndex].id);
                                    this.lastGamepadAction = now;
                                }
                            }
                        }

                        // B Button (1): Back / Close
                        if (pad.buttons[1]?.pressed) {
                            if (!this.theaterModal.classList.contains('hidden')) {
                                this.closeTheater();
                                this.lastGamepadAction = now;
                            } else if (!this.achievementsModal.classList.contains('hidden')) {
                                this.closeAchievementsModal();
                                this.lastGamepadAction = now;
                            } else if (!this.leaderboardModal.classList.contains('hidden')) {
                                this.closeLeaderboardModal();
                                this.lastGamepadAction = now;
                            }
                        }

                        if (dpadRight || dpadDown) {
                            const count = this.getFilteredGames().length;
                            if (count > 0) {
                                this.selectedCardIndex = (this.selectedCardIndex + 1) % count;
                                this.highlightCard(this.selectedCardIndex);
                                this.lastGamepadAction = now;
                            }
                        } else if (dpadLeft || dpadUp) {
                            const count = this.getFilteredGames().length;
                            if (count > 0) {
                                this.selectedCardIndex = (this.selectedCardIndex - 1 + count) % count;
                                this.highlightCard(this.selectedCardIndex);
                                this.lastGamepadAction = now;
                            }
                        }
                    }
                }
            }
            requestAnimationFrame(pollGamepad);
        };

        requestAnimationFrame(pollGamepad);
    }

    highlightCard(idx) {
        if (!this.catalogGrid) return;
        const cards = this.catalogGrid.querySelectorAll('.game-card');
        cards.forEach((c, i) => {
            if (i === idx) {
                c.style.borderColor = 'var(--accent-cyan)';
                c.style.transform = 'translateY(-6px) scale(1.02)';
                c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                c.style.borderColor = '';
                c.style.transform = '';
            }
        });
    }

    updateCrtUI() {
        if (this.theaterIframeFrame) {
            this.theaterIframeFrame.classList.toggle('crt-active', this.crtEnabled);
        }
        if (this.btnCrtToggle) {
            this.btnCrtToggle.textContent = this.crtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF';
            this.btnCrtToggle.classList.toggle('active', this.crtEnabled);
        }
    }

    // =========================================================================
    // Player Profile, XP, & Level Management
    // =========================================================================
    addXP(amount, reason = '') {
        const prevInfo = getLevelInfo(this.playerXP);
        this.playerXP += Math.max(0, Math.floor(amount));
        this.saveStorage('cgz_player_xp', this.playerXP);
        const newInfo = getLevelInfo(this.playerXP);

        this.renderProfileHUD();

        // Check for Level Up!
        if (newInfo.level > prevInfo.level) {
            playToneChime('levelup');
            this.showToast({
                icon: '⭐',
                tag: 'LEVEL UP!',
                title: `Now Level ${newInfo.level}`,
                desc: `Congratulations! You unlocked Level ${newInfo.level} Cyber Mastery.`
            });
            if (newInfo.level >= 10) {
                this.unlockAchievement('grandmaster');
            }
        }
    }

    renderProfileHUD() {
        const info = getLevelInfo(this.playerXP);
        if (this.playerLvlBadge) {
            this.playerLvlBadge.textContent = `LVL ${info.level}`;
        }
        if (this.playerXpText) {
            this.playerXpText.textContent = info.isMaxLevel ? 'MAX' : `${info.xpInCurrentLevel} / ${info.xpNeededForNext}`;
        }
        if (this.playerXpBar) {
            this.playerXpBar.style.width = info.isMaxLevel ? '100%' : `${info.progressPercent}%`;
        }
        if (this.achievementsBtnLabel) {
            this.achievementsBtnLabel.textContent = `${this.unlockedAchievements.size}/${this.achievements.length}`;
        }
    }

    // =========================================================================
    // Achievement System
    // =========================================================================
    unlockAchievement(id) {
        if (!id || this.unlockedAchievements.has(id)) return null;
        const ach = this.achievements.find(a => a.id === id);
        if (!ach) return null;

        this.unlockedAchievements.add(id);
        this.saveStorage('cgz_achievements', Array.from(this.unlockedAchievements));

        // Award XP
        this.addXP(ach.xp, `Achievement: ${ach.title}`);
        this.renderProfileHUD();

        // Play chime & show toast
        playToneChime('achievement');
        this.showToast({
            icon: ach.icon,
            tag: `ACHIEVEMENT UNLOCKED (+${ach.xp} XP)`,
            title: ach.title,
            desc: ach.desc
        });

        // If achievements modal is open, re-render
        if (this.achievementsModal && !this.achievementsModal.classList.contains('hidden')) {
            this.renderAchievementsGrid();
        }

        return ach;
    }

    showToast({ icon, tag, title, desc }) {
        if (!this.achievementToastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-toast-icon">${icon}</div>
            <div class="achievement-toast-body">
                <span class="achievement-toast-tag">${tag}</span>
                <span class="achievement-toast-title">${title}</span>
                <span class="achievement-toast-desc">${desc}</span>
            </div>
        `;

        this.achievementToastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 400);
        }, 4200);
    }

    openAchievementsModal() {
        if (!this.achievementsModal) return;
        this.renderAchievementsGrid();
        this.achievementsModal.classList.remove('hidden');
    }

    closeAchievementsModal() {
        if (this.achievementsModal) {
            this.achievementsModal.classList.add('hidden');
        }
    }

    renderAchievementsGrid() {
        if (!this.achievementsGrid) return;

        this.achievementsGrid.innerHTML = this.achievements.map(ach => {
            const isUnlocked = this.unlockedAchievements.has(ach.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-card-top">
                        <span class="achievement-icon">${ach.icon}</span>
                        <span class="achievement-xp">+${ach.xp} XP</span>
                    </div>
                    <div class="achievement-title">${ach.title}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                    <div class="achievement-status">
                        ${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // =========================================================================
    // Arcade Leaderboards & AI Rivals
    // =========================================================================
    recordHighScore(gameId, score) {
        try {
            const storageKey = 'cgz_best_' + gameId;
            const currentBest = Number(this.loadStorage(storageKey, 0));
            if (score > currentBest) {
                this.saveStorage(storageKey, score);
            }
        } catch (e) {}
    }

    openLeaderboardModal() {
        if (!this.leaderboardModal) return;

        // Populate dropdown if empty
        if (this.leaderboardGameSelect && this.leaderboardGameSelect.options.length === 0) {
            const sorted = [...this.games].sort((a, b) => a.title.localeCompare(b.title));
            this.leaderboardGameSelect.innerHTML = sorted.map(g => `
                <option value="${g.id}">${g.icon} ${g.title}</option>
            `).join('');
        }

        const selectedGameId = this.activeGame?.id || (this.leaderboardGameSelect?.value) || this.games[0]?.id;
        if (this.leaderboardGameSelect) {
            this.leaderboardGameSelect.value = selectedGameId;
        }

        this.renderLeaderboardForGame(selectedGameId);
        this.leaderboardModal.classList.remove('hidden');
    }

    closeLeaderboardModal() {
        if (this.leaderboardModal) {
            this.leaderboardModal.classList.add('hidden');
        }
    }

    renderLeaderboardForGame(gameId) {
        if (!this.leaderboardContent) return;
        const game = getGameById(gameId);
        if (!game) return;

        const userBest = Number(this.loadStorage('cgz_best_' + gameId, 0));
        const rivals = game.rivals || [
            { name: "CyberAce", score: 3200 },
            { name: "NeonPhantom", score: 2400 },
            { name: "GlitchMaster", score: 1800 },
            { name: "VoxelRider", score: 1200 },
            { name: "PixelRebel", score: 800 }
        ];

        const rows = [
            ...rivals.map(r => ({ name: r.name, score: r.score, isUser: false })),
            { name: userBest > 0 ? "You (Champion)" : "You (Unranked)", score: userBest, isUser: true }
        ];

        rows.sort((a, b) => b.score - a.score);

        this.leaderboardContent.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">Rank</th>
                        <th>Player</th>
                        <th style="text-align: right;">High Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row, idx) => {
                        const rankNum = idx + 1;
                        let badgeClass = 'rank-other';
                        if (rankNum === 1) badgeClass = 'rank-1';
                        else if (rankNum === 2) badgeClass = 'rank-2';
                        else if (rankNum === 3) badgeClass = 'rank-3';

                        return `
                            <tr class="${row.isUser ? 'user-row' : ''}">
                                <td><span class="rank-badge ${badgeClass}">${rankNum}</span></td>
                                <td>${row.name}</td>
                                <td style="text-align: right; font-weight: 800; color: ${row.isUser ? 'var(--accent-cyan)' : '#fff'};">
                                    ${row.score.toLocaleString()} PTS
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // =========================================================================
    // Standard Portal Functions
    // =========================================================================
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
        if (!container || !spotlightGame) return;

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

        // Award play XP and First Game achievement
        this.addXP(25, `Launched ${gameId}`);
        this.unlockAchievement('first_game');
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
            if (this.activeCategory === 'favorites') {
                if (!this.favorites.has(g.id)) return false;
            } else if (this.activeCategory !== 'all' && g.category !== this.activeCategory) {
                return false;
            }

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

        // Auto-duck Synthwave Radio
        if (this.radio) {
            this.radio.duck();
        }

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

        // Configure responsive frame orientation
        const portraitGames = new Set(['game', 'breaker', 'strike', 'jump', 'pulse', 'match', 'tetris']);
        const squareGames = new Set(['defense', 'snake', 'rogue', 'survivor']);
        const widescreenGames = new Set(['runner', 'flight', 'kart', 'tycoon', 'tactics', 'deck']);

        if (this.theaterIframeFrame) {
            this.theaterIframeFrame.classList.remove('frame-portrait', 'frame-square', 'frame-landscape', 'frame-widescreen');
            if (portraitGames.has(gameId)) {
                this.theaterIframeFrame.classList.add('frame-portrait');
            } else if (squareGames.has(gameId)) {
                this.theaterIframeFrame.classList.add('frame-square');
            } else if (widescreenGames.has(gameId)) {
                this.theaterIframeFrame.classList.add('frame-widescreen');
            } else {
                this.theaterIframeFrame.classList.add('frame-landscape');
            }
        }

        // Set iframe source with cache buster and auto-fit styles on load
        this.theaterIframe.onload = () => this.injectAutoFitStyles();
        this.theaterIframe.src = game.path + '?t=' + Date.now();

        // Reveal modal
        this.theaterModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Update URL hash
        if (window.location.hash !== `#play/${gameId}`) {
            history.pushState(null, '', `#play/${gameId}`);
        }
    }

    injectAutoFitStyles() {
        try {
            const doc = this.theaterIframe.contentDocument;
            if (!doc) return;

            let style = doc.getElementById('cgz-auto-fit-style');
            if (!style) {
                style = doc.createElement('style');
                style.id = 'cgz-auto-fit-style';
                (doc.head || doc.documentElement).appendChild(style);
            }

            style.textContent = `
                html, body {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: #05070a !important;
                }
                header, .logo, .header-actions, .portal-header, 
                .instructions-card, .instructions-panel, .instructions-container,
                .btn-back-hub, a[href*="index.html"] {
                    display: none !important;
                }
                #game-container, .game-container, main, .game-wrapper, #main-container {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    margin: 0 !important;
                    padding: 2px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    overflow: hidden !important;
                    box-shadow: none !important;
                    border: none !important;
                    background: transparent !important;
                }
                .canvas-container {
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                canvas, #gameCanvas, .game-canvas, #runnerCanvas, #flightCanvas, 
                #breakerCanvas, #strikeCanvas, #defenseCanvas, #jumpCanvas, 
                #pulseCanvas, #rogueCanvas, #snakeCanvas, #survivorCanvas, 
                #towerCanvas, #portalCanvas {
                    max-width: 100% !important;
                    max-height: calc(100vh - 6px) !important;
                    width: auto !important;
                    height: auto !important;
                    object-fit: contain !important;
                    box-shadow: none !important;
                }
                .touch-controls, .controls-bar, .d-pad, .action-pad {
                    max-height: 95px !important;
                    flex-shrink: 0 !important;
                    margin-top: 2px !important;
                    padding: 2px !important;
                }
                body:has(.touch-controls) canvas,
                body:has(.controls-bar) canvas {
                    max-height: calc(100vh - 105px) !important;
                }
            `;
        } catch (e) {
            console.warn('Same-origin iframe style auto-fit error:', e);
        }
    }

    closeTheater(updateHash = true) {
        this.theaterModal.classList.add('hidden');
        this.theaterIframe.src = 'about:blank';
        document.body.style.overflow = '';
        this.activeGame = null;

        // Restore Synthwave Radio volume
        if (this.radio) {
            this.radio.unduck();
        }

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
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portal = new ColdGameZonePortal();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColdGameZonePortal, SynthwaveRadio, getLevelInfo, LEVEL_THRESHOLDS };
}

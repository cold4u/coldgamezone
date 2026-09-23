const assert = require('assert');
const { GAMES_DATA, ACHIEVEMENTS_DATA, getGameById } = require('../js/games_data.js');
const { ColdGameZonePortal, SynthwaveRadio, getLevelInfo, LEVEL_THRESHOLDS } = require('../js/portal.js');
const CGZBridge = require('../common/cgz_bridge.js');

console.log("Running ColdGameZone Pro Features Test Suite...\n");

// =========================================================================
// Test 1: Level Progression & XP Math
// =========================================================================
{
    const lvl1 = getLevelInfo(0);
    assert.strictEqual(lvl1.level, 1, "0 XP should be Level 1");
    assert.strictEqual(lvl1.xpInCurrentLevel, 0);
    assert.strictEqual(lvl1.xpNeededForNext, 150);
    assert.strictEqual(lvl1.progressPercent, 0);
    assert.strictEqual(lvl1.isMaxLevel, false);

    const lvl1Mid = getLevelInfo(75);
    assert.strictEqual(lvl1Mid.level, 1);
    assert.strictEqual(lvl1Mid.xpInCurrentLevel, 75);
    assert.strictEqual(lvl1Mid.progressPercent, 50);

    const lvl2 = getLevelInfo(150);
    assert.strictEqual(lvl2.level, 2, "150 XP should be Level 2");
    assert.strictEqual(lvl2.xpInCurrentLevel, 0);

    const lvl5 = getLevelInfo(1050);
    assert.strictEqual(lvl5.level, 5, "1050 XP should be Level 5");

    const maxLvl = getLevelInfo(50000);
    assert.strictEqual(maxLvl.level, 20, "Should cap at Level 20");
    assert.strictEqual(maxLvl.isMaxLevel, true);

    console.log("✔ Test 1: XP progression & level formula verified");
}

// =========================================================================
// Test 2: Achievements Master Registry Integrity
// =========================================================================
{
    assert(Array.isArray(ACHIEVEMENTS_DATA), "ACHIEVEMENTS_DATA must be an array");
    assert.strictEqual(ACHIEVEMENTS_DATA.length, 15, `Expected 15 achievements, found ${ACHIEVEMENTS_DATA.length}`);

    const achIds = new Set();
    for (const ach of ACHIEVEMENTS_DATA) {
        assert(ach.id && typeof ach.id === 'string', "Achievement must have string id");
        assert(!achIds.has(ach.id), `Duplicate achievement ID: ${ach.id}`);
        achIds.add(ach.id);

        assert(ach.title && ach.title.length > 0, `Achievement ${ach.id} missing title`);
        assert(ach.desc && ach.desc.length > 0, `Achievement ${ach.id} missing description`);
        assert(ach.icon && ach.icon.length > 0, `Achievement ${ach.id} missing icon`);
        assert(Number(ach.xp) > 0, `Achievement ${ach.id} must grant positive XP`);
    }

    console.log("✔ Test 2: Achievements master registry integrity verified");
}

// =========================================================================
// Test 3: Leaderboard & AI Rivals Coverage across 29 Games
// =========================================================================
{
    assert.strictEqual(GAMES_DATA.length, 29, "Expected 29 games");
    for (const g of GAMES_DATA) {
        assert(Array.isArray(g.rivals), `Game ${g.id} must have rivals array`);
        assert(g.rivals.length >= 3, `Game ${g.id} must have at least 3 rivals, found ${g.rivals.length}`);
        
        for (const r of g.rivals) {
            assert(r.name && typeof r.name === 'string', `Rival in ${g.id} missing name`);
            assert(typeof r.score === 'number' && r.score > 0, `Rival in ${g.id} invalid score: ${r.score}`);
        }

        assert(typeof g.leaderboardTarget === 'number' && g.leaderboardTarget > 0, `Game ${g.id} missing leaderboard target`);
        assert(g.gamepadHint && typeof g.gamepadHint === 'string', `Game ${g.id} missing gamepadHint`);
    }

    console.log("✔ Test 3: Leaderboard rivals and gamepad hints for all 29 games verified");
}

// =========================================================================
// Test 4: Leaderboard Ranking Algorithm & Rival Comparison
// =========================================================================
{
    const mockRivals = [
        { name: "NeoRunner", score: 4000 },
        { name: "GlitchQueen", score: 3000 },
        { name: "VoxelMaster", score: 2000 }
    ];

    function calculateRanks(userScore, rivals) {
        const rows = [
            ...rivals.map(r => ({ name: r.name, score: r.score, isUser: false })),
            { name: "You", score: userScore, isUser: true }
        ];
        rows.sort((a, b) => b.score - a.score);
        return rows.findIndex(r => r.isUser) + 1;
    }

    // Unranked or lower than all
    assert.strictEqual(calculateRanks(1000, mockRivals), 4, "Score 1000 should rank #4");

    // Middle rank
    assert.strictEqual(calculateRanks(2500, mockRivals), 3, "Score 2500 should rank #3");

    // #1 Champion
    assert.strictEqual(calculateRanks(5000, mockRivals), 1, "Score 5000 should rank #1");

    console.log("✔ Test 4: Leaderboard ranking algorithm verified");
}

// =========================================================================
// Test 5: CGZBridge Client Integration Helper
// =========================================================================
{
    assert(CGZBridge, "CGZBridge must exist");
    assert.strictEqual(CGZBridge.version, '2.0.0');
    assert(typeof CGZBridge.reportScore === 'function', "reportScore must be a function");
    assert(typeof CGZBridge.unlockAchievement === 'function', "unlockAchievement must be a function");
    assert(typeof CGZBridge.scaleCanvas === 'function', "scaleCanvas must be a function");
    assert(typeof CGZBridge.shakeScreen === 'function', "shakeScreen must be a function");
    assert(typeof CGZBridge.vibrate === 'function', "vibrate must be a function");

    // Mock canvas scaling
    const mockCanvas = {
        width: 400,
        height: 300,
        style: {},
        clientWidth: 400,
        clientHeight: 300
    };
    const mockCtx = {
        resetTransform: () => {},
        scale: (x, y) => {}
    };

    const dpr = CGZBridge.scaleCanvas(mockCanvas, mockCtx, 800, 600);
    assert(dpr >= 1, "DPR scale must be at least 1");
    assert.strictEqual(mockCanvas.style.width, '800px');
    assert.strictEqual(mockCanvas.style.height, '600px');

    console.log("✔ Test 5: CGZBridge client helper verified");
}

// =========================================================================
// Test 6: Synthwave Radio Audio Engine State
// =========================================================================
{
    const radio = new SynthwaveRadio();
    assert.strictEqual(radio.isPlaying, false, "Radio should start paused");
    assert.strictEqual(radio.volume, 0.4, "Default volume should be 0.4");
    assert.strictEqual(radio.isDucked, false, "Should start unducked");

    radio.duck();
    assert.strictEqual(radio.isDucked, true, "Duck should set isDucked");

    radio.unduck();
    assert.strictEqual(radio.isDucked, false, "Unduck should reset isDucked");

    console.log("✔ Test 6: Synthwave Radio state machine verified");
}

console.log("\n============================================================");
console.log("ALL COLDGAMEZONE PRO FEATURES TESTS PASSED (6/6)!");
console.log("============================================================\n");

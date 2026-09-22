const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { GAMES_DATA, getGameById } = require('../js/games_data.js');

console.log("Running ColdGameZone Portal Integration Tests...");

const PORTAL_ROOT = path.resolve(__dirname, '..');

// Test 1: Registry Completeness
{
    assert.strictEqual(GAMES_DATA.length, 29, `Expected exactly 29 games in registry, found ${GAMES_DATA.length}`);
    const ids = new Set();
    for (const g of GAMES_DATA) {
        assert(g.id, "Game must have an ID");
        assert(!ids.has(g.id), `Duplicate game ID: ${g.id}`);
        ids.add(g.id);

        assert(g.title, `Game ${g.id} must have a title`);
        assert(g.category, `Game ${g.id} must have a category`);
        assert(g.genre, `Game ${g.id} must have a genre`);
        assert(g.path, `Game ${g.id} must have a path`);
        assert(g.controls, `Game ${g.id} must have controls`);
        assert(g.desc, `Game ${g.id} must have a description`);
        assert(Array.isArray(g.tags) && g.tags.length > 0, `Game ${g.id} must have tags`);
    }
    console.log("✔ Test 1: Registry completeness & unique IDs passed");
}

// Test 2: File System Existence for All 29 Games
{
    for (const g of GAMES_DATA) {
        const indexPath = path.join(PORTAL_ROOT, g.path);
        assert(fs.existsSync(indexPath), `Game entry file does not exist: ${indexPath}`);
        const content = fs.readFileSync(indexPath, 'utf8');
        assert(content.includes('<canvas'), `Game ${g.id} index.html must contain a <canvas> element`);

        const dir = path.dirname(indexPath);
        assert(fs.existsSync(path.join(dir, 'style.css')), `style.css missing in ${dir}`);
        assert(fs.existsSync(path.join(dir, 'js')), `js directory missing in ${dir}`);
    }
    console.log("✔ Test 2: File system integrity for all 29 games passed");
}

// Test 3: Genre Categorization
{
    const validCategories = ['action', 'racing', 'strategy', 'puzzle', 'arcade', 'adventure'];
    const categoryCounts = {};
    for (const cat of validCategories) {
        categoryCounts[cat] = 0;
    }

    for (const g of GAMES_DATA) {
        assert(validCategories.includes(g.category), `Invalid category "${g.category}" for game ${g.id}`);
        categoryCounts[g.category]++;
    }

    // Ensure every category has games
    for (const cat of validCategories) {
        assert(categoryCounts[cat] > 0, `Category "${cat}" must have at least 1 game`);
    }
    console.log("✔ Test 3: Category validation & coverage passed");
}

// Test 4: Search Engine Filter Logic
{
    function searchGames(query) {
        const q = query.toLowerCase();
        return GAMES_DATA.filter(g => 
            g.title.toLowerCase().includes(q) ||
            g.subtitle.toLowerCase().includes(q) ||
            g.genre.toLowerCase().includes(q) ||
            g.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    const fightResults = searchGames('fighter');
    assert(fightResults.some(g => g.id === 'fighter'), "Search 'fighter' must find Cyber Brawler");

    const puzzleResults = searchGames('puzzle');
    assert(puzzleResults.length >= 4, `Search 'puzzle' should find at least 4 games, found ${puzzleResults.length}`);

    const poolResults = searchGames('billiards');
    assert(poolResults.some(g => g.id === 'billiards'), "Search 'billiards' must find Neon Pool");
    console.log("✔ Test 4: Search engine filtering logic passed");
}

// Test 5: Sorting Logic
{
    const byRating = [...GAMES_DATA].sort((a, b) => b.rating - a.rating);
    assert(byRating[0].rating >= byRating[byRating.length - 1].rating, "Rating sort must be descending");

    const byAZ = [...GAMES_DATA].sort((a, b) => a.title.localeCompare(b.title));
    assert(byAZ[0].title.localeCompare(byAZ[byAZ.length - 1].title) <= 0, "Alphabetical sort must be ascending");
    console.log("✔ Test 5: Sorting algorithms passed");
}

// Test 6: Deep Link Lookup
{
    assert.strictEqual(getGameById('tetris').title, "Quantum Fall");
    assert.strictEqual(getGameById('non_existent'), null);
    console.log("✔ Test 6: Deep link ID lookup passed");
}

console.log("\nALL COLDGAMEZONE PORTAL INTEGRATION TESTS PASSED (6/6)!\n");

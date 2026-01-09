// --- CONFIGURATION ET SAUVEGARDE ---

// DEFINITION DES PROBABILITÉS
const DROP_RATES_SLOT_4 = [
    { rarity: "2_diamond", weight: 90000 },
    { rarity: "3_diamond", weight: 5000 },
    { rarity: "4_diamond", weight: 1666 },
    { rarity: "1_star",    weight: 2572 },
    { rarity: "2_star",    weight: 500 },
    { rarity: "3_star",    weight: 222 },
    { rarity: "crown",     weight: 40 }
];

const DROP_RATES_SLOT_5 = [
    { rarity: "2_diamond", weight: 60000 },
    { rarity: "3_diamond", weight: 20000 },
    { rarity: "4_diamond", weight: 6664 },
    { rarity: "1_star",    weight: 10288 },
    { rarity: "2_star",    weight: 2000 },
    { rarity: "3_star",    weight: 888 },
    { rarity: "crown",     weight: 160 }
];

const RARITY_DATA = {
    "crown":      { symbol: "👑", label: "Gold Rare", rank: 10, css: "rarity-crown", group: "crown" },
    "2_chrom":    { symbol: "✨✨", label: "Chromatique Rare", rank: 9, css: "rarity-2_chrom", group: "chrom" },
    "1_chrom":    { symbol: "✨", label: "Chromatique", rank: 8, css: "rarity-1_chrom", group: "chrom" },
    "3_star":     { symbol: "⭐⭐⭐", label: "Immersive Rare", rank: 7, css: "rarity-3_star", group: "star" },
    "2_star":     { symbol: "⭐⭐", label: "Super Rare (Full Art)", rank: 6, css: "rarity-2_star", group: "star" },
    "1_star":     { symbol: "⭐", label: "Illustration Rare", rank: 5, css: "rarity-1_star", group: "star" },
    "4_diamond":  { symbol: "♦♦♦♦", label: "Ultra Rare (ex)", rank: 4, css: "rarity-4_diamond", group: "diamond" },
    "3_diamond":  { symbol: "♦♦♦", label: "Rare", rank: 3, css: "rarity-diamond", group: "diamond" },
    "2_diamond":  { symbol: "♦♦", label: "Peu Commune", rank: 2, css: "rarity-diamond", group: "diamond" },
    "1_diamond":  { symbol: "♦", label: "Commune", rank: 1, css: "rarity-common", group: "diamond" },
    "promo":      { symbol: "P", label: "Promo", rank: 0, css: "rarity-common", group: "diamond" }
};

let boosterOpenedCount = parseInt(localStorage.getItem('tcg_pocket_booster_count')) || 0;
let userCollection = JSON.parse(localStorage.getItem('tcg_pocket_save')) || {};
let currentSet = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderHome();
});

function updateUI() {
    let totalCollected = 0;
    let totalCardsInGame = 0;
    if (typeof CARDS_DB !== 'undefined') {
        for (const ext in CARDS_DB) {
            totalCardsInGame += CARDS_DB[ext].length;
            if (userCollection[ext]) {
                totalCollected += new Set(userCollection[ext]).size;
            }
        }
    }
    const elBooster = document.getElementById('booster-count');
    const elCol = document.getElementById('collection-count');
    const elTot = document.getElementById('total-cards-count');
    const elHeadTot = document.getElementById('total-collected');

    if(elBooster) elBooster.textContent = boosterOpenedCount;
    if(elCol) elCol.textContent = totalCollected;
    if(elTot) elTot.textContent = totalCardsInGame;
    if(elHeadTot) elHeadTot.textContent = totalCollected;
}

function resetCollection() {
    if (confirm("Attention : Voulez-vous vraiment TOUT effacer ?")) {
        localStorage.removeItem('tcg_pocket_save');
        localStorage.removeItem('tcg_pocket_booster_count'); 
        userCollection = {};
        boosterOpenedCount = 0; 
        updateUI(); 
        if(currentSet) renderCards('all');
        else renderHome();
    }
}

// --- NAVIGATION ---
function renderHome() {
    const container = document.getElementById('sets-container');
    if(!container) return;
    container.innerHTML = '';
    
    Object.keys(CARDS_DB).forEach(setName => {
        const totalCards = CARDS_DB[setName].length;
        const ownedCards = userCollection[setName] ? new Set(userCollection[setName]).size : 0;
        const percent = Math.round((ownedCards / totalCards) * 100);
        
        const setDiv = document.createElement('div');
        setDiv.className = 'set-card';
        setDiv.onclick = () => openSetView(setName);

        setDiv.innerHTML = `
            <img src="covers/${setName}.webp" class="set-cover" onerror="this.src='https://via.placeholder.com/300?text=No+Cover'">
            <div class="set-info">
                <span class="set-name">${formatName(setName)}</span>
                <div class="set-stats"><span>${ownedCards}/${totalCards}</span><span>${percent}%</span></div>
                <div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div>
            </div>
        `;
        container.appendChild(setDiv);
    });
}

function formatName(str) { return str.replace(/-/g, ' ').toUpperCase(); }

function openSetView(setName) {
    currentSet = setName;
    currentFilter = 'all';
    document.getElementById('sets-container').classList.add('hidden');
    document.getElementById('set-detail-view').classList.remove('hidden');
    document.getElementById('current-set-title').innerText = formatName(setName);
    
    document.querySelectorAll('.view-toggles button').forEach(b => b.classList.remove('active'));
    document.querySelector(`.view-toggles button[onclick="filterView('all')"]`).classList.add('active');
    renderCards('all');
}

function goHome() {
    document.getElementById('set-detail-view').classList.add('hidden');
    document.getElementById('sets-container').classList.remove('hidden');
    renderHome();
}

// --- LOGIQUE D'OUVERTURE AUTOMATIQUE & RAPIDE ---
let tempDrawnCards = []; 

// --- LOGIQUE D'OUVERTURE RAPIDE ---
function initBoosterOpening() {
    const overlay = document.getElementById('booster-scene-overlay');
    const packContainer = document.getElementById('pack-container');
    const cardsContainer = document.getElementById('opened-cards-container');
    const buttons = document.getElementById('scene-buttons');

    // 1. Cacher le booster immédiatement et préparer l'interface
    packContainer.style.display = 'none'; 
    cardsContainer.classList.remove('hidden');
    buttons.classList.add('hidden');
    
    // 2. Tirage des cartes selon les taux de drop
    tempDrawnCards = drawBoosterPack(); 
    
    boosterOpenedCount++;
    localStorage.setItem('tcg_pocket_booster_count', boosterOpenedCount);
    updateUI();

    // 3. Affichage et lancement immédiat de la révélation des cartes
    overlay.classList.remove('hidden');
    prepareCardsForReveal();
}

function prepareCardsForReveal() {
    const container = document.getElementById('opened-cards-container');
    container.innerHTML = ''; 

    tempDrawnCards.forEach((cardObj) => {
        const rarityInfo = RARITY_DATA[cardObj.rarity] || RARITY_DATA["1_diamond"];
        
        let glowClass = '';
        if (rarityInfo.group === 'crown') glowClass = 'glow-crown';
        else if (rarityInfo.group === 'chrom') glowClass = 'glow-chrom';
        else if (rarityInfo.group === 'star') glowClass = 'glow-star';
        else if (rarityInfo.group === 'diamond') glowClass = 'glow-diamond';

        const scene = document.createElement('div');
        // L'aura est mise sur la scène pour être visible devant et derrière
        scene.className = `card-scene ${glowClass}`; 
        
        scene.innerHTML = `
            <div class="card-object">
                <div class="card-face face-back"></div>
                <div class="card-face face-front">
                    <img src="img/${currentSet}/${cardObj.id}">
                </div>
            </div>
        `;
        container.appendChild(scene);
    });

    // Retournement automatique instantané après un micro-délai
    setTimeout(() => {
        const allScenes = container.querySelectorAll('.card-scene');
        allScenes.forEach(scene => scene.classList.add('is-flipped'));
        document.getElementById('scene-buttons').classList.remove('hidden');
    }, 50);
}

function closeBoosterScene() {
    document.getElementById('booster-scene-overlay').classList.add('hidden');
    renderCards(currentFilter);
}

function replayBooster() {
    initBoosterOpening();
}

// --- ALGORITHME DE DROP ---
function drawBoosterPack() {
    const setCards = CARDS_DB[currentSet];
    const drawn = [];
    if(!userCollection[currentSet]) userCollection[currentSet] = [];

    const cardsByRarity = {};
    setCards.forEach(card => {
        if (!cardsByRarity[card.rarity]) cardsByRarity[card.rarity] = [];
        cardsByRarity[card.rarity].push(card);
    });

    for(let i=0; i<3; i++) {
        drawn.push(pickRandomCardFromRarity("1_diamond", cardsByRarity));
    }

    const rarity4 = pickRarityFromTable(DROP_RATES_SLOT_4);
    drawn.push(pickRandomCardFromRarity(rarity4, cardsByRarity));

    const rarity5 = pickRarityFromTable(DROP_RATES_SLOT_5);
    drawn.push(pickRandomCardFromRarity(rarity5, cardsByRarity));

    drawn.forEach(c => userCollection[currentSet].push(c.id));
    localStorage.setItem('tcg_pocket_save', JSON.stringify(userCollection));
    
    return drawn;
}

function pickRarityFromTable(table) {
    let totalWeight = 0;
    table.forEach(entry => totalWeight += entry.weight);
    let randomVal = Math.random() * totalWeight;
    for (const entry of table) {
        if (randomVal < entry.weight) {
            return entry.rarity;
        }
        randomVal -= entry.weight;
    }
    return table[0].rarity; 
}

function pickRandomCardFromRarity(rarityTarget, cardsMap) {
    if (cardsMap[rarityTarget] && cardsMap[rarityTarget].length > 0) {
        const pool = cardsMap[rarityTarget];
        return pool[Math.floor(Math.random() * pool.length)];
    }
    const fallbackOrder = ["crown", "3_star", "2_star", "1_star", "4_diamond", "3_diamond", "2_diamond", "1_diamond"];
    let currentIndex = fallbackOrder.indexOf(rarityTarget);
    for(let i = currentIndex + 1; i < fallbackOrder.length; i++) {
        const nextRarity = fallbackOrder[i];
        if (cardsMap[nextRarity] && cardsMap[nextRarity].length > 0) {
            const pool = cardsMap[nextRarity];
            return pool[Math.floor(Math.random() * pool.length)];
        }
    }
    return { id: "error.png", rarity: "1_diamond" };
}

function renderCards(filter) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    
    let allCards = [...CARDS_DB[currentSet]]; 

    allCards.sort((a, b) => {
        const numA = parseInt(a.id.match(/\d+/)[0]);
        const numB = parseInt(b.id.match(/\d+/)[0]);
        return numA - numB;
    });

    const userCards = userCollection[currentSet] || [];

    allCards.forEach(cardObj => {
        const filename = cardObj.id;
        const rarityKey = cardObj.rarity;
        const isOwned = userCards.includes(filename);
        
        if (filter === 'owned' && !isOwned) return;
        if (filter === 'missing' && isOwned) return;

        const rInfo = RARITY_DATA[rarityKey] || RARITY_DATA["1_diamond"];
        const rawNum = parseInt(filename.match(/\d+/)[0]);
        const formattedNum = "#" + rawNum.toString().padStart(3, '0');

        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${isOwned ? '' : 'missing'}`;
        
        cardDiv.innerHTML = `
            <img src="img/${currentSet}/${filename}" loading="lazy" alt="${filename}">
            <span class="card-number">${formattedNum}</span>
            <div class="card-info">
                <div class="rarity-symbol ${rInfo.css || ''}" title="${rInfo.label}">
                    ${rInfo.symbol}
                </div>
            </div>
        `;
        
        if(isOwned) {
            cardDiv.onclick = () => window.open(`img/${currentSet}/${filename}`, '_blank');
        }
        grid.appendChild(cardDiv);
    });
}

function filterView(type) {
    currentFilter = type;
    document.querySelectorAll('.view-toggles button').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.view-toggles button[onclick="filterView('${type}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    renderCards(currentFilter);
}
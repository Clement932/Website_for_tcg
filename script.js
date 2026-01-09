// --- CONFIGURATION ---

const DROP_RATES_SLOT_4 = [
    { rarity: "2_diamond", weight: 90000 },
    { rarity: "3_diamond", weight: 5000 },
    { rarity: "4_diamond", weight: 1666 },
    { rarity: "1_star",    weight: 2572 },
    { rarity: "2_star",    weight: 500 },
    { rarity: "3_star",    weight: 222 },
    { rarity: "1_chrom",   weight: 100 },
    { rarity: "2_chrom",   weight: 50 },
    { rarity: "crown",     weight: 40 }
];

const DROP_RATES_SLOT_5 = [
    { rarity: "2_diamond", weight: 60000 },
    { rarity: "3_diamond", weight: 20000 },
    { rarity: "4_diamond", weight: 6664 },
    { rarity: "1_star",    weight: 10288 },
    { rarity: "2_star",    weight: 2000 },
    { rarity: "3_star",    weight: 888 },
    { rarity: "1_chrom",  weight: 400 },
    { rarity: "2_chrom",  weight: 200 },
    { rarity: "crown",     weight: 160 }
];

const DROP_RATES_GOD_PACK = [
    { rarity: "1_star",    weight: 600 },
    { rarity: "2_star",    weight: 200 },
    { rarity: "3_star",    weight: 100 },
    { rarity: "1_chrom",   weight: 50 },
    { rarity: "2_chrom",   weight: 25 },
    { rarity: "crown",     weight: 25 }
];

// Configuration des Raretés (Rank pour le tri, Cost pour la boutique)
const RARITY_DATA = {
    "crown":      { symbol: "👑", label: "Gold Rare", rank: 11, css: "rarity-crown", group: "crown", cost: 2500, sell: 500 },
    "2_chrom":    { symbol: "✨✨", label: "Chromatique Rare", rank: 10, css: "rarity-chrom", group: "chrom", cost: 1500, sell: 300 },
    "1_chrom":    { symbol: "✨", label: "Chromatique", rank: 9, css: "rarity-chrom", group: "chrom", cost: 1000, sell: 200 },
    "3_star":     { symbol: "⭐⭐⭐", label: "Immersive Rare", rank: 8, css: "rarity-star", group: "star", cost: 800, sell: 150 },
    "2_star":     { symbol: "⭐⭐", label: "Full Art", rank: 7, css: "rarity-star", group: "star", cost: 500, sell: 100 },
    "1_star":     { symbol: "⭐", label: "Illustration Rare", rank: 6, css: "rarity-star", group: "star", cost: 300, sell: 50 },
    "4_diamond":  { symbol: "♦♦♦♦", label: "ex", rank: 5, css: "rarity-diamond", group: "diamond", cost: 150, sell: 25 },
    "3_diamond":  { symbol: "♦♦♦", label: "Rare", rank: 4, css: "rarity-diamond", group: "diamond", cost: 70, sell: 10 },
    "2_diamond":  { symbol: "♦♦", label: "Peu Commune", rank: 3, css: "rarity-diamond", group: "diamond", cost: 35, sell: 5 },
    "1_diamond":  { symbol: "♦", label: "Commune", rank: 2, css: "rarity-diamond", group: "diamond", cost: 15, sell: 2 },
    "promo":      { symbol: "P", label: "Promo", rank: 1, css: "rarity-diamond", group: "diamond", cost: 500, sell: 0 }
};

// State
let boosterOpenedCount = parseInt(localStorage.getItem('tcg_pocket_booster_count')) || 0;
let userCurrency = parseInt(localStorage.getItem('tcg_pocket_currency')) || 0;
// Structure : { "nom-set": { "1.png": 2, "2.png": 1 } }
let userCollection = JSON.parse(localStorage.getItem('tcg_pocket_collection_v2')) || {}; 

// Migration ancienne sauvegarde (tableau vers objets) si nécessaire
const oldSave = localStorage.getItem('tcg_pocket_save');
if (oldSave && Object.keys(userCollection).length === 0) {
    const parsedOld = JSON.parse(oldSave);
    Object.keys(parsedOld).forEach(set => {
        userCollection[set] = {};
        parsedOld[set].forEach(id => {
            userCollection[set][id] = (userCollection[set][id] || 0) + 1;
        });
    });
    localStorage.removeItem('tcg_pocket_save');
    saveData();
}

let currentSet = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    renderHome();
});

function saveData() {
    localStorage.setItem('tcg_pocket_collection_v2', JSON.stringify(userCollection));
    localStorage.setItem('tcg_pocket_booster_count', boosterOpenedCount);
    localStorage.setItem('tcg_pocket_currency', userCurrency);
    updateUI();
}

function updateUI() {
    let totalCollected = 0;
    let totalCardsInGame = 0;
    let duplicateValue = 0;

    for (const ext in CARDS_DB) {
        totalCardsInGame += CARDS_DB[ext].length;
        if (userCollection[ext]) {
            // Compte les cartes uniques
            totalCollected += Object.keys(userCollection[ext]).length;
            
            // Calcul valeur doublons
            Object.entries(userCollection[ext]).forEach(([id, qty]) => {
                if(qty > 1) {
                    const card = CARDS_DB[ext].find(c => c.id === id);
                    if(card) {
                        const rInfo = RARITY_DATA[card.rarity] || RARITY_DATA["1_diamond"];
                        duplicateValue += (qty - 1) * rInfo.sell;
                    }
                }
            });
        }
    }

    const elBooster = document.getElementById('booster-count');
    const elCol = document.getElementById('collection-count');
    const elTot = document.getElementById('total-cards-count');
    const elCurr = document.getElementById('currency-display');
    const elPrev = document.getElementById('sell-preview');

    if(elBooster) elBooster.textContent = boosterOpenedCount;
    if(elCol) elCol.textContent = totalCollected;
    if(elTot) elTot.textContent = totalCardsInGame;
    if(elCurr) elCurr.textContent = userCurrency;
    if(elPrev) elPrev.textContent = duplicateValue;
}

function resetCollection() {
    if (confirm("Attention : Voulez-vous vraiment TOUT effacer ?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- NAVIGATION & VUES ---

function hideAllViews() {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
}

function goHome() {
    hideAllViews();
    document.getElementById('sets-container').classList.remove('hidden');
    document.querySelector('button[onclick="goHome()"]').classList.add('active');
    renderHome();
}

function openGlobalCollection() {
    hideAllViews();
    document.getElementById('global-collection-view').classList.remove('hidden');
    document.querySelector('button[onclick="openGlobalCollection()"]').classList.add('active');
    renderGlobalCollection();
}

function openShop() {
    hideAllViews();
    document.getElementById('shop-view').classList.remove('hidden');
    document.querySelector('button[onclick="openShop()"]').classList.add('active');
    renderShop();
}

function formatName(str) { return str.replace(/-/g, ' ').toUpperCase(); }

// --- RENDER HOME (SETS) ---
function renderHome() {
    const container = document.getElementById('sets-container');
    container.innerHTML = '';
    
    Object.keys(CARDS_DB).forEach(setName => {
        const totalCards = CARDS_DB[setName].length;
        const userSet = userCollection[setName] || {};
        const ownedCards = Object.keys(userSet).length;
        
        // Calcul pourcentage : 100% seulement si TOUT est là
        let percent = (ownedCards / totalCards) * 100;
        if (percent > 99 && percent < 100) percent = 99; // Eviter faux 100%
        percent = Math.floor(percent); 

        const setDiv = document.createElement('div');
        setDiv.className = 'set-card';
        setDiv.onclick = () => openSetView(setName);

        setDiv.innerHTML = `
            <img src="covers/${setName}.webp" class="set-cover" onerror="this.src='https://via.placeholder.com/300?text=Cover'">
            <div class="set-info">
                <span class="set-name">${formatName(setName)}</span>
                <div class="set-stats"><span>${ownedCards}/${totalCards}</span><span>${percent}%</span></div>
                <div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div>
            </div>
        `;
        container.appendChild(setDiv);
    });
}

function openSetView(setName) {
    hideAllViews();
    currentSet = setName;
    currentFilter = 'all';
    document.getElementById('set-detail-view').classList.remove('hidden');
    document.getElementById('current-set-title').innerText = formatName(setName);
    renderDynamicLegend(setName);
    // Reset filters visual
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="all"]`).classList.add('active');
    
    renderCards('all');
}

function filterView(type) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');
    renderCards(type);
}



function renderDynamicLegend(setName) {
    const legendContainer = document.getElementById('dynamic-legend');
    legendContainer.innerHTML = ''; // Nettoyer l'ancienne légende

    if (!CARDS_DB[setName]) return;

    // 1. Trouver les raretés uniques dans ce set
    const uniqueRarities = [...new Set(CARDS_DB[setName].map(c => c.rarity))];

    // 2. Les trier par Rang (Crown en haut, 1 Diamond en bas)
    uniqueRarities.sort((a, b) => {
        return (RARITY_DATA[b]?.rank || 0) - (RARITY_DATA[a]?.rank || 0);
    });

    // 3. Créer le HTML
    uniqueRarities.forEach(rarityKey => {
        const data = RARITY_DATA[rarityKey];
        if (!data) return;

        // On récupère la couleur via la variable CSS définie à l'étape 1
        // Astuce: On utilise le nom de la variable CSS dynamiquement
        const cssVarName = `--c-${rarityKey}`; 
        
        const li = document.createElement('li');
        li.className = 'legend-item';
        li.innerHTML = `
            <span class="legend-dot" style="background: var(${cssVarName}); box-shadow: 0 0 5px var(${cssVarName});"></span>
            <span>${data.label}</span>
            <span style="margin-left:auto; opacity:0.5">${data.symbol}</span>
        `;
        legendContainer.appendChild(li);
    });
}



// --- RENDER CARDS (SET VIEW) ---
function renderCards(filter) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    
    if(!currentSet) return;

    let allCards = [...CARDS_DB[currentSet]]; 
    
    // Tri par ID
    allCards.sort((a, b) => {
        const numA = parseInt(a.id.match(/\d+/)[0]);
        const numB = parseInt(b.id.match(/\d+/)[0]);
        return numA - numB;
    });

    const userSet = userCollection[currentSet] || {};

    allCards.forEach(cardObj => {
        const filename = cardObj.id;
        const qty = userSet[filename] || 0;
        const isOwned = qty > 0;
        
        if (filter === 'owned' && !isOwned) return;
        if (filter === 'missing' && isOwned) return;

        const rInfo = RARITY_DATA[cardObj.rarity] || RARITY_DATA["1_diamond"];
        const rawNum = parseInt(filename.match(/\d+/)[0]);
        const formattedNum = "#" + rawNum.toString().padStart(3, '0');
        const cardDiv = document.createElement('div');

        const specificAuraClass = `aura-${cardObj.rarity}`;
        cardDiv.className = `card-item ${isOwned ? '' : 'missing'} ${specificAuraClass}`;
        
        let qtyBadge = '';
        if(qty > 1) {
            qtyBadge = `<span class="card-qty">x${qty}</span>`;
        }

        cardDiv.innerHTML = `
            ${qtyBadge}
            <img src="img/${currentSet}/${filename}" loading="lazy" alt="${filename}">
            <span class="card-number">${formattedNum}</span>
            <div class="card-info">
                <div class="rarity-symbol ${rInfo.css}" title="${rInfo.label}">
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

// --- GLOBAL COLLECTION (BY RARITY) ---
function renderGlobalCollection() {
    const grid = document.getElementById('global-grid');
    grid.innerHTML = '';

    // 1. Récupérer toutes les cartes de toutes les extensions
    let allGlobalCards = [];
    Object.keys(CARDS_DB).forEach(setName => {
        CARDS_DB[setName].forEach(card => {
            allGlobalCards.push({
                ...card,
                setName: setName,
                qty: (userCollection[setName] && userCollection[setName][card.id]) || 0
            });
        });
    });

    // 2. Trier par Rareté (Rank) puis par Extension
    allGlobalCards.sort((a, b) => {
        const rankA = RARITY_DATA[a.rarity]?.rank || 0;
        const rankB = RARITY_DATA[b.rarity]?.rank || 0;
        
        if (rankA !== rankB) return rankA - rankB; // Ordre Croissant (1 Dia -> Crown)
        return a.setName.localeCompare(b.setName);
    });

    // 3. Afficher
    allGlobalCards.forEach(card => {
        // Optionnel : N'afficher que les possédées ? 
        // L'utilisateur a demandé "on voit toutes les cartes", donc on affiche aussi les grisées.
        
        const rInfo = RARITY_DATA[card.rarity] || RARITY_DATA["1_diamond"];
        const isOwned = card.qty > 0;

        const div = document.createElement('div');
        div.className = `card-item ${isOwned ? '' : 'missing'}`;
        
        let qtyBadge = card.qty > 1 ? `<span class="card-qty">x${card.qty}</span>` : '';

        div.innerHTML = `
            ${qtyBadge}
            <img src="img/${card.setName}/${card.id}" loading="lazy">
            <div class="card-info" style="border-top-color: #444;">
                 <div class="rarity-symbol ${rInfo.css}">${rInfo.symbol}</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// --- BOUTIQUE ET DOUBLONS ---

function sellDuplicates() {
    let earned = 0;
    Object.keys(userCollection).forEach(set => {
        Object.keys(userCollection[set]).forEach(id => {
            const qty = userCollection[set][id];
            if(qty > 1) {
                const card = CARDS_DB[set].find(c => c.id === id);
                if(card) {
                    const rInfo = RARITY_DATA[card.rarity];
                    const toSell = qty - 1;
                    earned += toSell * (rInfo.sell || 0);
                    userCollection[set][id] = 1; // On garde 1 exemplaire
                }
            }
        });
    });

    if (earned > 0) {
        userCurrency += earned;
        alert(`Doublons vendus ! Tu as gagné ${earned} poussières.`);
        saveData();
        renderGlobalCollection(); // Rafraichir
    } else {
        alert("Aucun doublon à vendre.");
    }
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    // Lister les cartes manquantes
    let missingCards = [];
    Object.keys(CARDS_DB).forEach(setName => {
        CARDS_DB[setName].forEach(card => {
            const qty = (userCollection[setName] && userCollection[setName][card.id]) || 0;
            if (qty === 0) {
                missingCards.push({ ...card, setName });
            }
        });
    });

    // Melanger ou Trier ? Affichons aléatoirement 50 cartes pour ne pas surcharger
    missingCards.sort(() => 0.5 - Math.random());
    const displayList = missingCards.slice(0, 50);

    displayList.forEach(card => {
        const rInfo = RARITY_DATA[card.rarity];
        const cost = rInfo.cost || 9999;
        
        const div = document.createElement('div');
        div.className = 'card-item shop-item missing'; // Missing pour l'effet grisé
        div.style.opacity = "1"; // On force l'opacité pour la boutique
        div.style.filter = "none";

        div.onclick = () => buyCard(card, cost);

        div.innerHTML = `
            <img src="img/${card.setName}/${card.id}" style="filter: grayscale(100%);">
            <div class="card-info">
                 <div class="rarity-symbol ${rInfo.css}">${rInfo.symbol}</div>
                 <div class="card-price"><i class="fas fa-gem"></i> ${cost}</div>
            </div>
        `;
        grid.appendChild(div);
    });
    
    if(displayList.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Tu as toutes les cartes ! Bravo !</p>';
    }
}

function buyCard(card, cost) {
    if(userCurrency >= cost) {
        // DIRECTEMENT L'ACHAT (Plus de confirm)
        userCurrency -= cost;
        
        if(!userCollection[card.setName]) userCollection[card.setName] = {};
        userCollection[card.setName][card.id] = (userCollection[card.setName][card.id] || 0) + 1;
        
        saveData();
        renderShop(); // La carte disparaitra instantanément de la liste
        
        // J'ai aussi commenté l'alerte de succès pour que ce soit 100% fluide. 
        // Tu peux décommenter la ligne dessous si tu veux quand même un message "Carte acquise".
        // alert("Carte acquise !"); 
        
    } else {
        alert("Pas assez de poussière d'étoile !");
    }
}

// --- OUVERTURE BOOSTER (LIVE UPDATE) ---
let tempDrawnCards = [];

function initBoosterOpening() {
    const overlay = document.getElementById('booster-scene-overlay');
    const packContainer = document.getElementById('pack-container');
    const cardsContainer = document.getElementById('opened-cards-container');
    const buttons = document.getElementById('scene-buttons');

    // 1. On cache le paquet immédiatement
    packContainer.style.display = 'none'; 
    
    // 2. On prépare le conteneur des cartes
    cardsContainer.classList.remove('hidden');
    buttons.classList.add('hidden');
    
    // 3. Tirage des cartes
    tempDrawnCards = drawBoosterPack(); 
    boosterOpenedCount++;
    saveData();
    
    // Mise à jour de l'arrière-plan (collection)
    renderCards(currentFilter);

    // 4. Affichage direct de l'overlay et des cartes
    overlay.classList.remove('hidden');
    prepareCardsForReveal();
}

function drawBoosterPack() {
    const setCards = CARDS_DB[currentSet];
    const drawn = [];
    if(!userCollection[currentSet]) userCollection[currentSet] = {};

    // 1. Grouper les cartes par rareté pour le tirage
    const cardsByRarity = {};
    setCards.forEach(card => {
        if (!cardsByRarity[card.rarity]) cardsByRarity[card.rarity] = [];
        cardsByRarity[card.rarity].push(card);
    });

    // 2. Déterminer si c'est un GOD PACK (0.05% de chance, soit 1/2000)
    const isGodPack = Math.random() < 0.0005; 
    
    let slots = [];

    if (isGodPack) {
        console.log("GOD PACK TRIGGERED !"); // Petit log pour le plaisir
        // 5 cartes très rares
        slots = [
            pickRarityFromTable(DROP_RATES_GOD_PACK),
            pickRarityFromTable(DROP_RATES_GOD_PACK),
            pickRarityFromTable(DROP_RATES_GOD_PACK),
            pickRarityFromTable(DROP_RATES_GOD_PACK),
            pickRarityFromTable(DROP_RATES_GOD_PACK)
        ];
    } else {
        // Paquet Standard
        slots = [
            "1_diamond", // Carte 1 : Toujours commune
            "1_diamond", // Carte 2 : Toujours commune
            "1_diamond", // Carte 3 : Toujours commune
            pickRarityFromTable(DROP_RATES_SLOT_4), // Carte 4 : Table Slot 4
            pickRarityFromTable(DROP_RATES_SLOT_5)  // Carte 5 : Table Slot 5
        ];
    }

    // 3. Remplir les slots avec des cartes réelles
    slots.forEach(rarity => {
        // On pioche la carte dans la DB correspondant à la rareté
        const cardFromDb = pickRandom(cardsByRarity, rarity);
        
        // Gestion "NEW"
        const currentQty = userCollection[currentSet][cardFromDb.id] || 0;
        const isNew = currentQty === 0;

        // Ajout collection
        userCollection[currentSet][cardFromDb.id] = currentQty + 1;

        // Ajout au tableau de résultat
        drawn.push({
            ...cardFromDb, 
            isNew: isNew,
            isGodPack: isGodPack // On peut utiliser ça plus tard pour un effet visuel spécial
        });
    });

    return drawn;
}

function pickRarityFromTable(table) {
    let total = table.reduce((acc, val) => acc + val.weight, 0);
    let rand = Math.random() * total;
    for (const entry of table) {
        if (rand < entry.weight) return entry.rarity;
        rand -= entry.weight;
    }
    return "1_diamond";
}

function pickRandom(map, rarity) {
    const pool = map[rarity];
    if (pool && pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    // Fallback simple
    return { id: "1.png", rarity: "1_diamond" }; 
}

function prepareCardsForReveal() {
    const container = document.getElementById('opened-cards-container');
    container.innerHTML = ''; 

    // On parcourt les cartes tirées
    tempDrawnCards.forEach((cardObj) => {
        const rarityInfo = RARITY_DATA[cardObj.rarity];
        
        // Gestion des auras
        let glowClass = '';
        if (rarityInfo.group === 'crown') glowClass = 'glow-crown';
        else if (rarityInfo.group === 'chrom') glowClass = 'glow-chrom';
        else if (rarityInfo.group === 'star') glowClass = 'glow-star';
        else if (rarityInfo.group === 'diamond') glowClass = 'glow-diamond';

        // Gestion du badge NEW
        const newBadgeHTML = cardObj.isNew ? '<div class="new-badge">NEW</div>' : '';

        const scene = document.createElement('div');
        // MODIFICATION ICI : On ajoute 'is-flipped' tout de suite.
        // La carte sera rendue directement face visible par le navigateur.
        scene.className = `card-scene ${glowClass} is-flipped`;
        
        scene.innerHTML = `
            <div class="card-object">
                <div class="card-face face-back"></div>
                <div class="card-face face-front">
                    ${newBadgeHTML}
                    <img src="img/${currentSet}/${cardObj.id}">
                </div>
            </div>
        `;
        container.appendChild(scene);
    });

    // On affiche les boutons "Terminer / Encore" IMMÉDIATEMENT
    document.getElementById('scene-buttons').classList.remove('hidden');
}

function closeBoosterScene() {
    document.getElementById('booster-scene-overlay').classList.add('hidden');
    // Re-render pour être sûr
    renderCards(currentFilter);
}

function replayBooster() {
    initBoosterOpening();
}
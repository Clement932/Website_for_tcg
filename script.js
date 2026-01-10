// --- CONFIGURATION DROPS ---
const DROP_RATES_SLOT_4 = [
    { rarity: "2_diamond", weight: 90000 }, { rarity: "3_diamond", weight: 5000 },
    { rarity: "4_diamond", weight: 1666 }, { rarity: "1_star", weight: 2572 },
    { rarity: "2_star", weight: 500 }, { rarity: "3_star", weight: 222 },
    { rarity: "1_chrom", weight: 100 }, { rarity: "2_chrom", weight: 50 },
    { rarity: "crown", weight: 40 }
];

const DROP_RATES_SLOT_5 = [
    { rarity: "2_diamond", weight: 60000 }, { rarity: "3_diamond", weight: 20000 },
    { rarity: "4_diamond", weight: 6664 }, { rarity: "1_star", weight: 10288 },
    { rarity: "2_star", weight: 2000 }, { rarity: "3_star", weight: 888 },
    { rarity: "1_chrom", weight: 400 }, { rarity: "2_chrom", weight: 200 },
    { rarity: "crown", weight: 160 }
];

const DROP_RATES_GOD_PACK = [
    { rarity: "1_star", weight: 600 }, { rarity: "2_star", weight: 200 },
    { rarity: "3_star", weight: 100 }, { rarity: "1_chrom", weight: 50 },
    { rarity: "2_chrom", weight: 25 }, { rarity: "crown", weight: 25 }
];

const RARITY_DATA = {
    "crown":     { symbol: "👑", label: "Gold Rare", rank: 11, css: "rarity-crown", group: "crown", cost: 2500, sell: 500 },
    "2_chrom":   { symbol: "✨✨", label: "Chromatique Rare", rank: 10, css: "rarity-chrom", group: "chrom", cost: 1500, sell: 300 },
    "1_chrom":   { symbol: "✨", label: "Chromatique", rank: 9, css: "rarity-chrom", group: "chrom", cost: 1000, sell: 200 },
    "3_star":    { symbol: "⭐⭐⭐", label: "Immersive", rank: 8, css: "rarity-star", group: "star", cost: 800, sell: 150 },
    "2_star":    { symbol: "⭐⭐", label: "Full Art", rank: 7, css: "rarity-star", group: "star", cost: 500, sell: 100 },
    "1_star":    { symbol: "⭐", label: "Illustration", rank: 6, css: "rarity-star", group: "star", cost: 300, sell: 50 },
    "4_diamond": { symbol: "♦♦♦♦", label: "ex", rank: 5, css: "rarity-diamond", group: "diamond", cost: 150, sell: 25 },
    "3_diamond": { symbol: "♦♦♦", label: "Rare", rank: 4, css: "rarity-diamond", group: "diamond", cost: 70, sell: 10 },
    "2_diamond": { symbol: "♦♦", label: "Peu Commune", rank: 3, css: "rarity-diamond", group: "diamond", cost: 35, sell: 5 },
    "1_diamond": { symbol: "♦", label: "Commune", rank: 2, css: "rarity-diamond", group: "diamond", cost: 15, sell: 2 },
    "promo":     { symbol: "P", label: "Promo", rank: 1, css: "rarity-diamond", group: "diamond", cost: 500, sell: 0 }
};

// --- DATA MISSIONS & SUCCÈS ---
const MISSION_TEMPLATES = [
    { id: 'open_boosters', desc: "Ouvrir des boosters", target: 3, reward: 50, type: 'action', action: 'open_booster' },
    { id: 'find_diamond3', desc: "Trouver des Rares (♦♦♦)", target: 2, reward: 60, type: 'find', rank: 4 },
    { id: 'find_diamond4', desc: "Trouver des EX (♦♦♦♦)", target: 1, reward: 100, type: 'find', rank: 5 },
    { id: 'craft_card', desc: "Fabriquer une carte", target: 1, reward: 40, type: 'action', action: 'craft' },
    { id: 'sell_dupes', desc: "Vendre des doublons", target: 5, reward: 30, type: 'action', action: 'sell' },
    { id: 'earn_xp', desc: "Gagner de l'XP", target: 100, reward: 50, type: 'xp' }
];

const ACHIEVEMENTS = [
    { id: 'novice', desc: "Niveau 5 atteint", target: 5, type: 'level', reward: 500 },
    { id: 'expert', desc: "Niveau 20 atteint", target: 20, type: 'level', reward: 2000 },
    { id: 'collector_100', desc: "Posséder 100 cartes uniques", target: 100, type: 'collection', reward: 300 },
    { id: 'big_spender', desc: "Dépenser 1000 Poussières", target: 1000, type: 'spend', reward: 200 },
    { id: 'lucky', desc: "Trouver une Crown Rare", target: 1, type: 'find_spec', rarity: 'crown', reward: 1000 }
];

// --- STATE ---
let boosterOpenedCount = parseInt(localStorage.getItem('tcg_pocket_booster_count')) || 0;
let userCurrency = parseInt(localStorage.getItem('tcg_pocket_currency')) || 0;
let userCollection = JSON.parse(localStorage.getItem('tcg_pocket_collection_v2')) || {}; 
let userLevel = parseInt(localStorage.getItem('tcg_pocket_level')) || 1;
let userXP = parseInt(localStorage.getItem('tcg_pocket_xp')) || 0;
let activeMissions = JSON.parse(localStorage.getItem('tcg_pocket_missions')) || [];
let missionLastDate = localStorage.getItem('tcg_pocket_mission_date') || "";
let achievementProgress = JSON.parse(localStorage.getItem('tcg_pocket_achievements_prog')) || {};

let currentSet = null;
let currentFilter = 'all';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    checkDailyMissions();
    checkDailyLogin();
    updateUI();
    renderHome();
    init3DTiltEffect();
});

function saveData() {
    localStorage.setItem('tcg_pocket_collection_v2', JSON.stringify(userCollection));
    localStorage.setItem('tcg_pocket_booster_count', boosterOpenedCount);
    localStorage.setItem('tcg_pocket_currency', userCurrency);
    localStorage.setItem('tcg_pocket_level', userLevel);
    localStorage.setItem('tcg_pocket_xp', userXP);
    localStorage.setItem('tcg_pocket_missions', JSON.stringify(activeMissions));
    localStorage.setItem('tcg_pocket_achievements_prog', JSON.stringify(achievementProgress));
    updateUI();
}

// --- GAMEPLAY SYSTEM (XP & MISSIONS) ---

function getXPForNextLevel(lvl) {
    return Math.floor(100 * Math.pow(1.2, lvl - 1));
}

function addXP(amount) {
    userXP += amount;
    trackMissionProgress('xp', amount);
    
    let nextLevel = getXPForNextLevel(userLevel);
    if (userXP >= nextLevel) {
        userXP -= nextLevel;
        userLevel++;
        let reward = userLevel * 50; // Récompense de niveau
        userCurrency += reward;
        showToast(`Niveau ${userLevel} atteint ! +${reward} poussières`, 'success');
        launchConfetti();
        trackAchievement('level', userLevel);
    }
    saveData();
}

function checkDailyLogin() {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('tcg_pocket_last_login');
    if (lastLogin !== today) {
        localStorage.setItem('tcg_pocket_last_login', today);
        userCurrency += 50;
        showToast("Bonus de connexion : +50 poussières !", 'success');
        saveData();
    }
}

function checkDailyMissions() {
    const today = new Date().toDateString();
    if (missionLastDate !== today || activeMissions.length === 0) {
        // Générer 3 nouvelles missions
        activeMissions = [];
        for(let i=0; i<3; i++) {
            const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
            activeMissions.push({ ...template, progress: 0, claimed: false, uuid: Date.now() + i });
        }
        missionLastDate = today;
        localStorage.setItem('tcg_pocket_mission_date', today);
        saveData();
    }
}

function trackMissionProgress(type, value = 1, extraData = {}) {
    let updated = false;
    
    // Missions Quotidiennes
    activeMissions.forEach(m => {
        if (!m.claimed && m.type === type) {
            let match = true;
            if (type === 'action' && m.action !== extraData.action) match = false;
            if (type === 'find' && (extraData.rank || 0) < (m.rank || 0)) match = false;
            
            if (match) {
                m.progress += value;
                if (m.progress >= m.target) m.progress = m.target;
                updated = true;
            }
        }
    });

    // Succès
    if(type === 'collection') { /* Géré ailleurs */ }
    if(type === 'spend') trackAchievement('spend', value);
    if(type === 'find_spec') trackAchievement('find_spec', 1, extraData.rarity);

    if (updated) {
        saveData();
        checkMissionNotifications();
    }
}

function trackAchievement(type, val, subType = null) {
    ACHIEVEMENTS.forEach(ach => {
        if (ach.type === type) {
            if (subType && ach.rarity !== subType) return;
            
            let key = ach.id;
            let current = achievementProgress[key] || 0;
            
            if (type === 'level' || type === 'collection') current = val;
            else current += val;
            
            achievementProgress[key] = current;
        }
    });
}

function checkMissionNotifications() {
    const hasClaim = activeMissions.some(m => m.progress >= m.target && !m.claimed);
    const btn = document.querySelector('.mission-btn-pulse');
    if(btn) {
        if(hasClaim) btn.classList.add('has-claim');
        else btn.classList.remove('has-claim');
    }
}

// --- UI UPDATES ---

function updateUI() {
    let totalCollected = 0, totalCardsInGame = 0, duplicateValue = 0;

    for (const ext in CARDS_DB) {
        totalCardsInGame += CARDS_DB[ext].length;
        if (userCollection[ext]) {
            totalCollected += Object.keys(userCollection[ext]).length;
            Object.entries(userCollection[ext]).forEach(([id, qty]) => {
                if(qty > 1) {
                    const card = CARDS_DB[ext].find(c => c.id === id);
                    if(card) duplicateValue += (qty - 1) * (RARITY_DATA[card.rarity]?.sell || 0);
                }
            });
        }
    }
    
    trackAchievement('collection', totalCollected);

    setText('booster-count', boosterOpenedCount);
    setText('collection-count', totalCollected);
    setText('total-cards-count', totalCardsInGame);
    setText('currency-display', userCurrency);
    setText('sell-preview', duplicateValue);

    // Update XP Bar
    const nextXP = getXPForNextLevel(userLevel);
    setText('user-level', userLevel);
    setText('current-xp', userXP);
    setText('next-level-xp', nextXP);
    const pct = Math.min(100, (userXP / nextXP) * 100);
    const bar = document.getElementById('xp-bar-fill');
    if(bar) bar.style.width = `${pct}%`;

    checkMissionNotifications();
}

function setText(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }

// --- MODALE MISSIONS ---
function openMissions() {
    document.getElementById('missions-modal').classList.remove('hidden');
    switchMissionTab('daily');
}
function closeMissions() {
    document.getElementById('missions-modal').classList.add('hidden');
}
function switchMissionTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`button[onclick="switchMissionTab('${tab}')"]`).classList.add('active');
    
    const container = document.getElementById('missions-list');
    container.innerHTML = '';

    if (tab === 'daily') {
        activeMissions.forEach((m, idx) => {
            const isDone = m.progress >= m.target;
            const btnHtml = m.claimed 
                ? `<span style="color:#666"><i class="fas fa-check"></i> Reçu</span>` 
                : isDone 
                    ? `<button class="claim-btn" onclick="claimMission(${idx})">Récupérer</button>` 
                    : `<span style="font-size:0.8em; color:#666">${m.progress}/${m.target}</span>`;

            const el = document.createElement('div');
            el.className = `mission-card ${m.claimed ? 'completed' : ''}`;
            el.innerHTML = `
                <div class="mission-info">
                    <span class="mission-title">${m.desc}</span>
                    <div class="mission-progress-bg"><div class="mission-progress-fill" style="width:${(m.progress/m.target)*100}%"></div></div>
                </div>
                <div style="text-align:right">
                    <div class="mission-reward">+${m.reward} <i class="fas fa-gem"></i></div>
                    <div style="margin-top:5px;">${btnHtml}</div>
                </div>
            `;
            container.appendChild(el);
        });
    } else {
        // Succès
        ACHIEVEMENTS.forEach(ach => {
            const current = achievementProgress[ach.id] || 0;
            const isDone = current >= ach.target;
            const isClaimed = achievementProgress[ach.id + "_claimed"]; 
            
            const btnHtml = isClaimed 
                ? `<span style="color:#666">Acquis</span>` 
                : isDone 
                    ? `<button class="claim-btn" onclick="claimAchievement('${ach.id}')">Récupérer</button>` 
                    : `<span style="font-size:0.8em; color:#666">${current}/${ach.target}</span>`;

            const el = document.createElement('div');
            el.className = `mission-card ${isClaimed ? 'completed' : ''}`;
            el.innerHTML = `
                <div class="mission-info">
                    <span class="mission-title">${ach.desc} <i class="fas fa-trophy" style="color:gold"></i></span>
                    <div class="mission-progress-bg"><div class="mission-progress-fill" style="width:${Math.min(100, (current/ach.target)*100)}%"></div></div>
                </div>
                <div style="text-align:right">
                    <div class="mission-reward">+${ach.reward} <i class="fas fa-gem"></i></div>
                    <div style="margin-top:5px;">${btnHtml}</div>
                </div>
            `;
            container.appendChild(el);
        });
    }
}

function claimMission(idx) {
    const m = activeMissions[idx];
    if (m && !m.claimed && m.progress >= m.target) {
        m.claimed = true;
        userCurrency += m.reward;
        addXP(20);
        saveData();
        openMissions(); 
        showToast(`Mission accomplie !`, 'success');
        launchConfetti();
    }
}

function claimAchievement(id) {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach && !achievementProgress[id + "_claimed"]) {
        achievementProgress[id + "_claimed"] = true;
        userCurrency += ach.reward;
        addXP(100); 
        saveData();
        openMissions();
        showToast(`Succès débloqué : ${ach.desc}`, 'success');
        launchConfetti();
    }
}

// --- CORE FUNCTIONS ---

function hideAllViews() {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    closeMissions(); 
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
function formatCardNumber(id) {
    const match = id.match(/\d+/);
    return match ? "#" + match[0].padStart(3, '0') : "P";
}

function renderHome() {
    const container = document.getElementById('sets-container');
    container.innerHTML = '';
    Object.keys(CARDS_DB).forEach(setName => {
        const total = CARDS_DB[setName].length;
        const owned = Object.keys(userCollection[setName] || {}).length;
        const percent = Math.floor((owned / total) * 100);
        const div = document.createElement('div');
        div.className = 'set-card';
        div.onclick = () => openSetView(setName);
        div.innerHTML = `
            <img src="covers/${setName}.webp" class="set-cover" onerror="this.src='https://placehold.co/300x180?text=${setName}'">
            <div class="set-info">
                <span class="set-name">${formatName(setName)}</span>
                <div class="set-stats"><span>${owned}/${total}</span><span>${percent}%</span></div>
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${percent}%"></div></div>
            </div>`;
        container.appendChild(div);
    });
}

function openSetView(setName) {
    hideAllViews();
    currentSet = setName;
    currentFilter = 'all';
    document.getElementById('set-detail-view').classList.remove('hidden');
    document.getElementById('current-set-title').innerText = formatName(setName);
    document.getElementById('search-set').value = "";
    renderDynamicLegend(setName);
    updateSetHeaderStats(setName);
    renderCards('all');
}

function updateSetHeaderStats(setName) {
    const total = CARDS_DB[setName].length;
    const owned = Object.keys(userCollection[setName] || {}).length;
    const percent = Math.floor((owned / total) * 100);
    const container = document.getElementById('set-header-stats-container');
    container.innerHTML = `
        <div style="font-size:0.8em; color:#888;">Collection: <b style="color:white">${percent}%</b></div>
        <div style="width:100px; height:4px; background:#333; border-radius:2px; margin-top:2px;">
            <div style="width:${percent}%; height:100%; background:var(--accent); border-radius:2px;"></div>
        </div>`;
}

function renderCards(filter) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';
    if(!currentSet) return;
    const cards = [...CARDS_DB[currentSet]].sort((a,b) => parseInt(a.id) - parseInt(b.id));
    const userSet = userCollection[currentSet] || {};
    cards.forEach(card => {
        const qty = userSet[card.id] || 0;
        if(filter === 'owned' && qty === 0) return;
        if(filter === 'missing' && qty > 0) return;
        const rInfo = RARITY_DATA[card.rarity];
        const num = formatCardNumber(card.id);
        const el = document.createElement('div');
        el.className = `card-item ${qty === 0 ? 'missing' : ''} aura-${card.rarity}`;
        el.innerHTML = `
            ${qty > 1 ? `<span class="card-qty">+${qty-1}</span>` : ''}
            <img src="img/${currentSet}/${card.id}" loading="lazy">
            <span class="card-number">${num}</span>
            <div class="card-info"><div class="rarity-symbol ${rInfo.css}">${rInfo.symbol}</div></div>
        `;
        if(qty > 0) el.onclick = () => window.open(`img/${currentSet}/${card.id}`, '_blank');
        grid.appendChild(el);
    });
}

function renderGlobalCollection() {
    const grid = document.getElementById('global-grid');
    grid.innerHTML = '';
    const allCards = [];
    Object.keys(CARDS_DB).forEach(set => {
        CARDS_DB[set].forEach(c => allCards.push({...c, set, qty: (userCollection[set]?.[c.id] || 0)}));
    });
    allCards.sort((a,b) => (RARITY_DATA[b.rarity].rank - RARITY_DATA[a.rarity].rank) || a.set.localeCompare(b.set));
    allCards.forEach(c => {
        const isOwned = c.qty > 0;
        const rInfo = RARITY_DATA[c.rarity];
        const num = formatCardNumber(c.id);
        const el = document.createElement('div');
        el.className = `card-item ${!isOwned ? 'missing' : ''} aura-${c.rarity}`;
        el.innerHTML = `
            ${c.qty > 1 ? `<span class="card-qty">+${c.qty-1}</span>` : ''}
            <img src="img/${c.set}/${c.id}" loading="lazy">
            <span class="card-number">${num}</span>
            <div class="card-info"><div class="rarity-symbol ${rInfo.css}">${rInfo.symbol}</div></div>
        `;
        grid.appendChild(el);
    });
}

function searchCards(query, gridId) {
    const term = query.toLowerCase().replace('#', '');
    const grid = document.getElementById(gridId);
    const cards = grid.querySelectorAll('.card-item');
    cards.forEach(card => {
        const numText = card.querySelector('.card-number').textContent.toLowerCase();
        if (numText.includes(term)) card.style.display = 'flex';
        else card.style.display = 'none';
    });
}

function filterView(type) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-filter="${type}"]`).classList.add('active');
    renderCards(type);
}

function renderDynamicLegend(setName) {
    const list = document.getElementById('dynamic-legend');
    list.innerHTML = '';
    const rarities = [...new Set(CARDS_DB[setName].map(c => c.rarity))].sort((a,b) => RARITY_DATA[b].rank - RARITY_DATA[a].rank);
    rarities.forEach(r => {
        const d = RARITY_DATA[r];
        const li = document.createElement('li');
        li.className = 'legend-item';
        li.innerHTML = `<span><span class="legend-dot" style="background:var(--c-${r})"></span>${d.label}</span> <span>${d.symbol}</span>`;
        list.appendChild(li);
    });
}

function sellDuplicates() {
    let earned = 0;
    let soldCount = 0;
    Object.keys(userCollection).forEach(set => {
        Object.keys(userCollection[set]).forEach(id => {
            const qty = userCollection[set][id];
            if(qty > 1) {
                earned += (qty - 1) * RARITY_DATA[CARDS_DB[set].find(c=>c.id===id).rarity].sell;
                soldCount += (qty - 1);
                userCollection[set][id] = 1;
            }
        });
    });

    if(earned > 0) {
        userCurrency += earned;
        trackMissionProgress('action', soldCount, { action: 'sell' });
        saveData();
        renderGlobalCollection();
        showToast(`+${earned} poussières gagnées !`, 'success');
    } else {
        showToast("Aucun doublon à vendre.", 'info');
    }
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    const missing = [];
    Object.keys(CARDS_DB).forEach(set => {
        CARDS_DB[set].forEach(c => {
            if(!userCollection[set]?.[c.id]) missing.push({...c, set});
        });
    });
    if(missing.length === 0) { grid.innerHTML = "<p>Collection Complète !</p>"; return; }
    missing.sort(() => Math.random() - 0.5).slice(0, 50).forEach(c => {
        const rInfo = RARITY_DATA[c.rarity];
        const el = document.createElement('div');
        el.className = 'card-item shop-item';
        el.onclick = () => buyCard(c, rInfo.cost);
        el.innerHTML = `
            <img src="img/${c.set}/${c.id}" style="filter:grayscale(100%)">
            <div class="card-info"><div class="card-price" style="color:#00ff88; font-weight:bold"><i class="fas fa-gem"></i> ${rInfo.cost}</div></div>
        `;
        grid.appendChild(el);
    });
}

function buyCard(card, cost) {
    if(userCurrency >= cost) {
        userCurrency -= cost;
        userCollection[card.set] = userCollection[card.set] || {};
        userCollection[card.set][card.id] = 1;
        trackMissionProgress('action', 1, { action: 'craft' });
        trackAchievement('spend', cost);
        saveData();
        renderShop();
        showToast("Carte fabriquée !", 'success');
        launchConfetti();
    } else {
        showToast("Pas assez de poussière !", 'error');
    }
}   

// --- BOOSTER LOGIC (MODIFIÉ POUR PASSER LE PACK) ---
let tempDrawnCards = [];

function initBoosterOpening() {
    document.getElementById('booster-scene-overlay').classList.remove('hidden');
    // ON CACHE LE PACK ET ON LANCE DIRECTEMENT
    document.getElementById('pack-container').style.display = 'none'; 
    document.getElementById('opened-cards-container').classList.add('hidden');
    document.getElementById('scene-buttons').classList.add('hidden');
    
    // Lancement direct de l'ouverture
    revealBoosterContent();
}

function revealBoosterContent() {
    document.getElementById('opened-cards-container').classList.remove('hidden');
    tempDrawnCards = drawBoosterPack();
    boosterOpenedCount++;
    
    // GAMEPLAY HOOKS
    addXP(10); 
    trackMissionProgress('action', 1, { action: 'open_booster' });

    if(currentSet) updateSetHeaderStats(currentSet);
    
    const container = document.getElementById('opened-cards-container');
    container.innerHTML = '';
    let highRarityFound = false;

    tempDrawnCards.forEach((c, index) => {
        const rInfo = RARITY_DATA[c.rarity];
        const isHighRank = rInfo.rank >= 8; 
        if(isHighRank) highRarityFound = true;
        
        trackMissionProgress('find', 1, { rank: rInfo.rank });
        trackAchievement('find_spec', 1, c.rarity);

        const el = document.createElement('div');
        el.style.animationDelay = `${index * 0.1}s`;
        el.className = `card-scene glow-${rInfo.group} is-flipped`;
        el.innerHTML = `
            <div class="card-object">
                <div class="card-face face-back"></div>
                <div class="card-face face-front">
                    ${c.isNew ? '<div class="new-badge">NEW</div>' : ''}
                    <img src="img/${currentSet}/${c.id}">
                </div>
            </div>`;
        container.appendChild(el);
    });

    document.getElementById('scene-buttons').classList.remove('hidden');
    if(highRarityFound) setTimeout(launchConfetti, 500);
    saveData(); 
}

function drawBoosterPack() {
    const setCards = CARDS_DB[currentSet];
    const map = {};
    setCards.forEach(c => { if(!map[c.rarity]) map[c.rarity]=[]; map[c.rarity].push(c); });
    if(!userCollection[currentSet]) userCollection[currentSet] = {};
    const isGod = Math.random() < 0.001; 
    const schema = isGod 
        ? [DROP_RATES_GOD_PACK, DROP_RATES_GOD_PACK, DROP_RATES_GOD_PACK, DROP_RATES_GOD_PACK, DROP_RATES_GOD_PACK]
        : ["1_diamond", "1_diamond", "1_diamond", DROP_RATES_SLOT_4, DROP_RATES_SLOT_5];
    return schema.map(slot => {
        let rarity = (typeof slot === 'string') ? slot : pickRarity(slot);
        let pool = map[rarity] || map["1_diamond"]; 
        let card = pool[Math.floor(Math.random() * pool.length)];
        let isNew = !userCollection[currentSet][card.id];
        userCollection[currentSet][card.id] = (userCollection[currentSet][card.id] || 0) + 1;
        return { ...card, isNew };
    });
}

function pickRarity(table) {
    let r = Math.random() * table.reduce((a,b)=>a+b.weight,0);
    for(let t of table) {
        if(r < t.weight) return t.rarity;
        r -= t.weight;
    }
    return "1_diamond";
}

function closeBoosterScene() {
    document.getElementById('booster-scene-overlay').classList.add('hidden');
    renderCards(currentFilter);
}
function replayBooster() { initBoosterOpening(); }

function showToast(msg, type='info') {
    const container = document.querySelector('.toast-container') || document.body;
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.innerHTML = `<span>${msg}</span>`;
    
    if (container === document.body) {
         box.style.cssText = "position:fixed; bottom:20px; right:20px; padding:10px 20px; background:#333; color:white; border-radius:5px; z-index:9999; border-left: 5px solid " + (type==='success'?'#0f0':'#f00');
         document.body.appendChild(box);
    } else {
         let c = document.querySelector('.toast-container');
         if(!c) { c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); }
         c.appendChild(box);
    }
    setTimeout(() => box.remove(), 3000);
}

function init3DTiltEffect() {
    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.card-item');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; 
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.card-item');
        if(card) card.style.transform = '';
    }, true);
}

function launchConfetti() {
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
    const container = document.getElementById('booster-scene-overlay');
    for(let i=0; i<50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = (Math.random() * 2 + 2) + 's';
        if(container) container.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

function resetCollection() {
    if(confirm("Tout effacer ?")) {
        localStorage.clear();
        location.reload();
    }
}
// === ETAT DU JEU ===
const AppState = {
    currency: 500, 
    collection: {}, 
    stats: { boosters: 0, level: 1, xp: 0, lastLogin: null },
    currentSet: 'genetic_apex'
};

const IMAGES_BASE_URL = "https://placehold.co/400x560"; 

// === CONFIGURATION RARETÉ & PRIX DE VENTE ===
// sellPrice = Combien rapporte la vente d'un doublon
const RARITY_CONFIG = {
    "crown":     { rank: 11, label: "Crown",       color: "#a855f7", sellPrice: 1000 },
    "2_chrom":   { rank: 10, label: "Immersive",   color: "#ff0000", sellPrice: 500 },
    "1_chrom":   { rank: 9,  label: "Full Art",    color: "#ff6347", sellPrice: 250 },
    "3_star":    { rank: 8,  label: "Illustration",color: "#fbbf24", sellPrice: 150 },
    "2_star":    { rank: 7,  label: "Rare Holo",   color: "#f472b6", sellPrice: 80 },
    "1_star":    { rank: 6,  label: "Rare",        color: "#fb7185", sellPrice: 40 },
    "4_diamond": { rank: 5,  label: "ex Double",   color: "#60a5fa", sellPrice: 20 },
    "3_diamond": { rank: 4,  label: "Holo",        color: "#818cf8", sellPrice: 10 },
    "2_diamond": { rank: 3,  label: "Peu Commune", color: "#94a3b8", sellPrice: 5 },
    "1_diamond": { rank: 2,  label: "Commune",     color: "#475569", sellPrice: 2 },
    "promo":     { rank: 1,  label: "Promo",       color: "#00fa9a", sellPrice: 100 }
};

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkDailyBonus(); // Vérifie si c'est un nouveau jour
    
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if(loader) loader.style.display = 'none';
    }, 800);

    updateUI();
    renderSets();
});

// === ROUTER ===
window.router = function(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(`view-${viewName}`);
    if(target) target.classList.remove('hidden');
    
    const btn = document.getElementById(`btn-${viewName}`);
    if(btn) btn.classList.add('active');

    if(viewName === 'collection') renderGlobalCollection();
    if(viewName === 'shop') renderShop();
}

// === DATA & SAUVEGARDE ===
function loadData() {
    const saved = localStorage.getItem('tcg_save_v3');
    if(saved) Object.assign(AppState, JSON.parse(saved));
}

function saveData() {
    localStorage.setItem('tcg_save_v3', JSON.stringify(AppState));
    updateUI();
}

window.resetData = function() {
    if(confirm("Attention : Cela effacera toutes vos cartes et votre progression. Continuer ?")) {
        localStorage.clear();
        location.reload();
    }
}

function updateUI() {
    // Mise à jour des textes
    setText('currency-display', AppState.currency);
    setText('user-level', AppState.stats.level);
    setText('current-xp', AppState.stats.xp);
    setText('booster-count', AppState.stats.boosters);
    
    // Barre d'XP
    const xpNext = AppState.stats.level * 100 * 1.5;
    setText('next-level-xp', Math.floor(xpNext));
    const xpBar = document.getElementById('xp-bar-fill');
    if(xpBar) xpBar.style.width = `${(AppState.stats.xp / xpNext) * 100}%`;

    // Compteurs Collection
    let owned = 0, total = 0;
    if(typeof CARDS_DB !== 'undefined') {
        Object.keys(CARDS_DB).forEach(set => {
            total += CARDS_DB[set].length;
            if(AppState.collection[set]) owned += Object.keys(AppState.collection[set]).length;
        });
    }
    setText('collection-count', owned);
    setText('total-cards-count', total);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if(el) el.textContent = value;
}

// === OUVERTURE BOOSTER ===
let tempOpenedCards = [];

window.initBoosterOpening = function() {
    document.getElementById('booster-scene').classList.remove('hidden');
    document.getElementById('pack-stage').classList.remove('hidden');
    document.getElementById('cards-stage').classList.add('hidden');
    document.getElementById('scene-controls').classList.add('hidden');
    
    // Gestion image du pack
    const packImg = document.getElementById('pack-visual');
    if(packImg) {
        packImg.onerror = function() {
            this.src = `https://placehold.co/300x450/111/4f46e5?text=${AppState.currentSet.toUpperCase()}`;
        };
        packImg.src = `covers/${AppState.currentSet}.webp`; 
    }
}

window.openPackAction = function() {
    const packWrap = document.querySelector('.pack-wrapper');
    if(packWrap) packWrap.classList.add('pack-shaking');
    
    setTimeout(() => {
        document.getElementById('pack-stage').classList.add('hidden');
        document.getElementById('cards-stage').classList.remove('hidden');
        if(packWrap) packWrap.classList.remove('pack-shaking');
        generateBoosterContent();
        revealCardsSequence();
    }, 800);
}

function generateBoosterContent() {
    const set = CARDS_DB[AppState.currentSet];
    if(!set) return;

    tempOpenedCards = [];
    for(let i=0; i<5; i++) {
        // Algorithme de chance simple : La 5ème carte a plus de chance d'être rare
        let pool = set;
        if(i === 4 && Math.random() > 0.7) {
            // Filtrer pour ne garder que les cartes rares (si possible)
            const rares = set.filter(c => RARITY_CONFIG[c.rarity] && RARITY_CONFIG[c.rarity].rank >= 4);
            if(rares.length > 0) pool = rares;
        }

        const card = pool[Math.floor(Math.random() * pool.length)];
        tempOpenedCards.push(card);
        
        // Ajout à la collection
        if(!AppState.collection[AppState.currentSet]) AppState.collection[AppState.currentSet] = {};
        const currentQty = AppState.collection[AppState.currentSet][card.id] || 0;
        AppState.collection[AppState.currentSet][card.id] = currentQty + 1;
    }
    
    AppState.stats.boosters++;
    addXP(15);
    saveData();
}

function revealCardsSequence() {
    const container = document.getElementById('opened-cards-area');
    container.innerHTML = '';
    
    tempOpenedCards.forEach((card, idx) => {
        const el = document.createElement('div');
        el.className = 'revealed-card';
        el.style.animationDelay = `${idx * 0.2}s`;
        
        const rConfig = RARITY_CONFIG[card.rarity] || RARITY_CONFIG['1_diamond'];
        const colorHex = rConfig.color.replace('#','');

        el.innerHTML = `
            <div class="card-object" onclick="flipCard(this)">
                <div class="card-back"></div>
                <div class="card-front aura-${card.rarity}">
                    <img src="img/${AppState.currentSet}/${card.id}" 
                         onerror="this.src='${IMAGES_BASE_URL}/${colorHex}/FFF?text=${card.rarity}'" >
                    ${getHoloEffect(card.rarity)}
                </div>
            </div>
        `;
        container.appendChild(el);
    });

    setTimeout(() => {
        document.getElementById('scene-controls').classList.remove('hidden');
    }, 1500);
}

function getHoloEffect(rarity) {
    if(rarity.includes('chrom') || rarity === 'crown' || rarity.includes('star')) {
        return '<div class="holo-overlay"></div>';
    }
    return '';
}

window.flipCard = function(el) {
    const parent = el.closest('.revealed-card');
    if (!parent.classList.contains('flipped')) {
        parent.classList.add('flipped');
    }
}

window.closeBoosterScene = function() {
    document.getElementById('booster-scene').classList.add('hidden');
    if(AppState.currentSet) openSetDetail(AppState.currentSet);
}

window.replayBooster = function() { initBoosterOpening(); }

// === SYSTÈME DE VENTE DE DOUBLONS (NOUVEAU) ===
window.sellDuplicates = function() {
    let totalGain = 0;
    let cardsSold = 0;

    // Parcourir toutes les extensions
    Object.keys(AppState.collection).forEach(setKey => {
        const userSet = AppState.collection[setKey];
        
        // Parcourir les cartes de l'extension
        Object.keys(userSet).forEach(cardId => {
            const qty = userSet[cardId];
            
            // Si on a plus d'1 exemplaire (donc des doublons)
            if (qty > 1) {
                const amountToSell = qty - 1;
                
                // Chercher le prix de la carte
                const cardData = CARDS_DB[setKey].find(c => c.id === cardId);
                let price = 1; // Prix par défaut
                
                if (cardData && RARITY_CONFIG[cardData.rarity]) {
                    price = RARITY_CONFIG[cardData.rarity].sellPrice;
                }
                
                totalGain += (amountToSell * price);
                cardsSold += amountToSell;
                
                // Mettre à jour la collection : on ne garde que 1 exemplaire
                AppState.collection[setKey][cardId] = 1;
            }
        });
    });

    if (cardsSold > 0) {
        AppState.currency += totalGain;
        saveData();
        renderGlobalCollection(); // Rafraîchir l'affichage
        showToast(`♻️ ${cardsSold} cartes vendues pour +${totalGain} Sabliers !`, 'gold');
    } else {
        showToast("Aucun doublon à vendre.", 'info');
    }
}

// === MOTEUR DE RECHERCHE (NOUVEAU) ===
window.searchCards = function(query, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const term = query.toLowerCase();
    const cards = grid.querySelectorAll('.card-slot');
    
    cards.forEach(card => {
        // On vérifie si la rareté correspond (stockée dans data-rarity ou class)
        const rarity = card.getAttribute('data-rarity') || '';
        // Pour une recherche plus poussée, il faudrait les noms des cartes dans la DB
        
        if (rarity.includes(term) || term === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// === AFFICHAGE DES EXTENSIONS ===
window.renderSets = function() {
    const grid = document.getElementById('sets-container');
    if(!grid || typeof CARDS_DB === 'undefined') return;
    grid.innerHTML = '';
    
    Object.keys(CARDS_DB).forEach(key => {
        const total = CARDS_DB[key].length;
        const owned = AppState.collection[key] ? Object.keys(AppState.collection[key]).length : 0;
        
        const div = document.createElement('div');
        div.className = 'set-card';
        div.onclick = () => openSetDetail(key);
        
        // Utilisation de l'image de couverture ou fallback
        div.innerHTML = `
            <div class="set-visual">
                <img src="covers/${key}.webp" 
                     onerror="this.src='https://placehold.co/600x300/111/333?text=${key.toUpperCase()}'"
                     style="width:100%; height:100%; object-fit:cover; display:block;">
            </div>
            <div class="set-info">
                <span class="set-name">${key.replace(/-/g, ' ').toUpperCase()}</span>
                <div class="set-meta">
                    <span>${owned}/${total}</span>
                    <span>${Math.floor((owned/total)*100)}%</span>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function openSetDetail(setId) {
    AppState.currentSet = setId;
    router('set-detail');
    const titleEl = document.getElementById('current-set-title');
    if(titleEl) titleEl.textContent = setId.replace(/-/g, ' ').toUpperCase();
    
    renderCardsList('all');
}

window.filterView = function(filter) {
    renderCardsList(filter);
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    document.querySelector(`button[data-filter="${filter}"]`).classList.add('active');
}

function renderCardsList(filter) {
    const grid = document.getElementById('cards-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const cards = CARDS_DB[AppState.currentSet];
    const userColl = AppState.collection[AppState.currentSet] || {};

    cards.forEach(card => {
        const qty = userColl[card.id] || 0;
        if(filter === 'owned' && qty === 0) return;
        if(filter === 'missing' && qty > 0) return;
        
        const rConfig = RARITY_CONFIG[card.rarity] || RARITY_CONFIG['1_diamond'];
        const colorHex = rConfig.color.replace('#','');

        const el = document.createElement('div');
        el.className = `card-slot ${qty === 0 ? 'missing' : ''} aura-${card.rarity}`;
        el.setAttribute('data-rarity', card.rarity); // Pour la recherche
        
        el.innerHTML = `
            ${qty > 1 ? `<div class="qty-badge">${qty}</div>` : ''}
            <img src="img/${AppState.currentSet}/${card.id}" 
                 onerror="this.src='${IMAGES_BASE_URL}/${colorHex}/FFF?text=${card.rarity}'" loading="lazy">
        `;
        grid.appendChild(el);
    });
}

// === COLLECTION GLOBALE ===
window.renderGlobalCollection = function() {
    const grid = document.getElementById('global-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    let hasCards = false;
    Object.keys(AppState.collection).forEach(setKey => {
        const userSet = AppState.collection[setKey];
        if(!userSet) return;

        Object.keys(userSet).forEach(cardId => {
            const qty = userSet[cardId];
            if(qty > 0) {
                hasCards = true;
                // Récupération des infos carte
                let rarity = '1_diamond';
                const setInfos = CARDS_DB[setKey];
                if(setInfos) {
                    const cardInfo = setInfos.find(c => c.id === cardId);
                    if(cardInfo) rarity = cardInfo.rarity;
                }
                
                const rConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG['1_diamond'];
                const colorHex = rConfig.color.replace('#','');

                const el = document.createElement('div');
                el.className = `card-slot aura-${rarity}`;
                el.innerHTML = `
                    <div class="qty-badge">${qty}</div>
                    <img src="img/${setKey}/${cardId}" 
                         onerror="this.src='${IMAGES_BASE_URL}/${colorHex}/FFF?text=${cardId}'" loading="lazy">
                `;
                grid.appendChild(el);
            }
        });
    });

    if(!hasCards) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">
            <h3>Votre classeur est vide</h3>
            <p>Ouvrez des boosters pour commencer votre collection !</p>
        </div>`;
    }
}

// === BOUTIQUE ===
window.renderShop = function() {
    const grid = document.getElementById('shop-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const items = [
        { id: 'pack_1', name: 'Booster Unique', price: 50, icon: 'fa-box-open' },
        { id: 'pack_5', name: 'Pack de 5', price: 220, icon: 'fa-cubes' },
        { id: 'gold_pack', name: 'Booster Or', price: 500, icon: 'fa-star' }
    ];

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <i class="fas ${item.icon} shop-icon"></i>
            <h3>${item.name}</h3>
            <span class="shop-price">${item.price} <i class="fas fa-hourglass-half"></i></span>
            <button class="btn-primary btn-uniform" onclick="buyItem('${item.id}', ${item.price})">Acheter</button>
        `;
        grid.appendChild(div);
    });
}

window.buyItem = function(itemId, price) {
    if(AppState.currency >= price) {
        AppState.currency -= price;
        saveData();
        showToast("Achat effectué !", "success");
        
        if(itemId === 'pack_1') initBoosterOpening();
        if(itemId === 'gold_pack') initBoosterOpening(); // Pour l'instant identique
        
        if(itemId === 'pack_5') {
            // Ouvrir 4 boosters en "silence" et le dernier visuellement
            for(let i=0; i<4; i++) { generateBoosterContent(); }
            initBoosterOpening();
            setTimeout(() => showToast("+4 Boosters ajoutés au classeur", "info"), 1000);
        }
    } else {
        showToast("Pas assez de sabliers !", "error");
    }
}

// === UTILITAIRES (XP, Bonus, Toasts) ===
function addXP(amount) {
    AppState.stats.xp += amount;
    const next = AppState.stats.level * 100 * 1.5;
    
    if(AppState.stats.xp >= next) {
        AppState.stats.xp = 0;
        AppState.stats.level++;
        const reward = 100 * AppState.stats.level;
        AppState.currency += reward;
        showToast(`NIVEAU ${AppState.stats.level} ! +${reward} Sabliers`, 'gold');
    }
    updateUI();
}

function checkDailyBonus() {
    const today = new Date().toDateString();
    if(AppState.stats.lastLogin !== today) {
        AppState.stats.lastLogin = today;
        const bonus = 50;
        AppState.currency += bonus;
        saveData();
        setTimeout(() => showToast(`Bonus Quotidien : +${bonus} Sabliers !`, 'gold'), 2000);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if(type === 'success' || type === 'gold') icon = 'check-circle';
    if(type === 'error') icon = 'exclamation-triangle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => toast.classList.add('visible'), 10);
    
    // Suppression auto
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Placeholders pour boutons HTML
window.openMissions = function() { 
    const modal = document.getElementById('modal-overlay');
    if(modal) modal.classList.remove('hidden'); 
}
window.closeMissions = function() { 
    const modal = document.getElementById('modal-overlay');
    if(modal) modal.classList.add('hidden'); 
}
window.switchMissionTab = function(t) { console.log(t); }
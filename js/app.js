const rows = 12;
const cols = 12;
const hexGrid = document.getElementById('hex-grid');
const hexData = [];

const playerInput = document.getElementById('player');
const habitatInput = document.getElementById('habitat');
const orderInput = document.getElementById('order');
const factoryInput = document.getElementById('factory');
const overlay = document.getElementById('overlay');
const playersInTelsysteem = document.getElementById('players');

const colors = [
  {
    value: 'red',
    name: 'Rood'
  },
  {
    value: 'yellow',
    name: 'Geel'
  },
  {
    value: 'green',
    name: 'Groen'
  },
  {
    value: 'orange',
    name: 'Oranje'
  },
  {
    value: 'white',
    name: 'Wit'
  },
  {
    value: 'blue',
    name: 'Blauw'
  }
];

let playerColors = [];

let currentIndex = null;

function createHexGrid() {
  let index = 0;
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = 'hex-row' + (r % 2 === 1 ? ' odd' : '');
    for (let c = 0; c < cols; c++) {
      const hex = document.createElement('div');
      hex.className = 'hex';
      hex.dataset.index = index;
      row.appendChild(hex);
      hexData.push({ player: '', habitat: '', order: '', factory: false });
      index++;
    }
    hexGrid.appendChild(row);
  }
  hexActions();
}

function hexActions() {
  const allHexes = document.querySelectorAll('.hex');
  allHexes.forEach((hex) => {
    const index = hex.dataset.index;
    hex.addEventListener('click', () => openModal(index));
  });
}

function openModal(index) {
  currentIndex = index;
  const data = hexData[index];
  playerInput.value = data.player;
  habitatInput.value = data.habitat;
  orderInput.value = data.order;
  factoryInput.checked = data.factory;
  overlay.style.display = 'flex';
}

function closeModal() {
  overlay.style.display = 'none';
}

function saveHex() {
  const data = {
    player: playerInput.value,
    habitat: habitatInput.value,
    order: orderInput.value,
    factory: factoryInput.checked
  };
  hexData[currentIndex] = data;
  renderHex(currentIndex);
  closeModal();

  console.log(data);

  // Calculate income after saving hex data
  calculateIncome(playerColors);

}

function getHabitatImage(habitat) {
  switch (habitat) {
    case 'Woestijn':
      return 'Habitat/Woestijn.jpg';
    case 'Bos':
      return 'Habitat/Bos.jpg';
    case 'Sneeuw':
      return 'Habitat/Sneeuw.jpg';
    default:
      return '';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const numPlayers = parseInt(urlParams.get("numPlayers"), 10) || 0;
  playerColors = urlParams.get("playerColors") 
    ? urlParams.get("playerColors").split(',').reduce((acc, color) => {
      const dutchColor = colors.find(c => c.value === color.trim());
      acc[color.trim()] = dutchColor ? dutchColor.name : color.trim();
      return acc;
    }, {})
    : {};

  if (!numPlayers || Object.keys(playerColors).length === 0) {
    console.warn("Geen spelersinformatie gevonden in de URL.");
    return;
  }



  // updateTelsysteemSpelers(numPlayers, playerColors);
  initPlayersInTelSysteem();
});

function initPlayersInTelSysteem() {
  playersInTelsysteem.innerHTML = ''; // Clear existing players

  Object.entries(playerColors).forEach(([color, name]) => {
    const playerDiv = document.createElement('div');
    playerDiv.className = `player-info player-${color}`;

    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.background = color;

    const playerLabel = document.createElement('span');
    playerLabel.className = 'player-label';
    playerLabel.textContent = `Speler ${name}`;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'stats';

    const citizensDiv = document.createElement('div');
    citizensDiv.innerHTML = `Burgers: <span class="citizens">0</span>`;

    const moneyDiv = document.createElement('div');
    moneyDiv.innerHTML = `EcoK$ : <span class="money">0</span>`;

    const bonusDiv = document.createElement('div');
    bonusDiv.innerHTML = `Troepenbonus: <span class="bonus">0</span>`;

    statsDiv.appendChild(citizensDiv);
    statsDiv.appendChild(moneyDiv);
    statsDiv.appendChild(bonusDiv);

    playerDiv.appendChild(colorBox);
    playerDiv.appendChild(playerLabel);
    playerDiv.appendChild(statsDiv);

    playersInTelsysteem.appendChild(playerDiv);
  });
}

function renderHex(index) {
  const hex = document.querySelector(`.hex[data-index="${index}"]`);
  const data = hexData[index];

  // Reset hex
  hex.className = 'hex';
  hex.style.backgroundImage = '';
  hex.style.borderColor = 'transparent';

  // Habitat image
  if (data.habitat) {
    const imageUrl = getHabitatImage(data.habitat);
    hex.style.backgroundImage = `url(${imageUrl})`;
  }

  // Add border color class
  if (data.player) {
    hex.classList.add(`player-${data.player}`);
  }

  // Show only number (no "Nr")
  hex.innerHTML = data.order ? `<div class="info">${data.order}</div>` : '';
}

createHexGrid();


// game play
/**
 * Spelregels:
 * 
 * 1. Elke speler begint met één fabriek. Deze fabriek kan worden veroverd of verloren aan een andere speler.
 * 
 * 2. Wanneer een speler een fabriek bezit:
 *    - Ontvangt de speler 1 EcoK$ (dollar) en 1 burger per beurt.
 * 
 * 3. Troepenbonus:
 *    - Een speler ontvangt een troepenbonus wanneer ze minstens één tegel van elk van de drie verschillende habitats bezitten (Woestijn, Bos, Sneeuw).
 *    - Voor elke set van drie tegels met verschillende habitats wordt de bonus toegepast. Dit betekent dat het inkomen wordt vermenigvuldigd met het aantal sets van verschillende habitats.
 * 
 * 4. Geen fabriek:
 *    - Wanneer een speler geen fabriek bezit, kan er geen geld worden verdiend.
 */

function calculateIncome(playerColors) {
  const income = {};

  Object.keys(playerColors).forEach((color) => {
    income[color] = { money: 0, citizens: 0, bonus: 0 };

    const playerHexes = hexData.filter((hex) => hex.player === color);

    // Check if player owns at least one factory
    const hasFactory = playerHexes.some((hex) => hex.factory);

    if (hasFactory) {
      // Base income
      income[color].money += 1;
      income[color].citizens += 1;

      // Calculate habitat sets for troop bonus
      const habitats = playerHexes.map((hex) => hex.habitat);
      const uniqueHabitats = new Set(habitats);
      const bonusMultiplier = Math.floor(uniqueHabitats.size / 3);

      income[color].bonus += bonusMultiplier;
      income[color].money *= bonusMultiplier || 1;
    }
  });

  // Update the UI with calculated income
  Object.entries(income).forEach(([color, stats]) => {
    const playerDiv = document.querySelector(`.player-info.player-${color}`);
    console.log(playerDiv);
    if (playerDiv) {
      playerDiv.querySelector('.citizens').textContent = stats.citizens;
      playerDiv.querySelector('.money').textContent = stats.money;
      playerDiv.querySelector('.bonus').textContent = stats.bonus;
    }
  });
}
// Constants
const CACHE_TIMEOUT_MS = 30000; // 30 seconds

// Firebase configuration - switches between prod and emulator
let firebaseConfig;

if (location.hostname === 'localhost' || location.hostname === 'host.docker.internal') {
  // Local development with emulator
  firebaseConfig = {
    projectId: 'putr-dev'
  };
  console.log('🏠 Using Firebase emulator configuration');
} else {
  // Production configuration
  firebaseConfig = {
    apiKey: "AIzaSyBLetCCR_hcY4_2AcV21w0eYfkqhzH_viQ",
    authDomain: "bmt-db-dc8eb.firebaseapp.com",
    databaseURL: "https://bmt-db-dc8eb-default-rtdb.firebaseio.com",
    projectId: "bmt-db-dc8eb",
    storageBucket: "bmt-db-dc8eb.firebasestorage.app",
    messagingSenderId: "417887464130",
    appId: "1:417887464130:web:82edbc63001c4271a9e95b",
    measurementId: "G-8L0CN18VR5"
  };
  console.log('🌐 Using production Firebase configuration');
}


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Connect to emulator when running locally, only once and before any Firestore operations
let emulatorConfigured = false;
if ((location.hostname === 'localhost' || location.hostname === 'host.docker.internal') && !emulatorConfigured) {
  console.log('🔧 Connecting to Firebase emulator...');
  console.log('Current hostname:', location.hostname);
  console.log('Current project:', firebaseConfig.projectId);
  try {
    // Use host.docker.internal for emulator connection when accessed from Docker
    const emulatorHost = location.hostname === 'host.docker.internal' ? 'host.docker.internal' : 'localhost';
    db.useEmulator(emulatorHost, 8080);
    emulatorConfigured = true;
    console.log(`✅ Connected to Firestore emulator on ${emulatorHost}:8080`);
    console.log('Emulator settings:', db._delegate._settings);
  } catch (error) {
    if (error.message && error.message.includes('useEmulator() has already been called')) {
      console.warn('⚠️ Emulator already configured:', error);
    } else {
      console.warn('⚠️ Could not connect to emulator:', error);
    }
  }
}




let putrAsc = false; // Start false so first sort will be descending (highest to lowest)
let netAsc = true;

// Animation timing constants (should match CSS animation durations)
const SHUFFLE_DURATION_MS = 300;
const SLIDE_IN_DURATION_MS = 400;
const STAGGER_DELAY_MS = 30;

// Cache for player data with sessionStorage persistence
let playersCache = null;
let isListenerActive = false;
let realtimeListener = null;

// Load cache from sessionStorage on page load
function loadCacheFromStorage() {
  try {
    const cachedData = sessionStorage.getItem('playersCache');
    const cacheTimestamp = sessionStorage.getItem('cacheTimestamp');
    const listenerActive = sessionStorage.getItem('isListenerActive') === 'true';

    if (cachedData) {
      playersCache = JSON.parse(cachedData);
      console.log("Loaded cached data from sessionStorage");
    }

    // Check if we had an active listener (but we'll need to recreate it)
    if (listenerActive && cacheTimestamp) {
      const timeSinceCache = Date.now() - parseInt(cacheTimestamp);
      if (timeSinceCache < CACHE_TIMEOUT_MS) { // If less than cache timeout, consider listener still "active"
        isListenerActive = true;
      }
    }
  } catch (error) {
    console.error("Error loading cache from sessionStorage:", error);
  }
}

// Save cache to sessionStorage
function saveCacheToStorage() {
  try {
    if (playersCache) {
      sessionStorage.setItem('playersCache', JSON.stringify(playersCache));
      sessionStorage.setItem('cacheTimestamp', Date.now().toString());
      sessionStorage.setItem('isListenerActive', isListenerActive.toString());
    }
  } catch (error) {
    console.error("Error saving cache to sessionStorage:", error);
  }
}

// Clear problematic cache
function clearCache() {
  console.log('🗑️ Clearing cache and forcing fresh data load');
  
  // Clear all session storage
  sessionStorage.clear();
  
  // Clear local storage too (in case anything is stored there)
  localStorage.clear();
  
  // Reset variables
  playersCache = null;
  isListenerActive = false;
  
  // Clear any existing real-time listener
  if (realtimeListener) {
    realtimeListener();
    realtimeListener = null;
  }
  
  console.log('✅ All caches cleared');
}

function populateTable() {
  console.log("populateTable called");

  // Clear cache if we're on localhost (development)
  if (location.hostname === 'localhost') {
    clearCache();
    console.log('🔄 Development mode: cleared cache for fresh emulator data');
  } else {
    // Load any existing cache from sessionStorage (production only)
    loadCacheFromStorage();
  }

  // If we have cached data, render it immediately
  if (playersCache) {
    console.log("Using cached data from sessionStorage");
    renderTableFromCache();
  }

  // Set up real-time listener
  console.log("Setting up real-time listener");
  setupRealtimeListener();
}

function createPlayerRow(key, item) {
  console.log('Creating row for player:', key, 'with data:', item);
  
  // Handle missing data gracefully
  const flag = item.flag || 'https://flagsapi.com/XX/flat/32.png'; // Default flag
  const putr = Number.isFinite(item.putr) ? item.putr.toFixed(2) : 'UR';
  const net = Number.isFinite(item.net) ? item.net.toFixed(2) : '0.00';
  
  let encodedName = encodeURIComponent(key);
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="flag-container">
      <img src="${flag}" class="player-flag" onerror="this.src='images/default-flag.png'"/>
    </td>
    <td class="player-name">
      <a href="profile.html?playerName=${encodedName}">${key}</a>
    </td>
    <td class="player-putr">${putr}</td>
    <td class="player-net">${net}</td>
  `;
  return row;
}

function renderTable(source = "unknown") {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ""; // Clear existing rows

  // Sort the data before rendering to avoid flash
  const sortedEntries = Object.entries(playersCache).sort(([keyA, itemA], [keyB, itemB]) => {
    const aVal = Number.isFinite(itemA.putr) ? itemA.putr : -Infinity;
    const bVal = Number.isFinite(itemB.putr) ? itemB.putr : -Infinity;
    return bVal - aVal; // Descending order (highest to lowest)
  });

  let playerCount = 0;
  sortedEntries.forEach(([key, item]) => {
    const row = createPlayerRow(key, item);
    tableBody.appendChild(row);
    playerCount++;
  });

  console.log(`Rendered ${playerCount} rows from ${source}`);
  
  // Update the arrow to show current sort state (descending by PUTR)
  document.getElementById('putr-arrow').textContent = '▲';
  document.getElementById('net-arrow').textContent = '';

  // Hide spinner and show table
  const spinner = document.getElementById('loading-spinner');
  const tableContainer = document.getElementById('table-container');
  if (spinner) {
    spinner.style.display = 'none';
  }
  if (tableContainer) {
    tableContainer.style.display = 'block';
  }
}

function setupRealtimeListener() {
  // Clean up any existing listener
  if (realtimeListener) {
    realtimeListener();
    realtimeListener = null;
  }

  isListenerActive = true;
  saveCacheToStorage(); // Save the listener state

  console.log('📞 Setting up listener for collection: players');
  console.log('Database instance:', db);
  
  realtimeListener = db.collection("players").onSnapshot((querySnapshot) => {
    console.log("Database updated - refreshing data");
    console.log('Query snapshot size:', querySnapshot.size);
    playersCache = {};

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      const key = doc.id;
      playersCache[key] = item;
    });

    // Save updated cache to sessionStorage
    saveCacheToStorage();
    renderTable("real-time update");
  }, (error) => {
    console.error("Error with real-time listener:", error);
    isListenerActive = false;
    saveCacheToStorage(); // Save the updated state
  });
}

function renderTableFromCache() {
  renderTable("cache");
}

// Helper function to animate table rows during sorting
function animateSortedRows(tbody, rows, sortCompareFn) {
  // Add shuffle animation to all rows
  rows.forEach(row => row.classList.add('shuffling'));

  // Wait for shuffle animation to start, then sort and re-insert with stagger
  setTimeout(() => {
    rows.sort(sortCompareFn);

    // Clear tbody and remove shuffle class
    tbody.innerHTML = '';
    rows.forEach(row => row.classList.remove('shuffling'));

    // Re-insert rows with staggered animation
    rows.forEach((row, index) => {
      row.classList.add('entering');
      row.style.animationDelay = `${index * (STAGGER_DELAY_MS / 1000)}s`;
      tbody.appendChild(row);
    });

    // Clean up animation classes after animation completes
    setTimeout(() => {
      rows.forEach(row => {
        row.classList.remove('entering');
        row.style.animationDelay = '';
      });
    }, SLIDE_IN_DURATION_MS + (rows.length * STAGGER_DELAY_MS));
  }, SHUFFLE_DURATION_MS / 2); // Wait for half of shuffle animation
}

function sortTableByPutr() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  putrAsc = !putrAsc;
  netAsc = true;

  // Sort and animate rows
  animateSortedRows(tbody, rows, (a, b) => {
    const aVal = parseFloat(a.querySelector('.player-putr').textContent);
    const bVal = parseFloat(b.querySelector('.player-putr').textContent);
    return putrAsc ? aVal - bVal : bVal - aVal;
  });

  // Update arrow indicators (with delay to match animation start)
  setTimeout(() => {
    document.getElementById('putr-arrow').textContent = putrAsc ? '▼' : '▲';
    document.getElementById('net-arrow').textContent = '';
  }, SHUFFLE_DURATION_MS / 2);
}

function sortTableByNet() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  netAsc = !netAsc;
  putrAsc = true;

  // Sort and animate rows
  animateSortedRows(tbody, rows, (a, b) => {
    const aVal = parseFloat(a.querySelector('.player-net').textContent);
    const bVal = parseFloat(b.querySelector('.player-net').textContent);
    return netAsc ? aVal - bVal : bVal - aVal;
  });

  // Update arrow indicators (with delay to match animation start)
  setTimeout(() => {
    document.getElementById('net-arrow').textContent = netAsc ? '▼' : '▲';
    document.getElementById('putr-arrow').textContent = '';
  }, SHUFFLE_DURATION_MS / 2);
}

// Call the sorting function when the page loads to initially sort the table by PUTR
window.addEventListener("load", () => {
  populateTable()
});


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLetCCR_hcY4_2AcV21w0eYfkqhzH_viQ",
  authDomain: "bmt-db-dc8eb.firebaseapp.com",
  databaseURL: "https://bmt-db-dc8eb-default-rtdb.firebaseio.com",
  projectId: "bmt-db-dc8eb",
  storageBucket: "bmt-db-dc8eb.firebasestorage.app",
  messagingSenderId: "417887464130",
  appId: "1:417887464130:web:82edbc63001c4271a9e95b",
  measurementId: "G-8L0CN18VR5"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();




let putrAsc = false; // Start false so first sort will be descending (highest to lowest)
let netAsc = true;

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
      if (timeSinceCache < 30000) { // If less than 30 seconds, consider listener still "active"
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

function populateTable() {
  console.log("populateTable called");

  // Load any existing cache from sessionStorage
  loadCacheFromStorage();

  // If we have cached data, render it immediately
  if (playersCache) {
    console.log("Using cached data from sessionStorage");
    renderTableFromCache();
  }

  // Set up real-time listener if not already active
  if (!isListenerActive) {
    console.log("Setting up real-time listener");
    setupRealtimeListener();
  } else {
    console.log("Real-time listener already active, reconnecting...");
    // Reconnect the listener since page reload breaks the connection
    setupRealtimeListener();
  }
}

function createPlayerRow(key, item) {
  let encodedName = encodeURIComponent(key);
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="flag-container">
      <img src="${item.flag}" class="player-flag"/>
    </td>
    <td class="player-name">
      <a href="profile.html?playerName=${encodedName}">${key}</a>
    </td>
    <td class="player-putr">${Number.isFinite(item.putr) ? item.putr.toFixed(2) : 'UR'}</td>
    <td class="player-net">${item.net.toFixed(2)}</td>
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
}

function setupRealtimeListener() {
  // Clean up any existing listener
  if (realtimeListener) {
    realtimeListener();
    realtimeListener = null;
  }

  isListenerActive = true;
  saveCacheToStorage(); // Save the listener state

  const collectionName = (typeof COLLECTIONS !== 'undefined' && COLLECTIONS.PLAYERS) ? COLLECTIONS.PLAYERS : 'players';
  console.log('🔍 Using collection:', collectionName);
  
  realtimeListener = db.collection(collectionName).onSnapshot((querySnapshot) => {
    console.log("Database updated - refreshing data");
    console.log(`📊 Query returned ${querySnapshot.size} documents from ${collectionName}`);
    
    playersCache = {};

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      const key = doc.id;
      playersCache[key] = item;
    });

    console.log(`💾 Total players in cache: ${Object.keys(playersCache).length}`);

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

function sortTableByPutr() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  putrAsc = !putrAsc;
  netAsc = true;

  rows.sort((a, b) => {
    const aVal = parseFloat(a.querySelector('.player-putr').textContent);
    const bVal = parseFloat(b.querySelector('.player-putr').textContent);
    return putrAsc ? aVal - bVal : bVal - aVal;
  });

  // re‑populate
  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));

  // **only** show the PUTR arrow, clear the NET arrow
  document.getElementById('putr-arrow').textContent = putrAsc ? '▼' : '▲';
  document.getElementById('net-arrow').textContent = '';
}

function sortTableByNet() {
  const tbody = document.querySelector('#leaderboard-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  netAsc = !netAsc;
  putrAsc = true;

  rows.sort((a, b) => {
    const aVal = parseFloat(a.querySelector('.player-net').textContent);
    const bVal = parseFloat(b.querySelector('.player-net').textContent);
    return netAsc ? aVal - bVal : bVal - aVal;
  });

  // re‑populate
  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));

  // **only** show the NET arrow, clear the PUTR arrow
  document.getElementById('net-arrow').textContent = netAsc ? '▼' : '▲';
  document.getElementById('putr-arrow').textContent = '';
}

// Global function to refresh leaderboard (used by upload system)
window.refreshLeaderboard = function() {
  return new Promise((resolve) => {
    console.log("🔄 Refreshing leaderboard after upload...");
    
    // Force refresh by clearing cache and reloading data
    playersCache = null;
    sessionStorage.removeItem('playersCache');
    sessionStorage.removeItem('cacheTimestamp');
    
    // Set up a one-time listener to get fresh data
    const collectionName = (typeof COLLECTIONS !== 'undefined' && COLLECTIONS.PLAYERS) ? COLLECTIONS.PLAYERS : 'players';
    
    db.collection(collectionName).get().then((querySnapshot) => {
      playersCache = {};
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const key = doc.id;
        playersCache[key] = item;
      });
      
      // Save updated cache and render
      saveCacheToStorage();
      renderTable("post-upload refresh");
      resolve();
    }).catch((error) => {
      console.error("Error refreshing leaderboard:", error);
      resolve(); // Don't fail the upload process
    });
  });
};

// Global upload orchestrator instance
let uploadOrchestrator = null;

// Initialize upload system
function initializeUploadSystem() {
  try {
    console.log("🚀 Initializing CSV upload system...");
    
    // Create orchestrator instance
    uploadOrchestrator = new UploadOrchestrator();
    
    // Initialize with all components
    uploadOrchestrator.initialize();
    
    console.log("✅ CSV upload system initialized successfully");
    
    // Make orchestrator globally available for debugging
    window.uploadOrchestrator = uploadOrchestrator;
    
    // Set up cleanup on page unload
    window.addEventListener('beforeunload', cleanupUploadSystem);
    
  } catch (error) {
    console.error("❌ Failed to initialize upload system:", error);
    
    // Show error in upload interface if available
    const statusContainer = document.getElementById('upload-status');
    const statusMessage = document.getElementById('status-message');
    
    if (statusContainer && statusMessage) {
      statusContainer.style.display = 'block';
      statusContainer.className = 'upload-status error';
      statusMessage.textContent = `Upload system initialization failed: ${error.message}`;
    }
  }
}

// Cleanup function for upload system
function cleanupUploadSystem() {
  try {
    if (uploadOrchestrator) {
      console.log("🧹 Cleaning up upload system...");
      
      // Destroy orchestrator and cleanup resources
      uploadOrchestrator.destroy();
      uploadOrchestrator = null;
      
      // Clear any temporary data from sessionStorage related to uploads
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('upload') || key.includes('undo') || key.includes('csv'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log("✅ Upload system cleanup completed");
    }
  } catch (error) {
    console.error("❌ Error during upload system cleanup:", error);
  }
}

// Call the sorting function when the page loads to initially sort the table by PUTR
window.addEventListener("load", () => {
  // Debug: Check if constants are loaded
  console.log('🔍 COLLECTIONS available:', typeof COLLECTIONS !== 'undefined' ? COLLECTIONS : 'NOT DEFINED');
  console.log('🔍 Environment detection:', typeof isDevelopment !== 'undefined' ? isDevelopment() : 'NOT DEFINED');
  console.log('🔍 Collection to use:', typeof COLLECTIONS !== 'undefined' ? COLLECTIONS.PLAYERS : 'FALLBACK TO players');
  
  populateTable();
  
  // Initialize upload system after a short delay to ensure all dependencies are loaded
  setTimeout(() => {
    initializeUploadSystem();
  }, 100);
});


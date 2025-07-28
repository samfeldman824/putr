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




let putrAsc = true;
let netAsc  = true;


function populateTable() {
  console.log("populateTable called");
  const tableBody = document.getElementById("table-body");
  // tableBody.innerHTML = ""; // Clear existing rows

  db.collection("players").get()
    .then((querySnapshot) => {
      let playerCount = 0;
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const key = doc.id;
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
        tableBody.appendChild(row);
        console.log("Appending row for", key, item);
        playerCount++;
      });
      console.log("Total rows appended:", playerCount);
      sortTableByPutr();
    })
    .catch((error) => {
      console.error("Error fetching players from Firestore:", error);
    });
}





  function sortTableByPutr() {
    const tbody = document.querySelector('#leaderboard-table tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr'));
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
    document.getElementById('net-arrow').textContent   = '';
  }
  
  function sortTableByNet() {
    const tbody = document.querySelector('#leaderboard-table tbody');
    const rows  = Array.from(tbody.querySelectorAll('tr'));
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
    document.getElementById('net-arrow').textContent   = netAsc ? '▼' : '▲';
    document.getElementById('putr-arrow').textContent = '';
  }
  
  // Call the sorting function when the page loads to initially sort the table by PUTR
  window.addEventListener("load", () => {
    populateTable()
  });


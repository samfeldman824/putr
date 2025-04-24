let putrAsc = true;
let netAsc  = true;


function populateTable() {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        const tableBody = document.getElementById("table-body");
        for (let key in data) {
          item = data[key]
          let encodedName = encodeURIComponent(key)
          const row = document.createElement("tr");
          row.innerHTML = `
          <td class="flag-container">
            <img src="${item.flag}" class="player-flag"/>
          </td>
          <td class="player-name">
      <a href="profile.html?playerName=${encodedName}"('${key}')">${key}</a>
    </td>
          <td class="player-putr">${item.putr.toFixed(2)}</td>
          <td class="player-net">${item.net.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
      }
        
        sortTableByPutr()

      })
      .catch((error) => {
        console.error("Error fetching data:", error);
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


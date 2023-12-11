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
        
        sortTableByNet()

      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

function sortTableByPutr() {
    const table = document.getElementById("leaderboard-table");
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.getElementsByTagName('tr'));
  
    rows.sort((a, b) => {
      const aValue = parseFloat(a.querySelector('.player-putr').textContent);
      const bValue = parseFloat(b.querySelector('.player-putr').textContent);
      return bValue - aValue; // Sort in descending order
    });
  
    // Clear the table
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
  
    // Re-add the sorted rows
    rows.forEach((row) => {
      tbody.appendChild(row);
    });
  }

  function sortTableByNet() {
    const table = document.getElementById("leaderboard-table");
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.getElementsByTagName('tr'));
  
    rows.sort((a, b) => {
      const aValue = parseFloat(a.querySelector('.player-net').textContent);
      const bValue = parseFloat(b.querySelector('.player-net').textContent);
      return bValue - aValue; // Sort in descending order
    });
  
    // Clear the table
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
  
    // Re-add the sorted rows
    rows.forEach((row) => {
      tbody.appendChild(row);
    });
  }
  
  // Call the sorting function when the page loads to initially sort the table by PUTR
  window.addEventListener("load", () => {
    populateTable()
  });


// Vervang dit met de URL van je Render backend
const API_URL = 'https://risicodatabase.onrender.com';  // Render URL van de backend

document.getElementById('risk-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const riskDescription = document.getElementById('risk-description').value;
  
  // Verstuur het nieuwe risico naar de server
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description: riskDescription }),
  });
  
  if (response.ok) {
    const newRisk = await response.json();
    displayRisks();  // Update de risicolijst
  }
});

async function displayRisks() {
  const response = await fetch(API_URL);  // Haal risico's op van de Render API
  const risks = await response.json();

  const riskList = document.getElementById('risk-list');
  riskList.innerHTML = ''; // Leeg de lijst
  risks.forEach((risk, index) => {
    const riskItem = document.createElement('div');
    riskItem.className = 'risk-item';
    riskItem.innerHTML = `<strong>Risico ${index + 1}:</strong> ${risk.description}`;
    riskList.appendChild(riskItem);
  });
}

window.onload = displayRisks;

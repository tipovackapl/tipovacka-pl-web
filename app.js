const finance = [20000,15750,12250,9250,6500,3750,2500,1250,0,-1500,-1750,-2000,-2250,-2500,-2750,-3000,-3250,-3500,-3750,-4000,-4250,-4500,-4750,-5000,-5250,-5500,-5750];

let data;
let selectedRound = 1;
let selectedPlayer = "všichni";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]);
const formatPoints = (value) => Number.isInteger(Number(value)) ? String(value) : Number(value || 0).toFixed(1).replace(".", ",");
const money = (value) => Number(value || 0).toLocaleString("cs-CZ") + " Kč";

function renderStandings() {
  return data.standings.map((entry, index) => {
    const amount = finance[index] ?? 0;
    return `<tr>
      <td><span class="rank-badge">${index + 1}.</span></td>
      <th>${escapeHtml(entry.alias)}</th>
      <td class="points-strong">${formatPoints(entry.total)}</td>
      <td>${formatPoints(entry.playerPoints)}</td>
      <td>${entry.exactDoubles || "—"}</td>
      <td class="${amount >= 0 ? "money-plus" : "money-minus"}">${money(amount)}</td>
    </tr>`;
  }).join("");
}

function cellRows(roundData, aliases) {
  const matchRows = roundData.matches.map((match, matchIndex) => {
    const playerCells = aliases.map(alias => {
      const entry = roundData.entries.find(candidate => candidate.alias === alias);
      const isDouble = entry?.imported && entry.doubleIndex === matchIndex;
      const tip = entry?.imported ? entry.tips[matchIndex] : "";
      const points = entry?.imported && match.completed ? entry.matchPoints[matchIndex] : null;
      return `<td class="tip-cell ${isDouble ? "double" : ""}">${escapeHtml(tip)}</td><td class="body-cell ${isDouble ? "double" : ""}">${points === null ? "" : formatPoints(points)}</td>`;
    }).join("");
    return `<tr><th class="sticky-match match-name">${escapeHtml(match.name)}</th><td class="sticky-result actual-result">${match.completed ? `${match.homeGoals}:${match.awayGoals}` : "—"}</td>${playerCells}</tr>`;
  }).join("");
  const playerRows = [0, 1].map(playerIndex => {
    const playerCells = aliases.map(alias => {
      const entry = roundData.entries.find(candidate => candidate.alias === alias);
      const player = entry?.imported ? entry.players[playerIndex] : "";
      const points = entry?.imported && roundData.complete ? entry.playerPoints[playerIndex] : null;
      return `<td class="tip-cell player-name">${escapeHtml(player)}</td><td class="body-cell">${points === null ? "" : formatPoints(points)}</td>`;
    }).join("");
    return `<tr class="player-row"><th class="sticky-match match-name">Hráč ${playerIndex + 1}</th><td class="sticky-result actual-result"></td>${playerCells}</tr>`;
  }).join("");
  return matchRows + playerRows;
}

function renderSheet() {
  const roundData = data.rounds.find(item => item.round === selectedRound) || data.rounds[0];
  const aliases = selectedPlayer === "všichni" ? data.participants : [selectedPlayer];
  const playerHeads = aliases.map(alias => {
    const entry = roundData.entries.find(candidate => candidate.alias === alias);
    return `<th colspan="2" class="player-head"><strong>${escapeHtml(alias)}</strong><span>${entry?.imported ? (roundData.complete ? `${formatPoints(entry.total)} b.` : "tip přijat") : "čekáme"}</span></th>`;
  }).join("");
  const subheads = aliases.map(() => '<th class="subhead tip-head">Tip</th><th class="subhead body-head">B</th>').join("");
  return `<table class="prediction-sheet"><thead>
    <tr class="summary-row"><th class="sticky-match">${roundData.round}. kolo</th><th class="sticky-result">Výsledek</th>${playerHeads}</tr>
    <tr><th class="sticky-match subhead">Zápas</th><th class="sticky-result subhead">Skóre</th>${subheads}</tr>
  </thead><tbody>${cellRows(roundData, aliases)}</tbody></table>`;
}

function updateSheet() {
  document.querySelector(".sheet-wrap").innerHTML = renderSheet();
  const hint = document.querySelector(".scroll-hint");
  if (hint) hint.hidden = selectedPlayer !== "všichni";
}

function render() {
  const completedRounds = data.rounds.filter(item => item.complete).length;
  const round1Count = data.rounds[0]?.entries.filter(entry => entry.imported).length || 0;
  const round2Count = data.rounds[1]?.entries.filter(entry => entry.imported).length || 0;
  const updatedAt = new Date(data.generatedAt).toLocaleString("cs-CZ", {dateStyle:"medium", timeStyle:"short"});
  const podium = data.standings.slice(0, 3).map((entry, index) => `<article class="podium__item podium__item--${index + 1}"><span class="podium__rank">${index + 1}</span><div><h3>${escapeHtml(entry.alias)}</h3><p>${formatPoints(entry.total)} b.</p></div><small>hráči ${formatPoints(entry.playerPoints)} b.</small></article>`).join("");
  const roundOptions = data.rounds.map(item => `<option value="${item.round}">${item.round}. kolo</option>`).join("");
  const playerOptions = data.participants.map(alias => `<option value="${escapeHtml(alias)}">${escapeHtml(alias)}</option>`).join("");
  const missing = data.missingRound1.length ? `<strong>Předběžné pořadí.</strong> Chybí kompletní tipy hráčů ${escapeHtml(data.missingRound1.join(", "))}.` : `<strong>První kolo je kompletní.</strong> Načteny jsou tipy všech ${data.participants.length} hráčů.`;

  document.getElementById("app").innerHTML = `
    <header class="hero"><div class="hero__inner">
      <div class="brand"><span class="brand__mark" aria-hidden="true">PL</span><div><p class="eyebrow">Tipovačka • sezóna 2026/27</p><h1>Premier League<br>na jeden pohled</h1></div></div>
      <p class="hero__copy">Stejná společná tabulka, jen pohodlněji. Tipy se spojují z WhatsAppu i excelových příloh poslaných e-mailem.</p>
      <div class="hero__stats" aria-label="Stav soutěže"><div><span>1.</span><strong>${escapeHtml(data.standings[0]?.alias || "—")}</strong><small>${data.standings[0] ? `${formatPoints(data.standings[0].total)} bodu` : "čekáme na tipy"}</small></div><div><span>${round1Count}/${data.participants.length}</span><strong>tipů načteno</strong><small>1. kolo</small></div><div><span>${round2Count}/${data.participants.length}</span><strong>tipů přijato</strong><small>2. kolo</small></div></div>
    </div></header>
    <section class="notice" aria-label="Stav importu">${missing}</section>
    <section class="section standings-section"><div class="section__heading"><div><p class="eyebrow dark">Po ${completedRounds}. kole</p><h2>Průběžné pořadí</h2></div><span class="status-pill"><i></i>${completedRounds * 10} zápasů uzavřeno</span></div><div class="podium">${podium}</div><div class="standings-table-wrap"><table class="standings-table"><thead><tr><th>Pořadí</th><th>Hráč</th><th>Body</th><th>Hráči</th><th>Přesný DOUBLE</th><th>Finance</th></tr></thead><tbody>${renderStandings()}</tbody></table></div></section>
    <section class="sheet-section" id="tabulka"><div class="sheet-toolbar"><div><p class="eyebrow">Společná tabulka</p><h2>Tipy a body</h2></div><div class="round-switch"><label for="round">Kolo</label><select id="round">${roundOptions}</select></div></div><div class="focus-control"><label for="focus">Zobrazit</label><select id="focus"><option value="všichni">Všechny hráče</option>${playerOptions}</select><span class="scroll-hint">Tabulku lze posouvat do stran →</span></div><div class="sheet-wrap">${renderSheet()}</div><div class="legend"><span><i class="legend__double"></i> DOUBLE</span><span><i class="legend__result"></i> konečný výsledek</span><span><i class="legend__missing"></i> tip v exportu chybí</span></div></section>
    <footer><p><strong>Tipovačka PL 2026/27</strong> • aktualizováno ${escapeHtml(updatedAt)}</p><p>Výsledky, výkopy a hráčské události se načítají automaticky; zdrojem výsledků je ${escapeHtml(data.provider)}.</p></footer>`;
  document.getElementById("round").value = String(selectedRound);
  document.getElementById("round").addEventListener("change", event => { selectedRound = Number(event.target.value); updateSheet(); });
  document.getElementById("focus").addEventListener("change", event => { selectedPlayer = event.target.value; updateSheet(); });
}

fetch("data.json", {cache:"no-store"})
  .then(response => { if (!response.ok) throw new Error("Data nejsou dostupná"); return response.json(); })
  .then(payload => { data = payload; selectedRound = data.rounds.find(item => !item.complete)?.round || data.rounds.at(-1)?.round || 1; render(); })
  .catch(() => { document.getElementById("app").innerHTML = '<div class="error"><strong>Aktuální výsledky se nepodařilo načíst.</strong><br>Zkuste stránku za chvíli obnovit.</div>'; });


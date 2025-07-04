const soundStart = new Audio('sounds/start.mp3');
const soundWin = new Audio('sounds/win.mp3');
const soundDraw = new Audio('sounds/draw.mp3');
const soundButton = new Audio('sounds/click.mp3');
const soundMove = new Audio('sounds/click.mp3'); // Added
const soundTie = new Audio('sounds/draw.mp3');    // Added

function announceResult(message) {
  announcer.textContent = message;
  announcer.classList.remove("hide");
}

function clearAnnouncement() {
  announcer.textContent = "";
  announcer.classList.add("hide");
}

const container = document.querySelector(".container");
const display = document.querySelector(".display");
const announcer = document.querySelector(".announcer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const playerXInput = document.getElementById("playerXName");
const playerOInput = document.getElementById("playerOName");
const scoreXElem = document.getElementById("scoreX");
const scoreOElem = document.getElementById("scoreO");
const scoreTieElem = document.getElementById("scoreDraw");

const modeSelect = document.getElementById("gameMode");
const boardSizeSelect = document.getElementById("boardSize");

const timerElem = document.getElementById("timer");
const moveHistoryList = document.getElementById("moveHistory");
const shareBtn = document.getElementById("shareBtn");

let boardSize = parseInt(boardSizeSelect.value);
let board = [];
let currentPlayer = "X";
let gameActive = false;
let moveCount = 0;

let scoreX = 0;
let scoreO = 0;
let scoreTie = 0;

let timerInterval = null;
let timerSeconds = 0;

let moveHistory = [];

const isPvC = () => modeSelect.value === "pvc";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function updateTimer() {
  timerSeconds++;
  timerElem.textContent = formatTime(timerSeconds);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds = 0;
  timerElem.textContent = "00:00";
}

function generateBoard() {
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(""));

  for (let i = 0; i < boardSize * boardSize; i++) {
    const tile = document.createElement("div");
    tile.className = "tile"; // Reset classes
    tile.dataset.index = i;
    tile.textContent = ""; // Clear content
    tile.style.pointerEvents = "auto"; // Re-enable interaction
    tile.addEventListener("click", handleTileClick);
    container.appendChild(tile);
  }
}

function updateDisplayTurn() {
  const playerName = currentPlayer === "X" ? (playerXInput.value.trim() || "X") : (playerOInput.value.trim() || "O");
  display.innerHTML = `Player <span class="display-player player${currentPlayer}">${playerName} (${currentPlayer})</span>'s turn`;
}

function updateScoreboard() {
  scoreXElem.textContent = `${playerXInput.value.trim() || "X"}: ${scoreX}`;
  scoreOElem.textContent = `${playerOInput.value.trim() || "O"}: ${scoreO}`;
  scoreTieElem.textContent = `Draws: ${scoreTie}`;
}

function clearMoveLog() {
  moveHistory = [];
  moveHistoryList.innerHTML = "";
}

function addMoveToLog(player, position) {
  const playerName = player === "X" ? (playerXInput.value.trim() || "X") : (playerOInput.value.trim() || "O");
  const moveText = `${playerName} (${player}) placed at ${position}`;
  moveHistory.push(moveText);

  const li = document.createElement("li");
  li.textContent = moveText;
  moveHistoryList.appendChild(li);
  moveHistoryList.scrollTop = moveHistoryList.scrollHeight;
}

function indexToRowCol(index) {
  return { row: Math.floor(index / boardSize), col: index % boardSize };
}

function checkWin(player) {
  for (let r = 0; r < boardSize; r++) {
    if (board[r].every(cell => cell === player)) return true;
  }
  for (let c = 0; c < boardSize; c++) {
    if (board.every(row => row[c] === player)) return true;
  }
  if (board.every((row, i) => row[i] === player)) return true;
  if (board.every((row, i) => row[boardSize - 1 - i] === player)) return true;
  return false;
}

function checkTie() {
  return board.every(row => row.every(cell => cell !== ""));
}

function computerMove() {
  if (!gameActive) return;

  let emptyTiles = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === "") emptyTiles.push({ r, c });
    }
  }
  if (emptyTiles.length === 0) return;

  const choice = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  placeMark(choice.r, choice.c, "O");
  updateTileUI(choice.r, choice.c, "O");
  addMoveToLog("O", `row ${choice.r + 1}, col ${choice.c + 1}`);
  moveCount++;

  if (checkWin("O")) {
    announceResult(`${playerOInput.value.trim() || "Player O"} (O) Wins!`);
    scoreO++;
    updateScoreboard();
    gameActive = false;
    stopTimer();
    soundWin.play();
    return;
  }

  if (checkTie()) {
    announceResult("It's a Tie!");
    scoreTie++;
    updateScoreboard();
    gameActive = false;
    stopTimer();
    soundTie.play();
    return;
  }

  currentPlayer = "X";
  updateDisplayTurn();
  clearAnnouncement();
}

function placeMark(row, col, player) {
  board[row][col] = player;
}

function updateTileUI(row, col, player) {
  const index = row * boardSize + col;
  const tile = container.querySelector(`.tile[data-index='${index}']`);
  if (tile) {
    tile.textContent = player;
    tile.classList.add(player === "X" ? "playerX" : "playerO");
    tile.style.pointerEvents = "none";
    soundMove.play();
  }
}

function handleTileClick(e) {
  if (!gameActive) {
    announceResult("Game is not active. Please start the game.");
    return;
  }

  const tile = e.target;
  if (tile.textContent !== "") {
    announceResult("This box is already filled. Please choose another one.");
    return;
  }

  clearAnnouncement();

  const index = parseInt(tile.dataset.index);
  const { row, col } = indexToRowCol(index);

  placeMark(row, col, currentPlayer);
  updateTileUI(row, col, currentPlayer);
  addMoveToLog(currentPlayer, `row ${row + 1}, col ${col + 1}`);
  moveCount++;

  if (checkWin(currentPlayer)) {
    announceResult(`${(currentPlayer === "X" ? playerXInput.value.trim() || "Player X" : playerOInput.value.trim() || "Player O")} (${currentPlayer}) Wins!`);
    if (currentPlayer === "X") scoreX++;
    else scoreO++;
    updateScoreboard();
    gameActive = false;
    stopTimer();
    soundWin.play();
    return;
  }

  if (checkTie()) {
    announceResult("It's a Tie!");
    scoreTie++;
    updateScoreboard();
    gameActive = false;
    stopTimer();
    soundTie.play();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateDisplayTurn();
  clearAnnouncement();

  if (gameActive && isPvC() && currentPlayer === "O") {
    setTimeout(computerMove, 600);
  }
}

function startTimer() {
  if (!timerInterval) {
    timerInterval = setInterval(updateTimer, 1000);
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function startGame() {
  boardSize = parseInt(boardSizeSelect.value); // Fix: ensure correct board size
  if (gameActive) {
    announceResult("Game already running!");
    return;
  }

  gameActive = true;
  moveCount = 0;
  clearAnnouncement();
  clearMoveLog();
  generateBoard();
  currentPlayer = "X";
  updateDisplayTurn();
  startTimer();
  soundButton.play();

  pauseBtn.disabled = false;
  resetBtn.disabled = false;
}

function pauseGame() {
  if (!gameActive) {
    announceResult("Game is not running.");
    return;
  }

  gameActive = false;
  stopTimer();
  announceResult("Game Paused");
  soundButton.play();
}

function resetGame() {
  gameActive = false;
  stopTimer();
  clearAnnouncement();
  clearMoveLog();
  generateBoard();
  currentPlayer = "X";
  updateDisplayTurn();
  moveCount = 0;
  soundButton.play();

  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

function shareResults() {
  if (gameActive) {
    announceResult("Finish the game before sharing results.");
    return;
  }
  let resultText = `Tic Tac Toe Result:\n${playerXInput.value.trim() || "Player X"} (X) - ${scoreX}\n${playerOInput.value.trim() || "Player O"} (O) - ${scoreO}\nDraws: ${scoreTie}`;
  if (navigator.share) {
    navigator.share({
      title: 'Tic Tac Toe Result',
      text: resultText,
    }).catch(console.error);
  } else {
    prompt("Copy your game results:", resultText);
  }
  soundButton.play();
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);
shareBtn?.addEventListener("click", shareResults);

playerXInput.addEventListener("input", updateScoreboard);
playerOInput.addEventListener("input", updateScoreboard);

modeSelect.addEventListener("change", () => {
  resetGame();
});

boardSizeSelect.addEventListener("change", () => {
  boardSize = parseInt(boardSizeSelect.value);
  resetGame();
});

generateBoard();
updateDisplayTurn();
updateScoreboard();
resetTimer();
pauseBtn.disabled = true;
resetBtn.disabled = true;
  

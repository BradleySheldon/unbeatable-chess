import { Chess } from "./chess.js";

let game = new Chess();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let aiBusy = false;              // lock input while AI is "thinking"
let hiddenSquares = new Set();   // squares to temporarily hide pieces on

let flipped = false;
let selected = null;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const movesEl = document.getElementById("moves");
const depthEl = document.getElementById("depth");
const enginePathEl = document.getElementById("enginePath");

const pieceToUnicode = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};

function squaresInOrder() {
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["1","2","3","4","5","6","7","8"];
  const r = flipped ? ranks : ranks.slice().reverse();
  const f = flipped ? files.slice().reverse() : files;
  const out = [];
  for (const rank of r) for (const file of f) out.push(file + rank);
  return out;
}

function legalDestinations(from) {
  return game.moves({ square: from, verbose: true }).map(m => m.to);
}

function updateStatusAndMoves() {
  let s = "";
  if (game.isCheckmate()) s = "Checkmate.";
  else if (game.isDraw()) s = "Draw.";
  else {
    s = (game.turn() === "w" ? "White" : "Black") + " to move.";
    if (game.inCheck()) s += " (Check!)";
  }
  statusEl.textContent = s;

  const hist = game.history();
  let lines = "";
  for (let i = 0; i < hist.length; i += 2) {
    const moveNum = (i / 2) + 1;
    const w = hist[i] || "";
    const b = hist[i + 1] || "";
    lines += `${moveNum}. ${w}  ${b}\n`;
  }
  movesEl.textContent = lines.trim();
}

function render() {
  boardEl.innerHTML = "";

  const order = squaresInOrder();
  const hints = selected ? new Set(legalDestinations(selected)) : new Set();

  for (const sq of order) {
    const div = document.createElement("div");
    div.className = "square";

    const file = sq.charCodeAt(0) - 96; // a=1
    const rank = parseInt(sq[1], 10);
    const isLight = (file + rank) % 2 === 0;
    div.classList.add(isLight ? "light" : "dark");

    if (selected === sq) div.classList.add("selected");
    if (hints.has(sq)) div.classList.add("hint");

    const piece = game.get(sq);
    if (piece && !hiddenSquares.has(sq)) {
        const key = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
        div.textContent = pieceToUnicode[key];
    }

    div.addEventListener("click", () => onSquareClick(sq));
    boardEl.appendChild(div);
  }

  updateStatusAndMoves();
}

async function onSquareClick(sq) {
  if (aiBusy) return;
  if (game.isGameOver()) return;

  // Human plays White only
  if (game.turn() !== "w") return;

  if (!selected) {
    const p = game.get(sq);
    if (p && p.color === "w") {
      selected = sq;
      render();
    }
    return;
  }

  // Re-select if clicking another white piece
  const p = game.get(sq);
  if (p && p.color === "w") {
    selected = sq;
    render();
    return;
  }

  // Try move (auto-queen promotion)
  const moved = game.move({ from: selected, to: sq, promotion: "q" });
  selected = null;
  render();

  if (moved) {
    await doAIMove();
    render();
  }
}

async function doAIMove() {
  if (game.isGameOver()) return;

  aiBusy = true;

  const depth = parseInt(depthEl.value, 10);
  const fen = game.fen();

  statusEl.textContent = "AI thinking...";

  // Get best move, but ensure at least 3 seconds pass before applying it
  const t0 = Date.now();
  const best = await window.engineAPI.bestMove(fen, { depth });
  const elapsed = Date.now() - t0;
  if (elapsed < 2500) await sleep(2500 - elapsed);

  if (!best || best === "(none)") {
    aiBusy = false;
    return;
  }

  const from = best.slice(0, 2);
  const to = best.slice(2, 4);
  const promo = best.length >= 5 ? best.slice(4, 5) : "q";

  // Hide the moving piece for 1 second (disappear effect)
  hiddenSquares = new Set([from]);
  render();
  await sleep(600);

  hiddenSquares = new Set();
  game.move({ from, to, promotion: promo });

  aiBusy = false;
}

document.getElementById("newGame").addEventListener("click", () => {
  game.reset();
  selected = null;
  render();
});

document.getElementById("flip").addEventListener("click", () => {
  flipped = !flipped;
  selected = null;
  render();
});

// Render immediately so you see the board even if engine ping fails
render();

(async () => {
  try {
    const info = await window.engineAPI.ping();
    enginePathEl.textContent = info.enginePath;
  } catch (e) {
    enginePathEl.textContent = "(engine not available)";
    console.error(e);
  }
})();

Unbeatable Chess (Desktop)  Electron + Stockfish

A desktop chess app built with Electron and a Stockfish UCI engine backend.
You play as White, the AI plays as Black.

NOTE: This repository intentionally does NOT include the Stockfish engine binary. You download it separately and place it in engine/ locally.

- FEATURES
Desktop app (Electron)
Legal move validation + game state management via chess.js
Stockfish AI opponent (UCI protocol)
AI strength control (search depth)
Move list + game status (check/checkmate/draw)

- The AI opponent is Stockfish, a chess engine that searches many possible move sequences using minimax with alpha beta pruning. It evaluates each position with a scoring function based on things like material and king safety, then chooses the move that leads to the best score. It does not use a learned reward function like reinforcement learning systems; it relies on search plus its evaluation score.

- TECH STACK
Electron
HTML / CSS / JavaScript
Stockfish (UCI engine)
chess.js (rules / legality / FEN)

- PROJECT STRUCTURE
unbeatable-chess/
main.js
preload.js
package.json
package-lock.json
renderer/
index.html
style.css
renderer.js
chess.js
engine/
(place your stockfish binary here; not committed)

- REQUIREMENTS
Node.js + npm
A Stockfish UCI binary for your OS

- INSTALL & RUN
Clone the repo
git clone https://github.com/BradleySheldon/unbeatable-chess.git
cd unbeatable-chess

- Install dependencies
npm install
Add Stockfish (required)
This project expects Stockfish here:
Linux/macOS: engine/stockfish
Windows: engine/stockfish.exe

Option A — Install with apt (easy on Debian/Parrot)
sudo apt update
sudo apt install -y stockfish
mkdir -p engine
cp "$(command -v stockfish || which stockfish)" ./engine/stockfish
chmod +x ./engine/stockfish

Option B — Download a Stockfish release (recommended)
Download a Stockfish build from the official releases page, then place it into engine/:
mkdir -p engine
cp /path/to/your/stockfish-binary ./engine/stockfish
chmod +x ./engine/stockfish

Quick test Stockfish works
./engine/stockfish
Then type:
uci
isready
quit
You should see uciok and readyok.

- Start the app
npm start

- HOW TO PLAY
Click a white piece to select it
Click a highlighted destination square to move
AI responds as Black
Use AI Depth to adjust strength
Flip Board changes orientation
New Game resets the board

- PACKAGING (OPTIONAL)
This repo includes electron-builder. To build a distributable:
npm run dist

NOTE: distributing an app that bundles Stockfish may create GPL compliance obligations. This repo does not bundle Stockfish by default.

- THIRD-PARTY NOTES & LICENSING
Stockfish is GPL licensed. This repository does NOT include the Stockfish binary. Users provide it locally in engine/.
chess.js is installed via npm. This repo currently includes a local copy at renderer/chess.js to support renderer-side module imports.
If you plan to distribute builds publicly (especially with bundled engines/assets), review and comply with all relevant licenses.

- ROADMAP / FUTURE IMPROVEMENTS
SVG piece themes + theme selector
Highlight AI’s last move squares
Sound effects + smoother move visuals
Time controls

PGN import/export

Analysis mode (eval + best line)

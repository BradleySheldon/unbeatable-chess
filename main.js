const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function enginePath() {
  const exe = process.platform === "win32" ? "stockfish.exe" : "stockfish";
  return path.join(__dirname, "engine", exe);
}

class StockfishUCI {
  constructor() {
    this.proc = null;
    this.buffer = "";
    this.uciOk = false;
    this.readyOk = false;
    this.pending = [];
  }

  start() {
    if (this.proc) return;

    const p = enginePath();
    this.proc = spawn(p, [], { stdio: ["pipe", "pipe", "pipe"] });

    this.proc.on("error", (err) => {
      console.error("Stockfish spawn error:", err);
    });

    this.proc.stdout.on("data", (chunk) => this._onData(chunk.toString("utf8")));
    this.proc.stderr.on("data", (chunk) => {
      // Helpful if Stockfish complains
      console.error("[stockfish stderr]", chunk.toString("utf8"));
    });

    this.send("uci");
    this.send("isready");
  }

  stop() {
    if (!this.proc) return;
    try { this.send("quit"); } catch {}
    try { this.proc.kill(); } catch {}
    this.proc = null;
    this.buffer = "";
    this.uciOk = false;
    this.readyOk = false;
    this.pending = [];
  }

  send(line) {
    if (!this.proc) this.start();
    this.proc.stdin.write(line + "\n");
  }

  _onData(text) {
    this.buffer += text;

    let idx;
    while ((idx = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line) continue;

      if (line === "uciok") this.uciOk = true;
      if (line === "readyok") this.readyOk = true;

      if (line.startsWith("bestmove ")) {
        const best = line.split(/\s+/)[1];
        const job = this.pending.shift();
        if (job) job.resolve(best);
      }
    }
  }

  async waitReady(timeoutMs = 3000) {
    const start = Date.now();
    while (!(this.uciOk && this.readyOk)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error("Stockfish not ready (timeout).");
      }
      this.send("isready");
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  async bestMoveFromFEN(fen, { depth = 16, movetimeMs = 0 } = {}) {
    if (!this.proc) this.start();
    await this.waitReady();

    this.send(`position fen ${fen}`);
    if (movetimeMs > 0) this.send(`go movetime ${movetimeMs}`);
    else this.send(`go depth ${depth}`);

    return await new Promise((resolve) => this.pending.push({ resolve }));
  }
}

let win;
const engine = new StockfishUCI();

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  engine.start();
  createWindow();
});

app.on("window-all-closed", () => {
  engine.stop();
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("engine:ping", async () => {
  return { enginePath: enginePath() };
});

ipcMain.handle("engine:bestmove", async (_evt, fen, options) => {
  return await engine.bestMoveFromFEN(fen, options || {});
});

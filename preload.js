const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("engineAPI", {
  ping: () => ipcRenderer.invoke("engine:ping"),
  bestMove: (fen, options) => ipcRenderer.invoke("engine:bestmove", fen, options)
});


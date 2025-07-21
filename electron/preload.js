// Этот файл выполняется в контексте рендерера, но имеет доступ к некоторым Node.js API
// Здесь мы можем безопасно предоставлять API для основного процесса

const { contextBridge, ipcRenderer } = require('electron');

// Предоставляем безопасные API через contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Здесь можно добавить специфические API для шахматного приложения
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  
  // Пример: отправка сообщений в главный процесс
  sendMessage: (channel, data) => {
    // Белый список разрешенных каналов
    const validChannels = ['save-game', 'load-game', 'export-pgn'];
    if (validChannels.includes(channel)) {
      ipcRenderer.invoke(channel, data);
    }
  },
  
  // Получение сообщений от главного процесса
  onMessage: (channel, callback) => {
    const validChannels = ['game-saved', 'game-loaded', 'pgn-exported'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
});

// Проверяем, что мы в Electron окружении
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

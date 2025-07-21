const { app, BrowserWindow, Menu, shell, protocol } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// Отключаем предупреждения безопасности для development
if (isDev) {
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
}

let mainWindow;

function createWindow() {
  // Создаем окно браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      // Для безопасности отключаем node integration
      webSecurity: isDev ? false : true,
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
    show: false, // Не показываем окно пока оно не готово
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  });

  // Показываем окно когда оно готово
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Фокус на окне в dev режиме
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Загружаем приложение
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../out/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Обработка внешних ссылок
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Предотвращаем навигацию на внешние URL и исправляем роутинг
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Разрешаем file:// протокол для локальных файлов
    if (parsedUrl.protocol === "file:") {
      // Проверяем, что это наш локальный файл
      const localPath = path.resolve(__dirname, "../out");
      const targetPath = path.resolve(parsedUrl.pathname);

      if (targetPath.startsWith(localPath)) {
        return; // Разрешаем навигацию
      }
    }

    // Для development режима
    if (isDev) {
      const currentUrl = new URL(mainWindow.webContents.getURL());
      if (parsedUrl.origin !== currentUrl.origin) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
      return;
    }

    // Для production - блокируем внешние URL
    if (parsedUrl.protocol !== "file:") {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Обработка роутинга для SPA
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -6) {
        // FILE_NOT_FOUND
        // Перенаправляем на главную страницу для SPA роутинга
        const indexPath = `file://${path.join(__dirname, "../out/index.html")}`;
        mainWindow.loadURL(indexPath);
      }
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Создаем меню приложения
function createMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: "ChessKit",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services", submenu: [] },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Файл",
      submenu: [
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Правка",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(process.platform === "darwin"
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Речь",
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    {
      label: "Вид",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Окно",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        ...(process.platform === "darwin"
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : []),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "О программе ChessKit",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://github.com/your-repo/chesskit");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const protocolName = "localfile";
protocol.registerSchemesAsPrivileged([
  { scheme: protocolName, privileges: { bypassCSP: true } },
]);

// Этот метод будет вызван, когда Electron завершит
// инициализацию и будет готов к созданию окон браузера.
app.whenReady().then(() => {
  protocol.registerFileProtocol(protocolName, (request, callback) => {
    const url = request.url.replace(`${protocolName}://`, "");
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      // Handle the error as needed
      console.error(error);
    }
  });

  createWindow();
  createMenu();

  app.on("activate", () => {
    // На macOS принято пересоздавать окно в приложении, когда
    // значок док-станции нажат и других окон не открыто.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Выйти, когда все окна закрыты, кроме как на macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Безопасность: предотвращаем создание новых окон
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// В этом файле вы можете включить остальную часть специфичного кода главного процесса
// Вы также можете поместить их в отдельные файлы и подключить здесь.

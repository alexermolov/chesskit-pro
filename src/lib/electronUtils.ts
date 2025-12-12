// Utilities for working with URLs in Electron applications

// Check if we are running in Electron
export const isElectron = (): boolean => {
  if (typeof window === "undefined") return false;

  return !!(
    (window as any).process?.type === "renderer" ||
    (window as any).require ||
    (window as any).electronAPI ||
    navigator.userAgent.toLowerCase().indexOf("electron") > -1
  );
};

export const normalizeElectronUrl = (url: string): string => {
  // Check if we are running in Electron
  if (!isElectron()) {
    return url;
  }

  // In Electron, convert absolute paths to relative
  if (url.startsWith("/")) {
    return "." + url;
  }

  return url;
};

// Function to handle navigation in an Electron-safe manner
export const safeNavigate = (
  router: any,
  path: string,
  query?: any,
  resetCallback?: () => void
): void => {
  if (isElectron()) {
    // In Electron, save the current theme before reload
    // Use the existing useDarkMode key from the app's theme system
    const isDarkMode = localStorage.getItem("useDarkMode");
    if (isDarkMode) {
      localStorage.setItem("electron-theme-backup", isDarkMode);
    }

    // If navigating to the main page with game parameters, save them
    if ((path === "/" || !path) && query) {
      // Save navigation parameters for restoration after reload
      localStorage.setItem("pendingNavigation", JSON.stringify(query));
    }

    // Call callback to reset state before navigation
    if (resetCallback) {
      resetCallback();
    }

    // Then update the URL and reload
    const queryString = query
      ? "?" + new URLSearchParams(query).toString()
      : "";
    window.location.hash = queryString;
    if (path === "/" || !path) {
      window.location.reload();
    } else {
      // For other paths, use router navigation
      if (query) {
        router.push({ pathname: path, query });
      } else {
        router.push(path);
      }
    }
  } else {
    // In the browser, use regular navigation
    if (query) {
      router.push({ pathname: path, query });
    } else {
      router.push(path);
    }
  }
};

// Function to handle PGN loading in an Electron-safe manner
export const safeLoadPgn = (
  router: any,
  pgn: string,
  resetAndSetGamePgn: (pgn: string) => void,
  gamesList?: any[]
): void => {
  if (isElectron()) {
    // In Electron, save theme and PGN to localStorage and then reload
    const isDarkMode = localStorage.getItem("useDarkMode");
    if (isDarkMode) {
      localStorage.setItem("electron-theme-backup", isDarkMode);
    }
    localStorage.setItem("pendingPgn", pgn);

    // Save games list if provided
    if (gamesList && gamesList.length > 0) {
      localStorage.setItem("pendingGamesList", JSON.stringify(gamesList));
    } else {
      localStorage.removeItem("pendingGamesList");
    }

    window.location.hash = "";
    window.location.reload();
  } else {
    // In the browser, use regular navigation and set PGN
    router.push("/");
    resetAndSetGamePgn(pgn);
  }
};

// Function to load resources in Electron
export const loadElectronResource = async (path: string): Promise<Response> => {
  const normalizedPath = normalizeElectronUrl(path);

  try {
    const response = await fetch(normalizedPath);
    if (!response.ok) {
      throw new Error(
        `Failed to load resource: ${response.status} ${response.statusText}`
      );
    }
    return response;
  } catch (error) {
    console.error(`Error loading resource ${path}:`, error);
    throw error;
  }
};

// Check resource availability
export const checkResourceAvailability = async (
  path: string
): Promise<boolean> => {
  try {
    const response = await loadElectronResource(path);
    return response.ok;
  } catch {
    return false;
  }
};

const electronUtils = {
  isElectron,
  normalizeElectronUrl,
  loadElectronResource,
  checkResourceAvailability,
  safeNavigate,
  safeLoadPgn,
};

export default electronUtils;

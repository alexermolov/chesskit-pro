// Utilities for working with URLs in Electron applications

// Проверяем, работаем ли мы в Electron
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

// Function to handle navigation in Electron-safe manner
export const safeNavigate = (router: any, path: string, query?: any): void => {
  if (isElectron()) {
    // В Electron используем обновление URL и перезагрузку
    const queryString = query
      ? "?" + new URLSearchParams(query).toString()
      : "";
    window.location.hash = queryString;
    if (path === "/" || !path) {
      window.location.reload();
    }
  } else {
    // В браузере используем обычную навигацию
    if (query) {
      router.push({ pathname: path, query });
    } else {
      router.push(path);
    }
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
};

export default electronUtils;

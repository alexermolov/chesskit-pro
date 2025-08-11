export const getPaddedNumber = (month: number) => {
  return month < 10 ? `0${month}` : month;
};

export const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  );
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const decodeBase64 = (encoded: string | null): string | null => {
  if (!encoded) return null;
  try {
    return atob(encoded);
  } catch (err) {
    console.error("Error decoding base64:", err);
    return null;
  }
};

/**
 * Форматирует дату в локализованный строковый формат
 */
export const formatDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "--:--:--";
  }
};

/**
 * Removes PGN technical annotations from a comment string
 * @param comment - The comment string to clean
 * @returns Cleaned comment without PGN annotations
 */
export const cleanPgnAnnotations = (comment: string): string => {
  return comment
    .replace(/\{\s*\[%[^}]*\]\s*\}/g, "") // Remove {[%...]} annotations
    .replace(/\[%[^\]]*\]/g, "") // Remove [%...] annotations
    .replace(/\{\s*\}/g, "") // Remove empty braces
    .trim();
};

/**
 * Checks if a comment has real content (not just PGN annotations)
 * @param comment - The comment to check
 * @returns True if comment has real content, false otherwise
 */
export const hasRealComment = (comment: string | null | undefined): boolean => {
  if (!comment || !comment.trim()) return false;

  const cleanComment = cleanPgnAnnotations(comment);
  return cleanComment.length > 0;
};

/**
 * Gets the real content of a comment without PGN annotations
 * @param comment - The comment to process
 * @returns Clean comment content or null if no real content
 */
export const getRealCommentContent = (
  comment: string | null | undefined
): string | null => {
  if (!hasRealComment(comment)) return null;
  return cleanPgnAnnotations(comment!);
};

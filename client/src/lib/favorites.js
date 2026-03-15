const FAVORITES_KEY = "favorite-product-ids";
export const FAVORITES_UPDATED_EVENT = "favorites-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeFavoriteIds(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.map((item) => String(item)).filter(Boolean))];
}

export function getFavoriteIds() {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(FAVORITES_KEY);
    if (!rawValue) return [];

    return normalizeFavoriteIds(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids) {
  if (!canUseStorage()) return [];

  const nextIds = normalizeFavoriteIds(ids);
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: nextIds }));
  return nextIds;
}

export function isFavoriteProduct(productId) {
  return getFavoriteIds().includes(String(productId));
}

export function toggleFavoriteProduct(productId) {
  const normalizedId = String(productId);
  const currentIds = getFavoriteIds();
  const shouldAdd = !currentIds.includes(normalizedId);
  const nextIds = shouldAdd
    ? [normalizedId, ...currentIds]
    : currentIds.filter((id) => id !== normalizedId);

  saveFavoriteIds(nextIds);

  return {
    favorite: shouldAdd,
    ids: nextIds,
  };
}
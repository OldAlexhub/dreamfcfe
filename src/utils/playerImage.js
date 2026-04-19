const imageCache = new Map();

function buildCandidateNames(names) {
  const safeNames = Array.isArray(names) ? names : [names];

  return [...new Set(safeNames.map((name) => String(name || "").trim()).filter(Boolean))];
}

function buildSummaryUrl(name) {
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    name.replace(/\s+/g, "_")
  )}`;
}

export async function getWikipediaPlayerImage(names) {
  const candidates = buildCandidateNames(names);

  for (const candidate of candidates) {
    const cacheKey = candidate.toLowerCase();

    if (!imageCache.has(cacheKey)) {
      imageCache.set(
        cacheKey,
        fetch(buildSummaryUrl(candidate))
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => data?.thumbnail?.source || data?.originalimage?.source || null)
          .catch(() => null)
      );
    }

    const imageUrl = await imageCache.get(cacheKey);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

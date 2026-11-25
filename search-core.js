const SearchCore = (() => {
  const stopWords = new Set([
    "как", "что", "где", "когда", "почему", "можно", "надо", "нужно",
    "мне", "мой", "мои", "мой", "пожалуйста", "сделать", "произошел"
  ]);

  const synonyms = {
    возврат: ["возврат", "вернули", "вернуть", "отменить", "refund", "не пришли", "не поступили"],
    деньги: ["деньги", "средства", "платеж", "платёж", "перевод", "зачисление"],
    пришли: ["пришли", "поступили", "зачислились", "приход"],
    карта: ["карта", "карточка", "plastic"],
    заблокировать: ["заблокировать", " заблокиров", "блокировка", "заморозить"],
    выписка: ["выписка", "справка", "история операций"],
    вклад: ["вклад", "депозит", "накопительный счет", "накопительный счёт"],
    лимит: ["лимит", "предел", "ограничение"],
    списание: ["списание", "сняли", "списали", "списалась", "оплата"]
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return normalize(value)
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  function expandTokens(words) {
    const expanded = new Set(words);
    words.forEach((word) => {
      Object.entries(synonyms).forEach(([canonical, variants]) => {
        if (variants.some((variant) => word.includes(normalize(variant).trim()))) {
          expanded.add(canonical);
          variants.forEach((variant) => expanded.add(normalize(variant).trim()));
        }
      });
    });
    return [...expanded].filter(Boolean);
  }

  function rankSearchResults(query, items) {
    const queryNormalized = normalize(query);
    const queryWords = expandTokens(tokenize(queryNormalized));

    return items
      .map((item) => {
        const title = normalize(item.title);
        const answer = normalize(item.answer);
        const category = normalize(item.categoryName);
        const aliases = (item.aliases || []).map(normalize).join(" ");
        const searchable = normalize(`${title} ${aliases} ${answer} ${category}`);
        let score = 0;

        if (title === queryNormalized || aliases.split(" ").includes(queryNormalized)) {
          score += 100;
        }
        if (queryNormalized && searchable.includes(queryNormalized)) {
          score += 55;
        }

        queryWords.forEach((word) => {
          if (!word) return;
          if (title.includes(word)) score += 8;
          if (aliases.includes(word)) score += 12;
          if (category.includes(word)) score += 5;
          if (answer.includes(word)) score += 3;
        });

        const titleWords = tokenize(title);
        const matchesInTitle = titleWords.filter((word) => queryWords.includes(word)).length;
        if (titleWords.length) score += (matchesInTitle / titleWords.length) * 20;

        return {
          ...item,
          relevance: Math.min(99, Math.round(score)),
        };
      })
      .filter((item) => item.relevance > 10)
      .sort((a, b) => b.relevance - a.relevance);
  }

  return { normalize, tokenize, expandTokens, rankSearchResults };
})();

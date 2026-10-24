function scoreAnswers(answers) {
  const total = {};
  for (const opt of answers) {
    for (const [k, v] of Object.entries(opt.weights)) {
      total[k] = (total[k] || 0) + v;
    }
  }
  return total;
}

function detectStyle(scores) {
  const order = Object.keys(STYLES);
  const ranked = [...order].sort((a, b) => (scores[b] || 0) - (scores[a] || 0) || order.indexOf(a) - order.indexOf(b));
  const main = ranked[0];
  const second = (scores[ranked[1]] || 0) > 0 ? ranked[1] : null;
  return [main, second];
}

function allowed(profile, gender, tier) {
  if (profile.gender !== "unisex" && gender !== profile.gender && gender !== "unisex") return false;
  if (profile.budget !== "any" && BUDGET_ORDER[tier] > BUDGET_ORDER[profile.budget]) return false;
  return true;
}

function rankItem(profile, styles) {
  return (styles.includes(profile.main_style) ? 2 : 0) + (styles.includes(profile.second_style) ? 1 : 0);
}

function recommend(profile, perCategory = 3) {
  const pool = {};
  for (const item of CATALOG) {
    if (!allowed(profile, item.gender, item.price)) continue;
    if (profile.gender === "male" && item.category === "dress") continue;
    const r = rankItem(profile, item.styles);
    if (r) (pool[item.category] ||= []).push({ r, item });
  }
  const result = {};
  for (const cat of Object.keys(CATEGORY_NAMES)) {
    if (!pool[cat]) continue;
    const ranked = pool[cat].sort((a, b) => b.r - a.r).map(x => x.item);
    const chosen = [], used = new Set();
    for (const it of ranked) {
      if (!used.has(it.brand)) { chosen.push(it); used.add(it.brand); }
      if (chosen.length === perCategory) break;
    }
    for (const it of ranked) {
      if (chosen.length === perCategory) break;
      if (!chosen.includes(it)) chosen.push(it);
    }
    result[cat] = chosen;
  }
  return result;
}

function brandsFor(profile, limit = 8) {
  return Object.entries(BRANDS)
    .map(([name, b]) => ({ name, ...b }))
    .filter(b => allowed(profile, "unisex", b.tier) && rankItem(profile, b.styles) > 0)
    .sort((a, b) => rankItem(profile, b.styles) - rankItem(profile, a.styles) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function rankedItems(profile, category, useBudget = true) {
  return CATALOG
    .filter(it => it.category === category)
    .filter(it => profile.gender === "unisex" || it.gender === profile.gender || it.gender === "unisex")
    .filter(it => !useBudget || profile.budget === "any" || BUDGET_ORDER[it.price] <= BUDGET_ORDER[profile.budget])
    .sort((a, b) => rankItem(profile, b.styles) - rankItem(profile, a.styles) || a.brand.localeCompare(b.brand));
}

function setSlot(slots, category, key) {
  slots[category] = key;
  if (category === "dress") { delete slots.top; delete slots.bottom; }
  else if (category === "top" || category === "bottom") delete slots.dress;
}

function money(usd) { return "$" + usd.toLocaleString("en-US").replace(/,/g, " "); }

function totalText(slots) {
  if (!Object.keys(slots).length) return "Аутфит пока пуст";
  return `Собрано вещей: ${Object.keys(slots).length}`;
}

function itemKey(item) { return `${item.brand}|${item.name}|${item.colors[0]}`; }

function allItems() {
  return CATALOG.map(it => ({ ...it, key: itemKey(it) }));
}

const ITEMS_BY_KEY = Object.fromEntries(allItems().map(it => [it.key, it]));
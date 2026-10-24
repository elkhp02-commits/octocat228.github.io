const app = document.getElementById("app");

const ICON = {
  tshirt:"👕", shirt:"👔", hoodie:"🧥", sweater:"🧶", jacket:"🧥", coat:"🧥",
  pants:"👖", shorts:"🩳", skirt:"👗", dress:"👗", sneakers:"👟", boot:"🥾",
  loafer:"👞", cap:"🧢", bag:"👜", scarf:"🧣",
};

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])); }

function themeAttr() { return State.settings.theme; }
function scaleAttr() { return `style="--scale:${State.settings.font_scale}"`; }

function applyTheme() {
  document.documentElement.setAttribute("data-theme", themeAttr());
  document.body.setAttribute("style", `--scale:${State.settings.font_scale}`);
}

function navigate(screen, payload) {
  window.scrollTo(0, 0);
  ROUTES[screen](payload);
}

function wordmark() { return `<div class="wordmark">S T Y L E F I N D E R</div>`; }

function topBar(title, subtitle = "") {
  return `
    ${wordmark()}
    <h2>${esc(title)}</h2>
    ${subtitle ? `<p class="muted" style="margin-top:4px">${esc(subtitle)}</p>` : ""}
  `;
}

function itemCard(item, mode = "catalog", onAction = null) {
  const tags = item.styles.map(s => STYLE_SHORT[s]).filter(Boolean).join(" · ");
  const inWardrobe = State.wardrobe.saved.includes(item.key);
  const priceText = item.price_text || `Ценовой уровень: ${PRICE_NAMES[item.price]}`;
  const actionId = `item-${Math.random().toString(36).slice(2)}`;
  window.__actions = window.__actions || {};
  window.__actions[actionId] = { item, mode, onAction };

  return `
    <div class="item" data-id="${actionId}">
      <div class="item__tile">${ICON[item.kind] || "🧥"}</div>
      <div>
        <div class="item__brand">${esc(item.brand)}</div>
        <div class="item__name">${esc(item.name)}</div>
        <div class="item__tags">${esc(tags)}</div>
        <div class="item__price">${esc(priceText)}</div>
        <div class="item__actions">
          ${mode === "pick" ? `<button class="btn btn--gold btn--sm" data-pick="${actionId}">Выбрать</button>` : ""}
          <button class="btn btn--outline btn--sm" data-open="${actionId}">Найти товар ↗</button>
          ${mode === "wardrobe" ? `<button class="btn btn--ghost btn--sm" data-remove="${actionId}">Убрать</button>` : ""}
          ${mode === "catalog" ? `<button class="btn btn--ghost btn--sm" data-save="${actionId}">${inWardrobe ? "♥ В гардеробе" : "♡ В гардероб"}</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function section(title) {
  return `<div class="section"><div class="section__title">${esc(title)}</div><div class="section__line"></div></div>`;
}

function bindItemActions() {
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
    const { item } = window.__actions[b.dataset.open];
    window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.brand + " " + item.name)}`, "_blank");
  });
    document.querySelectorAll("[data-save]").forEach(b => b.onclick = () => {
    const { item } = window.__actions[b.dataset.save];
    const idx = State.wardrobe.saved.indexOf(item.key);
    if (idx >= 0) State.wardrobe.saved.splice(idx, 1);
    else State.wardrobe.saved.push(item.key);
    State.saveWardrobe();
    b.textContent = State.wardrobe.saved.includes(item.key) ? "♥ В гардеробе" : "♡ В гардероб";
  });
  document.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
    const { item } = window.__actions[b.dataset.remove];
    State.wardrobe.saved = State.wardrobe.saved.filter(k => k !== item.key);
    State.saveWardrobe();
    navigate("wardrobe");
  });
  document.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
    const { item, onAction } = window.__actions[b.dataset.pick];
    onAction(item);
  });
}

const TICKER_EMOJI = ["👕","👖","🧥","👟","👜","🧢","🧣","👗","👞","🧶","👠","🧤","🥾","🕶️","🎩","👔"];

const Ticker = {
  el: null,
  on() {
    if (!this.el) this.el = document.getElementById("ticker");
    if (!this.el) return;
    if (!this.el.dataset.ready) {
      const row = document.createElement("div");
      row.className = "ticker__row";
      const items = [...TICKER_EMOJI, ...TICKER_EMOJI];
      row.innerHTML = items.map(e => `<span class="ticker__emoji">${e}</span>`).join("");
      this.el.appendChild(row);
      this.el.dataset.ready = "1";
      row.style.animationDuration = `${items.length * 2.2}s`;
    }
    this.el.classList.add("is-on");
  },
  off() {
    if (!this.el) this.el = document.getElementById("ticker");
    if (this.el) this.el.classList.remove("is-on");
  },
};
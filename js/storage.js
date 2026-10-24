const Store = {
  get(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};

const State = {
  profile: Store.get("sf.profile", null),
  wardrobe: Store.get("sf.wardrobe", { saved: [], outfits: [] }),
  subscription: Store.get("sf.subscription", { premium: false, since: "" }),
  settings: Store.get("sf.settings", { theme: "light", font_scale: 1.0 }),
  answers: [],
  draft: { name: "", slots: {} },
  draftIndex: null,

  saveProfile()   { Store.set("sf.profile", this.profile); },
  saveWardrobe()  { Store.set("sf.wardrobe", this.wardrobe); },
  saveSub()       { Store.set("sf.subscription", this.subscription); },
  saveSettings()  { Store.set("sf.settings", this.settings); },

  resetProfile()  { this.profile = null; Store.remove("sf.profile"); },
  resetWardrobe() { this.wardrobe = { saved: [], outfits: [] }; Store.remove("sf.wardrobe"); },
  resetAll() {
    this.profile = null;
    this.wardrobe = { saved: [], outfits: [] };
    this.subscription = { premium: false, since: "" };
    ["sf.profile","sf.wardrobe","sf.subscription"].forEach(k => Store.remove(k));
  },
};
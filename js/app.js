const ROUTES = {};

ROUTES.onboarding = () => {
    Ticker.off();
  const styleCards = Object.entries(STYLES).map(([key, desc]) => {
    const [name, , text] = desc.split(" — ");
    return `
      <button class="style-card" data-style="${key}">
        <span class="style-card__name">${esc(name)}</span>
        <span class="style-card__desc">${esc(text)}</span>
      </button>
    `;
  }).join("");

  app.innerHTML = `
    ${wordmark()}
    <h1>Выберите<br>свой стиль</h1>
    <p class="muted" style="margin:8px 0 22px">Если уже знаете, что вам близко — выберите сразу. Если нет — пройдите короткий тест, и мы подскажем.</p>

    <div class="mono gold" style="font-size:10px;letter-spacing:.2em;margin-bottom:8px">СТИЛЬ</div>
    <div class="style-grid">${styleCards}</div>

    <div class="footer-actions">
      <button class="btn btn--gold" id="start-quiz">Не уверен — пройти тест</button>
    </div>
  `;

  document.querySelectorAll(".style-card").forEach(b => b.onclick = () => {
    const key = b.dataset.style;
    State.profile = {
      gender: "unisex",
      budget: "any",
      style_scores: { [key]: 10 },
      main_style: key,
      second_style: null,
      manual: true,
    };
    State.saveProfile();
    navigate("result");
  });

  document.getElementById("start-quiz").onclick = () => {
    State.answers = [];
    State._quizMeta = { gender: "unisex", budget: "any" };
    navigate("quizIntro");
  };
};

ROUTES.quizIntro = () => {
    Ticker.on();
  const meta = State._quizMeta || { gender: "unisex", budget: "any" };
  app.innerHTML = `
    ${wordmark()}
    <h1>Пара вопросов<br>перед тестом</h1>
    <p class="muted" style="margin:8px 0 22px">${QUESTIONS.length} коротких вопросов — и мы подберём стиль, бренды и вещи, которые вам подойдут.</p>

    <div class="mono gold" style="font-size:10px;letter-spacing:.2em;margin-bottom:6px">ДЛЯ КОГО ПОДБИРАЕМ</div>
    <div class="segmented" id="gender">
      <button data-v="male">Мужская</button>
      <button data-v="female">Женская</button>
      <button data-v="unisex" class="is-on">Без разницы</button>
    </div>

    <div class="mono gold" style="font-size:10px;letter-spacing:.2em;margin-bottom:6px">БЮДЖЕТ</div>
    <div class="segmented" id="budget">
      <button data-v="low">Эконом</button>
      <button data-v="mid">Средний</button>
      <button data-v="high">Высокий</button>
      <button data-v="any" class="is-on">Любой</button>
    </div>

    <div class="footer-actions">
      <button class="btn btn--gold" id="start">Начать тест</button>
      <button class="btn btn--ghost btn--sm" id="back">← Назад к выбору стиля</button>
    </div>
  `;
  let gender = meta.gender, budget = meta.budget;
  document.querySelectorAll("#gender button").forEach(b => {
    b.classList.toggle("is-on", b.dataset.v === gender);
    b.onclick = () => {
      gender = b.dataset.v;
      document.querySelectorAll("#gender button").forEach(x => x.classList.toggle("is-on", x === b));
    };
  });
  document.querySelectorAll("#budget button").forEach(b => {
    b.classList.toggle("is-on", b.dataset.v === budget);
    b.onclick = () => {
      budget = b.dataset.v;
      document.querySelectorAll("#budget button").forEach(x => x.classList.toggle("is-on", x === b));
    };
  });
  document.getElementById("back").onclick = () => navigate("onboarding");
  document.getElementById("start").onclick = () => {
    State._quizMeta = { gender, budget };
    State.profile = { gender, budget, style_scores: {}, main_style: null, second_style: null };
    State.answers = [];
    navigate("question", 0);
  };
};

ROUTES.question = (index = 0) => {
    Ticker.on();
  const q = QUESTIONS[index];
  const options = [...q.options].sort(() => Math.random() - 0.5);
  let chosen = -1;

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <button class="btn btn--ghost btn--sm" id="back">← Назад</button>
      <span class="mono gold">${String(index + 1).padStart(2, "0")} / ${String(QUESTIONS.length).padStart(2, "0")}</span>
    </div>
    <div class="progress"><div class="progress__bar" style="width:${((index + 1) / QUESTIONS.length) * 100}%"></div></div>
    <h2 style="margin-bottom:16px">${esc(q.text)}</h2>
    <div id="opts">
      ${options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.text)}</button>`).join("")}
    </div>
    <div class="footer-actions">
      <button class="btn btn--primary" id="next" disabled>${index + 1 === QUESTIONS.length ? "Показать результат" : "Далее"}</button>
    </div>
  `;
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    chosen = +b.dataset.i;
    document.querySelectorAll(".opt").forEach(x => x.classList.toggle("is-on", x === b));
    document.getElementById("next").disabled = false;
  });
  document.getElementById("back").onclick = () => {
    if (index === 0) return navigate("onboarding");
    State.answers.pop();
    navigate("question", index - 1);
  };
  document.getElementById("next").onclick = () => {
    State.answers.push(options[chosen]);
    if (index + 1 < QUESTIONS.length) navigate("question", index + 1);
    else finishQuiz();
  };
};

function finishQuiz() {
  const scores = scoreAnswers(State.answers);
  const [main, second] = detectStyle(scores);
  const meta = State._quizMeta || { gender: "unisex", budget: "any" };
  State.profile = {
    gender: meta.gender,
    budget: meta.budget,
    style_scores: scores,
    main_style: main,
    second_style: second,
  };
  State.saveProfile();
  State._quizMeta = null;
  navigate("result");
}

ROUTES.result = () => {
    Ticker.off();
  const p = State.profile;
  if (!p || !p.main_style) return navigate("onboarding");

  const [name, , desc] = STYLES[p.main_style].split(" — ");
  const brands = brandsFor(p, PREMIUM_BRANDS);
  const recs = recommend(p, PREMIUM_PER_CATEGORY);
  const scores = Object.entries(p.style_scores || {}).filter(([k, v]) => STYLES[k] && v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = scores.reduce((s, [, v]) => s + v, 0);
  const peak = scores[0]?.[1] || 1;

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      ${wordmark()}
      <div style="display:flex;gap:6px">
        <button class="btn btn--outline btn--sm" id="premium">${State.subscription.premium ? "★ Premium ✓" : "★ Premium"}</button>
        <button class="btn btn--ghost btn--sm" id="settings">${State.settings.theme === "dark" ? "☀" : "☾"}</button>
      </div>
    </div>

    <div class="hero">
      <div class="hero__label">ВАШ СТИЛЬ</div>
      <div class="hero__title">${esc(name)}</div>
      <div class="hero__desc">${esc(desc)}</div>
      <div class="bars">
        ${scores.map(([k, v]) => `
          <div class="bar">
            <span>${esc(STYLE_SHORT[k])}</span>
            <div class="bar__track"><div class="bar__fill" style="width:${(v / peak) * 100}%"></div></div>
            <span style="text-align:right">${Math.round(v / total * 100)}%</span>
          </div>
        `).join("")}
      </div>
      ${p.second_style ? `<div class="mono gold" style="margin-top:10px;font-size:10px">Дополнительно: ${esc(STYLE_SHORT[p.second_style])}</div>` : ""}
    </div>

    <div class="row">
      <button class="btn btn--gold" id="new-outfit">Собрать аутфит</button>
      <button class="btn btn--outline" id="random-outfit">🎲 Случайный образ</button>
    </div>
    <div class="row">
      <button class="btn btn--outline" id="wardrobe">Гардероб (${State.wardrobe.saved.length})</button>
      <button class="btn btn--outline" id="outfits">Аутфиты (${State.wardrobe.outfits.length})</button>
      <button class="btn btn--outline" id="advice">Совет стилиста</button>
    </div>
    <div class="row">
      <button class="btn btn--ghost btn--sm" id="retake">Пройти тест заново</button>
      <button class="btn btn--ghost btn--sm" id="change-style">Сменить стиль</button>
    </div>

    ${brands.length ? section("Бренды вашего стиля") : ""}
    <div class="brand-grid">
      ${brands.map(b => `<button class="btn btn--outline btn--sm" data-site="${esc(b.site)}">${esc(b.name)}</button>`).join("")}
    </div>

    ${Object.entries(recs).map(([cat, items]) => `
      ${section(CATEGORY_NAMES[cat] || cat)}
      ${items.map(it => itemCard(it)).join("")}
    `).join("")}
  `;

  bindItemActions();
  document.querySelectorAll("[data-site]").forEach(b => b.onclick = () => window.open(b.dataset.site, "_blank"));
  document.getElementById("premium").onclick = () => navigate("premium");
  document.getElementById("settings").onclick = () => navigate("settings");
  document.getElementById("wardrobe").onclick = () => navigate("wardrobe");
  document.getElementById("outfits").onclick = () => navigate("outfits");
  document.getElementById("advice").onclick = () => showAdvice();
  document.getElementById("retake").onclick = () => { State.answers = []; navigate("onboarding"); };
  document.getElementById("new-outfit").onclick = () => { State.draft = { name: "", slots: {} }; State.draftIndex = null; navigate("builder"); };
  document.getElementById("random-outfit").onclick = () => randomOutfitAction();
  document.getElementById("change-style").onclick = () => navigate("onboarding");
};

function showAdvice() {
  const p = State.profile;
  let text = STYLE_TIPS[p.main_style];
  if (State.subscription.premium && p.second_style) text += "\n\nЧтобы добавить нотку " + STYLE_SHORT[p.second_style] + ": " + STYLE_TIPS[p.second_style];
  else if (p.second_style) text += "\n\n★ В Premium — совет, как добавить дополнительный стиль.";
  alert(text);
}

function randomOutfitAction() {
  const p = State.profile;
  const slots = {};
  const pick = cat => {
    const pool = rankedItems(p, cat).filter(it => rankItem(p, it.styles) > 0);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
  const top = pick("top"), bottom = pick("bottom"), dress = pick("dress");
  if (Math.random() > 0.3 && (top || bottom)) {
    if (top) setSlot(slots, "top", top.key);
    if (bottom) setSlot(slots, "bottom", bottom.key);
  } else if (dress) setSlot(slots, "dress", dress.key);
  else if (top) setSlot(slots, "top", top.key);
  else if (bottom) setSlot(slots, "bottom", bottom.key);
  for (const cat of ["outerwear", "shoes", "accessory"]) {
    const it = pick(cat);
    if (it) slots[cat] = it.key;
  }
  State.draft = { name: `Случайный образ ${Math.floor(Math.random() * 90 + 10)}`, slots };
  State.draftIndex = null;
  navigate("builder");
}

ROUTES.wardrobe = () => {
  const items = State.wardrobe.saved.map(k => ITEMS_BY_KEY[k]).filter(Boolean);
  app.innerHTML = `
      ${topBar("Мой гардероб", `Сохранено: ${items.length}`)}
      <div class="footer-actions">
      <button class="btn btn--gold" id="new">Собрать аутфит</button>
      <button class="btn btn--ghost btn--sm" id="back">← К результату</button>
    </div>
    ${items.length ? Object.keys(CATEGORY_NAMES).map(cat => {
      const group = items.filter(i => i.category === cat);
      if (!group.length) return "";
      return section(CATEGORY_NAMES[cat]) + group.map(it => itemCard(it, "wardrobe")).join("");
    }).join("") : `<p class="muted" style="text-align:center;padding:24px">Здесь пока пусто. Нажимайте «♡ В гардероб» у вещей в подборке.</p>`}
  `;
  bindItemActions();
  document.getElementById("new").onclick = () => { State.draft = { name: "", slots: {} }; State.draftIndex = null; navigate("builder"); };
  document.getElementById("back").onclick = () => navigate("result");
};

ROUTES.builder = () => {
  const p = State.profile;
  const d = State.draft;
  app.innerHTML = `
    ${topBar("Конструктор аутфита", "Выберите вещь в каждую ячейку. Платье заменяет верх и низ.")}
    <input class="card" id="name" placeholder="Название аутфита — по желанию" value="${esc(d.name)}" style="width:100%;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:12px;font-size:14px;margin-bottom:12px;border-radius:10px">
    <div class="footer-actions">
      <button class="btn btn--gold" id="save">Сохранить аутфит</button>
      <div class="row">
        <button class="btn btn--outline" id="auto">Подобрать под стиль</button>
        <button class="btn btn--outline" id="clear">Очистить</button>
      </div>
      <button class="btn btn--ghost btn--sm" id="back">← К результату</button>
    </div>
    ${SLOT_ORDER.filter(cat => !(cat === "dress" && p.gender === "male")).map(cat => {
      const item = d.slots[cat] ? ITEMS_BY_KEY[d.slots[cat]] : null;
      return `
        <div class="card">
          <div class="mono gold" style="font-size:10px;letter-spacing:.2em">${esc(SLOT_NAMES[cat].toUpperCase())}</div>
          ${item ? `<div class="item__name" style="margin-top:6px">${esc(item.brand)} — ${esc(item.name)}</div>
                    <div class="item__price">${esc(item.price_text || "Ценовой уровень: " + PRICE_NAMES[item.price])}</div>`
                 : `<div class="muted" style="margin-top:6px">Не выбрано</div>`}
          <div class="row" style="margin-top:8px">
            <button class="btn ${item ? "btn--outline" : "btn--gold"} btn--sm" data-pick-cat="${cat}">${item ? "Сменить" : "Выбрать"}</button>
            ${item ? `<button class="btn btn--ghost btn--sm" data-clear-cat="${cat}">Убрать</button>` : ""}
          </div>
        </div>
      `;
    }).join("")}
  `;
  document.getElementById("name").oninput = e => d.name = e.target.value;
  document.getElementById("back").onclick = () => navigate("result");
  document.getElementById("clear").onclick = () => { d.slots = {}; navigate("builder"); };
  document.getElementById("auto").onclick = () => {
    const slots = {};
    const pick = cat => {
      const pool = rankedItems(p, cat).filter(it => rankItem(p, it.styles) > 0);
      const mine = pool.filter(it => State.wardrobe.saved.includes(it.key));
      return (mine.length ? mine : pool)[0];
    };
    const top = pick("top"), bottom = pick("bottom"), dress = pick("dress");
    if (top && bottom) { setSlot(slots, "top", top.key); setSlot(slots, "bottom", bottom.key); }
    else if (dress) setSlot(slots, "dress", dress.key);
    else if (top) setSlot(slots, "top", top.key);
    else if (bottom) setSlot(slots, "bottom", bottom.key);
    for (const cat of ["outerwear", "shoes", "accessory"]) { const it = pick(cat); if (it) slots[cat] = it.key; }
    d.slots = slots;
    if (!d.name.trim()) d.name = `Аутфит ${STYLE_SHORT[p.main_style] || ""}`.trim();
    navigate("builder");
  };
  document.getElementById("save").onclick = () => {
    const slots = Object.fromEntries(Object.entries(d.slots).filter(([, k]) => ITEMS_BY_KEY[k]));
    if (!Object.keys(slots).length) return alert("Аутфит пока пуст.");
    const isNew = !(State.draftIndex !== null && State.wardrobe.outfits[State.draftIndex]);
    const name = d.name.trim() || `Аутфит ${State.wardrobe.outfits.length + 1}`;
    const outfit = { name, slots };
    if (State.draftIndex !== null && State.wardrobe.outfits[State.draftIndex]) State.wardrobe.outfits[State.draftIndex] = outfit;
    else State.wardrobe.outfits.push(outfit);
    State.saveWardrobe();
    State.draft = { name: "", slots: {} };
    State.draftIndex = null;
    navigate("outfits");
  };
  document.querySelectorAll("[data-pick-cat]").forEach(b => b.onclick = () => navigate("picker", b.dataset.pickCat));
  document.querySelectorAll("[data-clear-cat]").forEach(b => b.onclick = () => { delete d.slots[b.dataset.clearCat]; navigate("builder"); });
};

ROUTES.picker = (cat) => {
  const p = State.profile;
  const mine = State.wardrobe.saved.map(k => ITEMS_BY_KEY[k]).filter(it => it && it.category === cat);
  const mineKeys = new Set(mine.map(i => i.key));
  const rest = rankedItems(p, cat, false).filter(it => !mineKeys.has(it.key));
  app.innerHTML = `
    ${topBar("Выбор: " + SLOT_NAMES[cat].toLowerCase())}
    <div class="footer-actions"><button class="btn btn--ghost btn--sm" id="back">← К аутфиту</button></div>
    ${mine.length ? section("Из вашего гардероба") + mine.map(it => itemCard(it, "pick", (item) => {
      setSlot(State.draft.slots, cat, item.key); navigate("builder");
    })).join("") : ""}
    ${rest.length ? section("Из каталога · сначала подходящие вашему стилю") + rest.map(it => itemCard(it, "pick", (item) => {
      setSlot(State.draft.slots, cat, item.key); navigate("builder");
    })).join("") : ""}
  `;
  bindItemActions();
  document.getElementById("back").onclick = () => navigate("builder");
};

ROUTES.outfits = () => {
  const outfits = State.wardrobe.outfits;
  app.innerHTML = `
    ${topBar("Мои аутфиты", `Сохранено: ${outfits.length}`)}
    <div class="footer-actions">
      <button class="btn btn--gold" id="new">Собрать новый аутфит</button>
      <button class="btn btn--ghost btn--sm" id="back">← К результату</button>
    </div>
    ${outfits.length ? outfits.map((o, idx) => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div class="item__name">${esc(o.name)}</div>
          <div class="mono muted" style="font-size:11px">${totalText(o.slots)}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;font-size:24px">
          ${Object.values(o.slots).map(k => ITEMS_BY_KEY[k]).filter(Boolean).map(it => `<span title="${esc(it.brand)} — ${esc(it.name)}">${ICON[it.kind] || "🧥"}</span>`).join("")}
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn--primary btn--sm" data-open-outfit="${idx}">Открыть</button>
          <button class="btn btn--outline btn--sm" data-copy-outfit="${idx}">Копировать</button>
          <button class="btn btn--ghost btn--sm" data-del-outfit="${idx}">Удалить</button>
        </div>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;padding:24px">Здесь пока пусто. Соберите аутфит в конструкторе.</p>`}
  `;
  document.getElementById("new").onclick = () => { State.draft = { name: "", slots: {} }; State.draftIndex = null; navigate("builder"); };
  document.getElementById("back").onclick = () => navigate("result");
  document.querySelectorAll("[data-open-outfit]").forEach(b => b.onclick = () => {
    const o = State.wardrobe.outfits[+b.dataset.openOutfit];
    State.draft = { name: o.name, slots: { ...o.slots } };
    State.draftIndex = +b.dataset.openOutfit;
    navigate("builder");
  });
  document.querySelectorAll("[data-copy-outfit]").forEach(b => b.onclick = () => {
    const o = State.wardrobe.outfits[+b.dataset.copyOutfit];
    const lines = [`✨ Мой образ «${o.name}» в StyleFinder:`];
    for (const cat of SLOT_ORDER) {
      const it = ITEMS_BY_KEY[o.slots[cat]];
      if (it) lines.push(`• ${SLOT_NAMES[cat]}: ${it.brand} — ${it.name}`);
    }
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("Образ скопирован в буфер обмена!");
  });
  document.querySelectorAll("[data-del-outfit]").forEach(b => b.onclick = () => {
    const idx = +b.dataset.delOutfit;
    if (confirm(`Удалить аутфит «${State.wardrobe.outfits[idx].name}»?`)) {
      State.wardrobe.outfits.splice(idx, 1);
      State.saveWardrobe();
      navigate("outfits");
    }
  });
};

ROUTES.premium = () => {
  if (State.subscription.premium) {
    app.innerHTML = `
      ${topBar("Premium", `Подписка активна${State.subscription.since ? " с " + State.subscription.since : ""} · ${PRICE_RUB} ₽ в месяц (демо-режим)`)}
      <div class="footer-actions">
        <button class="btn btn--outline" id="cancel">Отменить подписку</button>
        <button class="btn btn--ghost btn--sm" id="back">← К результату</button>
      </div>
      ${section("Ваши возможности")}
      <div class="card">${PREMIUM_FEATURES.map(([t, d, r]) => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div style="font-weight:bold;color:var(--ink)">${r ? "✓" : "○"} ${esc(t)} ${r ? "" : '<span class="mono muted2" style="font-size:9px">СКОРО</span>'}</div>
          <div class="muted" style="font-size:13px;margin-top:2px">${esc(d)}</div>
        </div>
      `).join("")}</div>
    `;
    document.getElementById("back").onclick = () => navigate("result");
    document.getElementById("cancel").onclick = () => {
      if (confirm("Отменить подписку? Вещи и аутфиты сохранятся.")) {
        State.subscription = { premium: false, since: "" };
        State.saveSub();
        navigate("result");
      }
    };
    return;
  }
  app.innerHTML = `
    ${topBar("Откройте весь StyleFinder")}
    <div class="hero">
      <div class="hero__label">P R E M I U M</div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <div style="font-family:var(--serif);font-size:48px;font-weight:bold">${PRICE_RUB} ₽</div>
        <div class="mono" style="color:var(--hero-muted)">/ месяц</div>
      </div>
      <div class="hero__desc">Отменить можно в любой момент.</div>
    </div>
    <div class="footer-actions">
      <button class="btn btn--gold" id="buy">Оформить Premium за ${PRICE_RUB} ₽ в месяц</button>
      <button class="btn btn--ghost btn--sm" id="skip">Продолжить бесплатно</button>
    </div>
    ${section("Что входит в Premium")}
    <div class="card">${PREMIUM_FEATURES.map(([t, d, r]) => `
      <div style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div style="font-weight:bold;color:var(--ink)">${r ? "✓" : "○"} ${esc(t)} ${r ? "" : '<span class="mono muted2" style="font-size:9px">СКОРО</span>'}</div>
        <div class="muted" style="font-size:13px;margin-top:2px">${esc(d)}</div>
      </div>
    `).join("")}</div>
  `;
  document.getElementById("skip").onclick = () => navigate("result");
  document.getElementById("buy").onclick = () => {
    if (confirm(`Оформить Premium за ${PRICE_RUB} ₽ в месяц?\n\nДемо-режим: оплата не подключена.`)) {
      State.subscription = { premium: true, since: new Date().toISOString().slice(0, 10) };
      State.saveSub();
      alert("Premium включён! (Демо-режим)");
      navigate("result");
    }
  };
};

ROUTES.settings = () => {
  app.innerHTML = `
    ${topBar("Настройки", "Тема применяется сразу и сохраняется.")}
    <div class="footer-actions"><button class="btn btn--ghost btn--sm" id="back">← Назад</button></div>

    ${section("ТЕМА ОФОРМЛЕНИЯ")}
    <div class="segmented" id="theme">
      <button data-v="light" class="${State.settings.theme === "light" ? "is-on" : ""}">☀ Светлая</button>
      <button data-v="dark"  class="${State.settings.theme === "dark"  ? "is-on" : ""}">☾ Тёмная</button>
    </div>

    ${section("РАЗМЕР ШРИФТА")}
    <div class="segmented" id="scale">
      <button data-v="0.85" class="${State.settings.font_scale === 0.85 ? "is-on" : ""}">Мелкий</button>
      <button data-v="1.0"  class="${State.settings.font_scale === 1.0  ? "is-on" : ""}">Обычный</button>
      <button data-v="1.15" class="${State.settings.font_scale === 1.15 ? "is-on" : ""}">Крупный</button>
    </div>

    ${section("УПРАВЛЕНИЕ ДАННЫМИ")}
    <p class="muted" style="font-size:13px;margin-bottom:10px">Очистка удалит сохранённые данные. Это действие нельзя отменить.</p>
    <div class="danger-box">
      <div class="row">
        <button class="btn btn--danger" id="reset-profile">Сбросить профиль</button>
        <button class="btn btn--danger" id="reset-wardrobe">Очистить гардероб</button>
      </div>
      <button class="btn btn--danger" id="reset-all" style="width:100%">Удалить ВСЕ данные</button>
    </div>

    ${section("О ПРИЛОЖЕНИИ")}
    <p class="muted" style="font-size:13px">StyleFinder v8.0 — веб-версия.<br>Персональный подбор стиля, гардероб и конструктор аутфитов.</p>
  `;
  document.getElementById("back").onclick = () => State.profile?.main_style ? navigate("result") : navigate("onboarding");
  document.querySelectorAll("#theme button").forEach(b => b.onclick = () => {
    State.settings.theme = b.dataset.v;
    State.saveSettings();
    applyTheme();
    navigate("settings");
  });
  document.querySelectorAll("#scale button").forEach(b => b.onclick = () => {
    State.settings.font_scale = parseFloat(b.dataset.v);
    State.saveSettings();
    applyTheme();
    navigate("settings");
  });
  document.getElementById("reset-profile").onclick = () => {
    if (confirm("Удалить результаты теста?")) { State.resetProfile(); State.answers = []; navigate("onboarding"); }
  };
  document.getElementById("reset-wardrobe").onclick = () => {
    if (confirm("Удалить все сохранённые вещи и аутфиты?")) { State.resetWardrobe(); navigate("settings"); }
  };
  document.getElementById("reset-all").onclick = () => {
    if (confirm("Удалить ВСЕ данные: профиль, гардероб, подписку?")) { State.resetAll(); State.answers = []; navigate("onboarding"); }
  };
};

applyTheme();
if (State.subscription.premium) navigate(State.profile?.main_style ? "result" : "onboarding");
else if (State.profile?.main_style) navigate("result");
else navigate("onboarding");

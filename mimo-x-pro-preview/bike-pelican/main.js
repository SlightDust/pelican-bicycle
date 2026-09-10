/* 鹈鹕骑行 — 交互控制 */

(function () {
  const app = document.getElementById("app");
  const speedRange = document.getElementById("speedRange");
  const speedValue = document.getElementById("speedValue");
  const distanceEl = document.getElementById("distance");
  const moodEl = document.getElementById("mood");
  const fishCountEl = document.getElementById("fishCount");
  const themeBtn = document.getElementById("themeBtn");
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");
  const bellBtn = document.getElementById("bellBtn");
  const bellRings = document.getElementById("bellRings");
  const riderWrap = document.getElementById("riderWrap");
  const notes = document.getElementById("notes");

  const THEMES = ["day", "sunset", "night"];
  const THEME_META = {
    day: { icon: "🌙", label: "黄昏" },
    sunset: { icon: "🌃", label: "夜晚" },
    night: { icon: "☀️", label: "白昼" },
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let themeIndex = 0;
  let distanceKm = 0;
  let lastTs = performance.now();
  let fishCount = 1;
  let bellTimer = null;

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function moodFor(speed) {
    if (speed === 0) return "停在路边";
    if (speed < 4) return "慢悠悠散步";
    if (speed < 9) return "悠哉巡航";
    if (speed < 14) return "迎风加速";
    if (speed < 18) return "喉囊鼓满风";
    return "全速冲刺！";
  }

  function applySpeed(speed) {
    const s = Number(speed);
    speedValue.textContent = s.toFixed(s % 1 === 0 ? 0 : 1);
    speedRange.setAttribute("aria-valuenow", String(s));
    speedRange.setAttribute("aria-valuetext", `每小时 ${s} 公里`);
    moodEl.textContent = moodFor(s);

    app.classList.toggle("is-idle", s === 0);

    // 速度越高，动画越快（时长越短）
    // 0 → 暂停；0.5 → 很慢；20 → 很快
    const norm = clamp(s, 0, 20);
    const ride = norm <= 0 ? 0 : 2.4 - (norm / 20) * 1.85; // 2.4s → 0.55s
    const wheel = norm <= 0 ? 0 : 1.8 - (norm / 20) * 1.45;
    const road = norm <= 0 ? 0 : 2.8 - (norm / 20) * 2.35;

    if (norm <= 0 || reduceMotion) {
      app.style.setProperty("--ride-duration", "1.2s");
      app.style.setProperty("--wheel-duration", "0.9s");
      app.style.setProperty("--road-duration", "1.6s");
    } else {
      app.style.setProperty("--ride-duration", `${ride}s`);
      app.style.setProperty("--wheel-duration", `${wheel}s`);
      app.style.setProperty("--road-duration", `${road}s`);
    }
  }

  function setTheme(theme) {
    app.dataset.theme = theme;
    const meta = THEME_META[theme];
    themeIcon.textContent = meta.icon;
    themeLabel.textContent = meta.label;
  }

  function cycleTheme() {
    themeIndex = (themeIndex + 1) % THEMES.length;
    setTheme(THEMES[themeIndex]);
  }

  function ringBell() {
    bellRings.classList.remove("ringing");
    riderWrap.classList.remove("ringing");
    // reflow to restart animation
    void bellRings.offsetWidth;
    bellRings.classList.add("ringing");
    riderWrap.classList.add("ringing");

    spawnNotes();

    if (bellTimer) clearTimeout(bellTimer);
    bellTimer = setTimeout(() => {
      bellRings.classList.remove("ringing");
      riderWrap.classList.remove("ringing");
    }, 700);

    // 偶尔喉囊/筐里多一条鱼（最多 3）
    if (fishCount < 3 && Math.random() < 0.45) {
      fishCount += 1;
      fishCountEl.textContent = `${fishCount} 条鱼`;
    }
  }

  function spawnNotes() {
    if (reduceMotion) return;
    const glyphs = ["♪", "♫", "♬", "♪"];
    for (let i = 0; i < 3; i += 1) {
      const note = document.createElement("span");
      note.className = "note";
      note.textContent = glyphs[i % glyphs.length];
      note.style.setProperty("--nx", `${18 + Math.random() * 40}px`);
      note.style.setProperty("--ny", `${-40 - Math.random() * 50}px`);
      note.style.animationDelay = `${i * 0.12}s`;
      notes.appendChild(note);
      setTimeout(() => note.remove(), 1400);
    }
  }

  function tick(ts) {
    const dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;
    const speed = Number(speedRange.value);
    // km/h → km/s
    distanceKm += (speed / 3600) * dt;
    distanceEl.textContent = distanceKm.toFixed(2);
    requestAnimationFrame(tick);
  }

  speedRange.addEventListener("input", (e) => {
    applySpeed(e.target.value);
  });

  themeBtn.addEventListener("click", cycleTheme);
  bellBtn.addEventListener("click", ringBell);

  // 键盘快捷键：空格按铃，方向键调速
  document.addEventListener("keydown", (e) => {
    if (e.target === speedRange) return;
    if (e.code === "Space") {
      e.preventDefault();
      ringBell();
    } else if (e.code === "ArrowUp" || e.code === "ArrowRight") {
      const next = clamp(Number(speedRange.value) + 0.5, 0, 20);
      speedRange.value = String(next);
      applySpeed(next);
    } else if (e.code === "ArrowDown" || e.code === "ArrowLeft") {
      const next = clamp(Number(speedRange.value) - 0.5, 0, 20);
      speedRange.value = String(next);
      applySpeed(next);
    }
  });

  // 初始：尊重 HTML 上已有的主题，没有才用白昼
  const initialTheme = app.dataset.theme || "day";
  themeIndex = Math.max(0, THEMES.indexOf(initialTheme));
  applySpeed(speedRange.value);
  setTheme(THEMES[themeIndex]);
  requestAnimationFrame(tick);
})();

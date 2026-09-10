(() => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");

  const btnSpeed = document.getElementById("btn-speed");
  const btnPause = document.getElementById("btn-pause");
  const btnTheme = document.getElementById("btn-theme");

  const THEMES = {
    day: {
      name: "白天",
      skyTop: "#5eb8e8",
      skyBot: "#c8ecf7",
      sun: "#ffd76a",
      sunGlow: "rgba(255, 215, 106, 0.35)",
      cloud: "rgba(255,255,255,0.92)",
      cloudShade: "rgba(200,220,235,0.55)",
      hillFar: "#8ecf9a",
      hillNear: "#5fb56e",
      ground: "#d9b56a",
      groundDark: "#c49a4e",
      grass: "#6fbf4a",
      trunk: "#8b5a2b",
      leaf: "#3f9e4d",
      dust: "rgba(214, 180, 110, 0.55)",
      ink: "#1f2a37",
    },
    dusk: {
      name: "黄昏",
      skyTop: "#2a3d6b",
      skyBot: "#f4a261",
      sun: "#ff8c42",
      sunGlow: "rgba(255, 140, 66, 0.4)",
      cloud: "rgba(255, 210, 180, 0.75)",
      cloudShade: "rgba(180, 120, 140, 0.45)",
      hillFar: "#4a6b7a",
      hillNear: "#2f5a48",
      ground: "#6b5340",
      groundDark: "#554030",
      grass: "#5a8f45",
      trunk: "#5a3a22",
      leaf: "#2f6b3c",
      dust: "rgba(140, 110, 80, 0.55)",
      ink: "#f5f0e8",
    },
    night: {
      name: "夜晚",
      skyTop: "#0b1630",
      skyBot: "#1c3358",
      sun: "#f0f4ff",
      sunGlow: "rgba(220, 230, 255, 0.25)",
      cloud: "rgba(120, 140, 180, 0.35)",
      cloudShade: "rgba(40, 55, 90, 0.45)",
      hillFar: "#1a2a40",
      hillNear: "#122030",
      ground: "#2a3348",
      groundDark: "#1f2838",
      grass: "#2d5a3a",
      trunk: "#1a1520",
      leaf: "#1e3d2a",
      dust: "rgba(80, 90, 120, 0.45)",
      ink: "#e8eef8",
    },
  };

  const themeOrder = ["day", "dusk", "night"];
  let themeIndex = 0;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    t: 0,
    worldX: 0,
    speed: 1,
    paused: false,
    groundY: 0,
    moveLeft: false,
    moveRight: false,
    clouds: [],
    trees: [],
    dust: [],
    stars: [],
  };

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = state.w + "px";
    canvas.style.height = state.h + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.groundY = state.h * 0.78;
    seedWorld();
  }

  function seedWorld() {
    state.clouds = Array.from({ length: 7 }, (_, i) => ({
      x: (i / 7) * state.w * 2 + rand(0, 200),
      y: rand(40, state.h * 0.35),
      s: rand(0.6, 1.4),
      v: rand(0.15, 0.4),
    }));

    state.trees = Array.from({ length: 10 }, (_, i) => ({
      x: (i / 10) * state.w * 2.5 + rand(0, 180),
      s: rand(0.7, 1.35),
      type: Math.random() > 0.45 ? "round" : "pine",
    }));

    state.stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.45,
      r: rand(0.6, 1.8),
      tw: rand(0.5, 1.5),
    }));

    state.dust = [];
  }

  function theme() {
    return THEMES[themeOrder[themeIndex]];
  }

  function spawnDust(x, y, power = 1) {
    state.dust.push({
      x,
      y,
      vx: rand(-1.6, -0.3) - power * 0.4,
      vy: rand(-2.2, -0.6),
      r: rand(3, 8) * power,
      life: 1,
      decay: rand(0.02, 0.045),
    });
  }

  function updateDust(dt) {
    for (let i = state.dust.length - 1; i >= 0; i--) {
      const p = state.dust[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.08 * dt * 60;
      p.r += 0.15 * dt * 60;
      p.life -= p.decay * dt * 60;
      if (p.life <= 0) state.dust.splice(i, 1);
    }
  }

  function drawSky(c) {
    const g = ctx.createLinearGradient(0, 0, 0, state.h);
    g.addColorStop(0, c.skyTop);
    g.addColorStop(1, c.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);
  }

  function drawStars(c) {
    if (themeOrder[themeIndex] !== "night") return;
    for (const s of state.stars) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(state.t * s.tw));
      ctx.globalAlpha = tw * 0.9;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x * state.w, s.y * state.h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(c) {
    const isNight = themeOrder[themeIndex] === "night";
    const isDusk = themeOrder[themeIndex] === "dusk";
    const cx = isNight ? state.w * 0.78 : isDusk ? state.w * 0.72 : state.w * 0.82;
    const cy = isNight ? state.h * 0.16 : isDusk ? state.h * 0.28 : state.h * 0.18;
    const r = Math.min(state.w, state.h) * (isNight ? 0.055 : 0.07);

    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3.2);
    glow.addColorStop(0, c.sunGlow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.sun;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    if (isNight) {
      ctx.fillStyle = c.skyTop;
      ctx.beginPath();
      ctx.arc(cx + r * 0.35, cy - r * 0.25, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawCloud(x, y, s, c) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = c.cloud;
    ctx.beginPath();
    ctx.ellipse(0, 8, 48, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(-28, 0, 28, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -6, 34, 28, 0, 0, Math.PI * 2);
    ctx.ellipse(34, 4, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.cloudShade;
    ctx.beginPath();
    ctx.ellipse(6, 14, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawClouds(c, dt) {
    for (const cl of state.clouds) {
      cl.x -= (cl.v + state.speed * 0.15) * dt * 60;
      if (cl.x < -180) {
        cl.x = state.w + rand(80, 240);
        cl.y = rand(40, state.h * 0.35);
        cl.s = rand(0.6, 1.4);
      }
      drawCloud(cl.x, cl.y, cl.s, c);
    }
  }

  function hillPath(baseY, amp, freq, phase) {
    ctx.beginPath();
    ctx.moveTo(0, state.h);
    for (let x = 0; x <= state.w + 4; x += 8) {
      const y = baseY
        + Math.sin((x + phase) * freq) * amp
        + Math.sin((x + phase) * freq * 0.45) * amp * 0.45;
      if (x === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(state.w, state.h);
    ctx.closePath();
  }

  function drawHills(c) {
    const gy = state.groundY;
    ctx.fillStyle = c.hillFar;
    hillPath(gy - 70, 28, 0.008, state.worldX * 0.25);
    ctx.fill();
    ctx.fillStyle = c.hillNear;
    hillPath(gy - 28, 18, 0.012, state.worldX * 0.5 + 100);
    ctx.fill();
  }

  function drawTree(x, baseY, s, type, c) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(s, s);

    ctx.fillStyle = c.trunk;
    ctx.fillRect(-5, -48, 10, 52);

    if (type === "round") {
      ctx.fillStyle = c.leaf;
      ctx.beginPath();
      ctx.ellipse(0, -70, 34, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(-18, -55, 22, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(18, -55, 22, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-8, -78, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = c.leaf;
      ctx.beginPath();
      ctx.moveTo(0, -120);
      ctx.lineTo(30, -60);
      ctx.lineTo(10, -60);
      ctx.lineTo(36, -20);
      ctx.lineTo(-36, -20);
      ctx.lineTo(-10, -60);
      ctx.lineTo(-30, -60);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrees(c) {
    const span = state.w * 2.5;
    for (const tr of state.trees) {
      let x = ((tr.x - state.worldX * 0.55) % span + span) % span;
      if (x > -80 && x < state.w + 80) {
        drawTree(x, state.groundY - 8, tr.s, tr.type, c);
      }
    }
  }

  function drawGround(c) {
    const gy = state.groundY;
    ctx.fillStyle = c.ground;
    ctx.fillRect(0, gy, state.w, state.h - gy);

    ctx.fillStyle = c.groundDark;
    ctx.fillRect(0, gy, state.w, 10);

    // road stripes / path marks
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#fff";
    const stripeW = 70;
    const gap = 50;
    const period = stripeW + gap;
    const offset = -((state.worldX * 1.1) % period);
    for (let x = offset; x < state.w + period; x += period) {
      ctx.fillRect(x, gy + 28, stripeW, 8);
    }
    ctx.globalAlpha = 1;

    // grass tufts
    const tuftPeriod = 48;
    const tOff = -((state.worldX * 0.9) % tuftPeriod);
    ctx.strokeStyle = c.grass;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let x = tOff; x < state.w + tuftPeriod; x += tuftPeriod) {
      const h = 8 + ((x * 17) % 7);
      ctx.beginPath();
      ctx.moveTo(x, gy + 6);
      ctx.quadraticCurveTo(x + 2, gy + 6 - h * 0.6, x + 6, gy + 6 - h);
      ctx.moveTo(x + 4, gy + 6);
      ctx.quadraticCurveTo(x + 3, gy + 6 - h * 0.5, x - 2, gy + 6 - h * 0.8);
      ctx.stroke();
    }
  }

  function drawDust(c) {
    for (const p of state.dust) {
      ctx.globalAlpha = Math.max(0, p.life) * 0.8;
      ctx.fillStyle = c.dust;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- Pelican + Bicycle ----

  function drawBike(x, y, scale, lean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(scale, scale);

    const wheel = (cx, cy) => {
      ctx.strokeStyle = "#2b2b2b";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + state.t * 8 * state.speed;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
        ctx.stroke();
      }

      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    };

    // frame
    ctx.strokeStyle = "#e85d4c";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // rear triangle
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-6, -18);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.stroke();

    // seat tube + top tube + down tube
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-2, -28);
    ctx.lineTo(24, -24);
    ctx.moveTo(-2, -28);
    ctx.lineTo(8, -2);
    ctx.moveTo(8, -2);
    ctx.lineTo(24, -24);
    ctx.stroke();

    // fork / head tube
    ctx.beginPath();
    ctx.moveTo(24, -24);
    ctx.lineTo(28, 0);
    ctx.stroke();

    // handlebar
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(24, -24);
    ctx.quadraticCurveTo(30, -30, 34, -26);
    ctx.stroke();

    // seat
    ctx.fillStyle = "#2b2b2b";
    ctx.beginPath();
    ctx.ellipse(-2, -30, 8, 3.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // pedals / crank
    const crank = state.t * 10 * state.speed;
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-6 + Math.cos(crank) * 8, Math.sin(crank) * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-6 - Math.cos(crank) * 8, -Math.sin(crank) * 8);
    ctx.stroke();

    wheel(-28, 0);
    wheel(28, 0);

    // tiny basket / bag on bars
    ctx.fillStyle = "#f0c27a";
    ctx.fillRect(30, -34, 10, 8);
    ctx.strokeStyle = "#c9954a";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(30, -34, 10, 8);

    ctx.restore();
  }

  function drawPelican(bx, by, scale) {
    // body bob + run cycle
    const run = state.t * 12 * state.speed;
    const bob = Math.sin(run) * 3.5;
    const lean = 0.12 + Math.sin(run * 0.5) * 0.02;

    const x = bx;
    const y = by + bob;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(scale, scale);

    // shadow
    ctx.save();
    ctx.rotate(-lean);
    ctx.scale(1, 0.35);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(-2, 72, 42, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // far leg
    const legPhase = run;
    const drawLeg = (phase, back) => {
      const hipX = back ? -8 : 6;
      const hipY = 34;
      const swing = Math.sin(phase) * 22;
      const lift = Math.max(0, Math.cos(phase)) * (back ? 10 : 16);

      const kneeX = hipX + swing * 0.45;
      const kneeY = hipY + 22 - lift * 0.3;
      const footX = hipX + swing;
      const footY = hipY + 42 - lift;

      ctx.strokeStyle = back ? "#e8955a" : "#ff9f4a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // webbed foot
      ctx.fillStyle = back ? "#e07a3a" : "#ff8c2e";
      ctx.beginPath();
      ctx.moveTo(footX, footY);
      ctx.lineTo(footX + 12, footY + 1);
      ctx.lineTo(footX + 8, footY + 6);
      ctx.lineTo(footX - 2, footY + 4);
      ctx.closePath();
      ctx.fill();

      return { footX, footY };
    };

    const farFoot = drawLeg(legPhase + Math.PI, true);

    // body
    ctx.fillStyle = "#f7f3ea";
    ctx.strokeStyle = "#e0d8c8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-4, 18, 38, 28, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // belly shade
    ctx.fillStyle = "#ebe4d6";
    ctx.beginPath();
    ctx.ellipse(-8, 28, 26, 14, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // wing
    const flap = Math.sin(run * 0.85) * 0.35;
    ctx.save();
    ctx.translate(-10, 12);
    ctx.rotate(-0.25 + flap);
    ctx.fillStyle = "#efe8db";
    ctx.strokeStyle = "#d8d0c0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-30, 4, -42, 22);
    ctx.quadraticCurveTo(-20, 28, -4, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // wing feather lines
    ctx.strokeStyle = "rgba(180,170,155,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.quadraticCurveTo(-24, 14, -34, 20);
    ctx.moveTo(-4, 14);
    ctx.quadraticCurveTo(-18, 18, -28, 22);
    ctx.stroke();
    ctx.restore();

    // neck
    ctx.fillStyle = "#f7f3ea";
    ctx.strokeStyle = "#e0d8c8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 6);
    ctx.quadraticCurveTo(34, -8, 36, -28);
    ctx.lineTo(50, -28);
    ctx.quadraticCurveTo(50, -4, 34, 16);
    ctx.quadraticCurveTo(28, 22, 18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // head
    ctx.fillStyle = "#f7f3ea";
    ctx.beginPath();
    ctx.ellipse(44, -34, 16, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e0d8c8";
    ctx.stroke();

    // cheek blush
    ctx.fillStyle = "rgba(255, 160, 120, 0.28)";
    ctx.beginPath();
    ctx.ellipse(40, -28, 5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(48, -38, 4.2, 4.6, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2a37";
    ctx.beginPath();
    ctx.arc(49.2, -37.5, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(50, -38.5, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // pouch / beak
    ctx.fillStyle = "#ff9f4a";
    ctx.strokeStyle = "#e07a3a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(50, -40);
    ctx.quadraticCurveTo(86, -38, 96, -28);
    ctx.quadraticCurveTo(88, -18, 62, -20);
    ctx.quadraticCurveTo(52, -22, 50, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // hanging pouch
    ctx.fillStyle = "#ffb066";
    ctx.beginPath();
    ctx.moveTo(58, -24);
    ctx.quadraticCurveTo(78, -18, 86, -28);
    ctx.quadraticCurveTo(80, -6, 62, -8);
    ctx.quadraticCurveTo(56, -16, 58, -24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e07a3a";
    ctx.stroke();

    // beak line
    ctx.strokeStyle = "#e07a3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(52, -30);
    ctx.quadraticCurveTo(70, -28, 90, -28);
    ctx.stroke();

    // crest feathers
    ctx.strokeStyle = "#efe8db";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(38, -44);
    ctx.quadraticCurveTo(36, -54, 30, -58);
    ctx.moveTo(42, -46);
    ctx.quadraticCurveTo(42, -56, 38, -62);
    ctx.stroke();

    // near leg
    drawLeg(legPhase, false);

    // bicycle on back
    ctx.save();
    ctx.translate(-8, -18);
    ctx.rotate(-0.55 + Math.sin(run * 0.5) * 0.03);
    drawBike(0, 0, 0.95, 0);
    ctx.restore();

    // strap / carry band over body
    ctx.strokeStyle = "#c45c26";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(18, -8);
    ctx.quadraticCurveTo(-6, 8, -18, 28);
    ctx.stroke();

    ctx.restore();

    return { footX: x + farFoot.footX * scale, footY: y + farFoot.footY * scale, bob };
  }

  function drawSpeedLines() {
    const n = 6 + Math.floor(state.speed * 3);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const y = state.h * 0.35 + ((i * 97 + state.t * 200 * state.speed) % (state.h * 0.4));
      const len = 40 + (i % 3) * 30;
      const x = state.w - ((state.t * 280 * state.speed + i * 130) % (state.w + 200));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len, y);
      ctx.stroke();
    }
  }

  function frame(now) {
    if (!frame.last) frame.last = now;
    let dt = Math.min(0.05, (now - frame.last) / 1000);
    frame.last = now;

    if (!state.paused) {
      const walk = 180 * state.speed;
      if (state.moveLeft) state.worldX -= walk * dt * 0.6;
      if (state.moveRight) state.worldX += walk * dt * 0.6;
      state.worldX += walk * dt;
      state.t += dt;

      // dust from feet
      if (Math.sin(state.t * 12 * state.speed) < -0.85) {
        const bx = state.w * 0.42;
        const by = state.groundY - 92;
        spawnDust(bx + rand(-10, 10), by + 90, state.speed);
      }
      updateDust(dt);
    }

    const c = theme();
    drawSky(c);
    drawStars(c);
    drawSun(c);
    drawClouds(c, state.paused ? 0 : dt);
    drawHills(c);
    drawTrees(c);
    drawGround(c);
    drawSpeedLines();

    const scale = Math.min(1.25, Math.max(0.75, state.w / 900));
    const bx = state.w * 0.42;
    const by = state.groundY - 92;
    drawPelican(bx, by, scale);
    drawDust(c);

    requestAnimationFrame(frame);
  }

  // controls
  const speeds = [0.5, 1, 1.5, 2];
  let speedIdx = 1;

  function syncButtons() {
    btnSpeed.textContent = `速度 ×${state.speed}`;
    btnPause.textContent = state.paused ? "继续" : "暂停";
    btnTheme.textContent = theme().name === "白天" ? "黄昏" : theme().name === "黄昏" ? "夜晚" : "白天";
  }

  btnSpeed.addEventListener("click", () => {
    speedIdx = (speedIdx + 1) % speeds.length;
    state.speed = speeds[speedIdx];
    syncButtons();
  });

  btnPause.addEventListener("click", () => {
    state.paused = !state.paused;
    syncButtons();
  });

  btnTheme.addEventListener("click", () => {
    themeIndex = (themeIndex + 1) % themeOrder.length;
    syncButtons();
    document.body.style.background = theme().skyTop;
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      state.paused = !state.paused;
      syncButtons();
    } else if (e.code === "ArrowUp") {
      e.preventDefault();
      speedIdx = Math.min(speeds.length - 1, speedIdx + 1);
      state.speed = speeds[speedIdx];
      syncButtons();
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      speedIdx = Math.max(0, speedIdx - 1);
      state.speed = speeds[speedIdx];
      syncButtons();
    } else if (e.code === "ArrowLeft") {
      state.moveLeft = true;
    } else if (e.code === "ArrowRight") {
      state.moveRight = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") state.moveLeft = false;
    if (e.code === "ArrowRight") state.moveRight = false;
  });

  window.addEventListener("resize", resize);

  resize();
  syncButtons();
  requestAnimationFrame(frame);
})();

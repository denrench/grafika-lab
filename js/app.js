/* ==========================================================================
   ГРАФИКА LAB — MAIN APPLICATION CONTROLLER (js/app.js)
   Orchestrates:
   1. Animated 3D CAD Startup Bootloader
   2. Hero 3D Assembly Viewport with Live Telemetry, Solid/Wireframe/X-Ray/Explode/Dims
   3. Dashboard, Interactive SVG Skill Tree, Daily Quest, Achievements
   4. Projection Lab (6 GOST 3D parts + Live Front/Top/Left/Monge Ortho Drawings + Laser Scan)
   5. Isometric 3D Builder (6 Primitives, Grid Snapping, 3D Picking, Undo/Redo, Live Ortho, Save)
   6. Interactive Step-by-Step Training Lessons (Fillet, Monge Epure, Isometric Oval)
   7. Spatial Reasoning Challenges & Competency Radar
   ========================================================================== */

(function () {
  'use strict';

  const Models = window.GrafikaModels;
  const Engine = window.GrafikaEngine3D;

  // ==========================================================================
  // APPLICATION STATE & PERSISTENCE
  // ==========================================================================
  const defaultState = {
    xp: 1450,
    level: 4,
    lessonsDone: 7,
    tasksDone: 19,
    dailyCount: 2,
    dailyCompleted: false,
    currentView: 'home',
    selectedSkillId: 'iso-1',
    savedConstructions: [
      {
        name: 'Сборка #01: Портальная рама',
        date: 'ГОСТ-СБ-01',
        items: [
          { id: 1, type: 'cube', gx: -1, gy: 0, gz: 0, rot: 0 },
          { id: 2, type: 'cube', gx: 1, gy: 0, gz: 0, rot: 0 },
          { id: 3, type: 'cube', gx: -1, gy: 0, gz: 1, rot: 0 },
          { id: 4, type: 'cube', gx: 1, gy: 0, gz: 1, rot: 0 },
          { id: 5, type: 'block', gx: 0, gy: 0, gz: 2, rot: 0 },
          { id: 6, type: 'pyramid', gx: 0, gy: 0, gz: 3, rot: 0 }
        ]
      }
    ]
  };

  let appState = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem('grafika_lab_state_v1');
      if (raw) {
        return Object.assign({}, defaultState, JSON.parse(raw));
      }
    } catch (e) {
      // ignore storage errors
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  function saveState() {
    try {
      localStorage.setItem('grafika_lab_state_v1', JSON.stringify(appState));
    } catch (e) {
      // ignore
    }
  }

  function showToast(text) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 3400);
  }

  function addXP(amount, reason) {
    appState.xp += amount;
    appState.level = Math.floor(appState.xp / 400) + 1;
    saveState();
    updateDashboardHeaderUI();
    showToast(`+${amount} XP // ${reason}`);
  }

  function updateDashboardHeaderUI() {
    const lvlEl = document.getElementById('header-lvl');
    const xpEl = document.getElementById('header-xp');
    const statXp = document.getElementById('stat-xp');
    const statLvl = document.getElementById('stat-level');
    const statTasks = document.getElementById('stat-tasks');
    const statLessons = document.getElementById('stat-lessons');

    if (lvlEl) lvlEl.textContent = appState.level;
    if (xpEl) xpEl.textContent = appState.xp.toLocaleString('ru-RU');
    if (statXp) statXp.textContent = appState.xp.toLocaleString('ru-RU');
    if (statLvl) statLvl.textContent = `УРОВЕНЬ ${appState.level}`;
    if (statTasks) statTasks.textContent = appState.tasksDone;
    if (statLessons) statLessons.textContent = `${appState.lessonsDone} / 12`;

    // Daily quest step 3
    const step3 = document.getElementById('daily-step-3');
    const statusTxt = document.getElementById('daily-status-text');
    if (step3 && statusTxt) {
      if (appState.dailyCount >= 3) {
        step3.classList.add('done');
        statusTxt.textContent = '3 / 3 ВЫПОЛНЕНО (+150 XP)';
      } else {
        step3.classList.remove('done');
        statusTxt.textContent = `${appState.dailyCount} / 3 ВЫПОЛНЕНО`;
      }
    }
  }

  // ==========================================================================
  // 1. STARTUP 3D BOOTLOADER ANIMATION
  // ==========================================================================
  let bootAnimId = null;

  function runBootSequence(forceReplay) {
    const overlay = document.getElementById('boot-overlay');
    const canvas = document.getElementById('boot-canvas');
    const bar = document.getElementById('boot-progress-bar');
    const pctEl = document.getElementById('boot-percent');
    const stageEl = document.getElementById('boot-stage-label');
    const l1 = document.getElementById('boot-line-1');
    const l2 = document.getElementById('boot-line-2');
    const l3 = document.getElementById('boot-line-3');

    if (!overlay || !canvas) return;

    // Only show once per session unless replayed
    if (!forceReplay && sessionStorage.getItem('grafika_boot_done') === '1') {
      overlay.classList.add('hidden');
      return;
    }

    overlay.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    const startTime = performance.now();
    const duration = 2300; // fast 2.3s engineering boot

    function finishBoot() {
      if (bootAnimId) cancelAnimationFrame(bootAnimId);
      sessionStorage.setItem('grafika_boot_done', '1');
      overlay.classList.add('hidden');
    }

    const skipBtn = document.getElementById('boot-skip-btn');
    if (skipBtn) {
      skipBtn.onclick = finishBoot;
    }

    function step(now) {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const pct = Math.round(p * 100);

      if (bar) bar.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;

      if (p < 0.35) {
        if (stageEl) stageEl.textContent = 'INITIALIZING AXES X-Y-Z';
        l1.className = 'boot-line active';
        l2.className = 'boot-line';
        l3.className = 'boot-line';
      } else if (p < 0.7) {
        if (stageEl) stageEl.textContent = 'CONSTRUCTING WIREFRAME';
        l1.className = 'boot-line done';
        l2.className = 'boot-line active';
        l3.className = 'boot-line';
      } else {
        if (stageEl) stageEl.textContent = 'ISOMETRIC PROJECTION READY';
        l1.className = 'boot-line done';
        l2.className = 'boot-line done';
        l3.className = 'boot-line active';
      }

      drawBootCanvas(ctx, p);

      if (p < 1) {
        bootAnimId = requestAnimationFrame(step);
      } else {
        setTimeout(finishBoot, 220);
      }
    }

    bootAnimId = requestAnimationFrame(step);
  }

  function drawBootCanvas(ctx, p) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 10;
    ctx.clearRect(0, 0, w, h);

    const yaw = -0.78 + p * 1.45;
    const pitch = 0.52;
    const scale = 1.45;

    // Stage 1: Coordinate Axes grow out from origin (0..0.35)
    const axisP = Math.min(1, p / 0.32);
    const L = 75 * axisP;
    const origin = Engine.transformPoint([0, 0, 0], yaw, pitch, scale);
    const axes = [
      { name: 'X', pt: [L, 0, 0], color: '#FF5E7E' },
      { name: 'Y', pt: [0, L, 0], color: '#39E58C' },
      { name: 'Z', pt: [0, 0, L], color: '#42D9FF' }
    ];

    ctx.font = '700 11px "JetBrains Mono", monospace';
    for (const a of axes) {
      const end = Engine.transformPoint(a.pt, yaw, pitch, scale);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + origin.sx, cy + origin.sy);
      ctx.lineTo(cx + end.sx, cy + end.sy);
      ctx.stroke();
      if (axisP > 0.5) {
        ctx.fillStyle = a.color;
        ctx.fillText(a.name, cx + end.sx + 5, cy + end.sy + 4);
      }
    }

    // Stage 2: Wireframe cube builds edge by edge (0.2 .. 0.7)
    if (p > 0.18) {
      const cubeP = Math.min(1, (p - 0.18) / 0.45);
      const S = 38;
      const verts = [
        [-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S],
        [-S, -S, S], [S, -S, S], [S, S, S], [-S, S, S]
      ].map(v => Engine.transformPoint(v, yaw, pitch, scale));

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      ctx.strokeStyle = '#42D9FF';
      ctx.lineWidth = 1.8;
      const totalEdges = edges.length;
      const drawCount = cubeP * totalEdges;

      for (let i = 0; i < Math.min(totalEdges, Math.ceil(drawCount)); i++) {
        const segFrac = Math.min(1, drawCount - i);
        const e = edges[i];
        const pA = verts[e[0]];
        const pB = verts[e[1]];
        ctx.beginPath();
        ctx.moveTo(cx + pA.sx, cy + pA.sy);
        ctx.lineTo(cx + pA.sx + (pB.sx - pA.sx) * segFrac, cy + pA.sy + (pB.sy - pA.sy) * segFrac);
        ctx.stroke();
      }
    }

    // Stage 3: Morph into isometric stepped engineering figure (0.62 .. 1.0)
    if (p > 0.62) {
      const isoP = Math.min(1, (p - 0.62) / 0.38);
      const innerMesh = Models.PROJECTION_MODELS[0].build();
      ctx.save();
      ctx.globalAlpha = isoP;
      Engine.renderMesh3D(ctx, innerMesh, {
        clear: false,
        cx,
        cy,
        yaw,
        pitch,
        scale: 0.95 + isoP * 0.25,
        mode: 'solid',
        showGrid: false,
        showAxes: true
      });
      ctx.restore();
    }
  }

  // ==========================================================================
  // 2. NAVIGATION BETWEEN VIEWS
  // ==========================================================================
  function switchView(viewName) {
    appState.currentView = viewName;
    saveState();

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === viewName);
    });

    // Trigger immediate redraw for the activated view
    if (viewName === 'projection') {
      renderProjectionLabAll();
    } else if (viewName === 'builder') {
      renderBuilderAll();
    } else if (viewName === 'training') {
      renderTrainingCanvas();
    } else if (viewName === 'challenges') {
      renderCurrentChallenge();
    } else if (viewName === 'progress') {
      renderProgressPage();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigation() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(el.dataset.nav);
      });
    });

    document.querySelectorAll('[data-go]').forEach(el => {
      el.addEventListener('click', () => {
        switchView(el.dataset.go);
      });
    });

    // Escape key skips boot or closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const boot = document.getElementById('boot-overlay');
        if (boot && !boot.classList.contains('hidden')) {
          boot.classList.add('hidden');
        }
        const modal = document.getElementById('profile-modal');
        if (modal) modal.style.display = 'none';
      }
    });

    // Profile modal handlers
    const profBtn = document.getElementById('profile-modal-btn');
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('profile-modal-close');
    const okBtn = document.getElementById('close-modal-ok');
    const replayBtn = document.getElementById('replay-boot-btn');

    if (profBtn && modal) {
      profBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (okBtn && modal) {
      okBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    if (replayBtn && modal) {
      replayBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        runBootSequence(true);
      });
    }
  }

  // ==========================================================================
  // 3. HERO INTERACTIVE 3D VIEWPORT
  // ==========================================================================
  const heroMesh = Models.createHeroAssembly();
  const heroState = {
    yaw: -0.65,
    pitch: 0.48,
    scale: 1.85,
    autoRotate: true,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    mode: 'solid', // 'solid' | 'wireframe'
    showHiddenEdges: false,
    showDimensions: false,
    exploded: false,
    explodeAnim: 0
  };

  function initHero3D() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const vEl = document.getElementById('hero-verts');
    const eEl = document.getElementById('hero-edges');
    if (vEl) vEl.textContent = heroMesh.vertices.length;
    if (eEl) eEl.textContent = heroMesh.edges.length;

    // Mouse orbit interaction
    canvas.addEventListener('mousedown', (e) => {
      heroState.isDragging = true;
      heroState.autoRotate = false;
      heroState.lastX = e.clientX;
      heroState.lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!heroState.isDragging) return;
      const dx = e.clientX - heroState.lastX;
      const dy = e.clientY - heroState.lastY;
      heroState.lastX = e.clientX;
      heroState.lastY = e.clientY;
      heroState.yaw += dx * 0.0085;
      heroState.pitch = Math.max(-1.2, Math.min(1.35, heroState.pitch + dy * 0.0085));
      updateHeroTelemetry();
    });

    window.addEventListener('mouseup', () => {
      heroState.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      heroState.scale = Math.max(0.9, Math.min(3.1, heroState.scale * factor));
    }, { passive: false });

    // Hero HUD Mode Buttons
    const btnSolid = document.getElementById('hero-btn-solid');
    const btnWire = document.getElementById('hero-btn-wire');
    const btnXray = document.getElementById('hero-btn-xray');
    const btnExplode = document.getElementById('hero-btn-explode');
    const btnDims = document.getElementById('hero-btn-dims');
    const modeReadout = document.getElementById('hero-mode-readout');

    function syncHeroButtons() {
      btnSolid.classList.toggle('active', heroState.mode === 'solid');
      btnWire.classList.toggle('active', heroState.mode === 'wireframe');
      btnXray.classList.toggle('active', heroState.showHiddenEdges);
      btnExplode.classList.toggle('active', heroState.exploded);
      btnDims.classList.toggle('active', heroState.showDimensions);
      if (modeReadout) {
        if (heroState.mode === 'wireframe') modeReadout.textContent = 'WIREFRAME';
        else if (heroState.showHiddenEdges) modeReadout.textContent = 'X-RAY GOST';
        else modeReadout.textContent = 'ISOMETRIC';
      }
    }

    if (btnSolid) {
      btnSolid.addEventListener('click', () => {
        heroState.mode = 'solid';
        syncHeroButtons();
      });
    }
    if (btnWire) {
      btnWire.addEventListener('click', () => {
        heroState.mode = 'wireframe';
        syncHeroButtons();
      });
    }
    if (btnXray) {
      btnXray.addEventListener('click', () => {
        heroState.showHiddenEdges = !heroState.showHiddenEdges;
        syncHeroButtons();
      });
    }
    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        heroState.exploded = !heroState.exploded;
        syncHeroButtons();
      });
    }
    if (btnDims) {
      btnDims.addEventListener('click', () => {
        heroState.showDimensions = !heroState.showDimensions;
        syncHeroButtons();
      });
    }

    function animateHero() {
      if (appState.currentView === 'home') {
        if (heroState.autoRotate && !heroState.isDragging) {
          heroState.yaw += 0.0045;
          updateHeroTelemetry();
        }
        const targetExplode = heroState.exploded ? 0.65 : 0;
        heroState.explodeAnim += (targetExplode - heroState.explodeAnim) * 0.12;

        Engine.renderMesh3D(ctx, heroMesh, {
          yaw: heroState.yaw,
          pitch: heroState.pitch,
          scale: heroState.scale,
          mode: heroState.mode,
          showHiddenEdges: heroState.showHiddenEdges,
          showDimensions: heroState.showDimensions,
          explodeFactor: heroState.explodeAnim,
          gridZ: -44
        });
      }
      requestAnimationFrame(animateHero);
    }

    requestAnimationFrame(animateHero);
  }

  function updateHeroTelemetry() {
    const xEl = document.getElementById('hero-coord-x');
    const yEl = document.getElementById('hero-coord-y');
    const zEl = document.getElementById('hero-coord-z');
    if (!xEl || !yEl || !zEl) return;

    const degYaw = ((heroState.yaw * 180 / Math.PI) % 360 + 360) % 360;
    const degPitch = (heroState.pitch * 180 / Math.PI);
    xEl.textContent = degYaw.toFixed(2).padStart(6, '0');
    yEl.textContent = Math.abs(degPitch).toFixed(2).padStart(6, '0');
    zEl.textContent = (heroState.scale * 10).toFixed(2).padStart(6, '0');
  }

  // ==========================================================================
  // 4. DASHBOARD: INTERACTIVE SKILL TREE & ACHIEVEMENTS
  // ==========================================================================
  function initDashboard() {
    updateDashboardHeaderUI();
    renderSkillTreeSVG();
    renderDashboardAchievements();

    const contBtn = document.getElementById('dash-continue-btn');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        switchView('training');
      });
    }
  }

  function renderSkillTreeSVG() {
    const svg = document.getElementById('skill-tree-svg');
    if (!svg) return;

    const nodes = Models.SKILL_NODES;
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    let html = '';

    // Background technical grid lines inside SVG
    for (let x = 40; x < 780; x += 60) {
      html += `<line x1="${x}" y1="0" x2="${x}" y2="340" stroke="rgba(66,217,255,0.04)" stroke-width="1"/>`;
    }
    for (let y = 40; y < 340; y += 60) {
      html += `<line x1="0" y1="${y}" x2="780" y2="${y}" stroke="rgba(66,217,255,0.04)" stroke-width="1"/>`;
    }

    // Connection edges
    nodes.forEach(n => {
      n.links.forEach(targetId => {
        const t = nodeMap[targetId];
        if (!t) return;
        const isActiveLink = n.status === 'passed';
        const stroke = isActiveLink ? '#42D9FF' : '#2A3B4E';
        const dash = isActiveLink ? '' : 'stroke-dasharray="5,5"';
        html += `<line x1="${n.x}" y1="${n.y}" x2="${t.x}" y2="${t.y}" stroke="${stroke}" stroke-width="2" ${dash} />`;
      });
    });

    // Nodes (with opaque base rect so connector lines never bleed through node cards)
    nodes.forEach(n => {
      const isSelected = appState.selectedSkillId === n.id;
      let fill = '#101720';
      let stroke = '#3A4A5E';
      let tagColor = '#8795A7';

      if (n.status === 'passed') {
        fill = '#12293A';
        stroke = '#42D9FF';
        tagColor = '#42D9FF';
      } else if (n.status === 'current') {
        fill = '#29211C';
        stroke = '#FF9D45';
        tagColor = '#FF9D45';
      } else if (n.status === 'available') {
        fill = '#12202E';
        stroke = 'rgba(66, 217, 255, 0.55)';
        tagColor = '#F0F4F8';
      }

      const ring = isSelected
        ? `<rect x="${n.x - 74}" y="${n.y - 36}" width="148" height="72" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="4,3"/>`
        : '';

      const displayBranch = n.shortBranch || n.branch;

      html += `
        <g class="skill-node-group" data-skill-id="${n.id}">
          ${ring}
          <rect x="${n.x - 66}" y="${n.y - 28}" width="132" height="56" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <text x="${n.x}" y="${n.y - 6}" text-anchor="middle" fill="${tagColor}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700">${displayBranch}</text>
          <text x="${n.x}" y="${n.y + 13}" text-anchor="middle" fill="#F0F4F8" font-family="Inter, sans-serif" font-size="10.5" font-weight="600">${n.mod}</text>
        </g>
      `;
    });

    svg.innerHTML = html;

    svg.querySelectorAll('.skill-node-group').forEach(g => {
      g.addEventListener('click', () => {
        appState.selectedSkillId = g.dataset.skillId;
        renderSkillTreeSVG();
        updateSkillInspector();
      });
    });

    updateSkillInspector();
  }

  function updateSkillInspector() {
    const node = Models.SKILL_NODES.find(n => n.id === appState.selectedSkillId) || Models.SKILL_NODES[0];
    const badge = document.getElementById('si-status-badge');
    const branch = document.getElementById('si-branch');
    const title = document.getElementById('si-title');
    const desc = document.getElementById('si-desc');
    const xp = document.getElementById('si-xp');
    const mod = document.getElementById('si-mod');
    const btn = document.getElementById('si-action-btn');

    const statusLabels = {
      passed: 'ПРОЙДЕНО ✓',
      current: 'ТЕКУЩАЯ ЦЕЛЬ',
      available: 'ДОСТУПНО ДЛЯ ИЗУЧЕНИЯ',
      locked: 'ТРЕБУЕТСЯ ПРЕДЫДУЩИЙ УЗЕЛ'
    };

    if (badge) badge.textContent = statusLabels[node.status] || 'МОДУЛЬ';
    if (branch) branch.textContent = `ВЕТКА: ${node.branch}`;
    if (title) title.textContent = node.title;
    if (desc) desc.textContent = node.desc;
    if (xp) xp.textContent = node.xp;
    if (mod) mod.textContent = node.mod;

    if (btn) {
      btn.onclick = () => {
        switchView(node.targetView);
        showToast(`Открыт модуль: ${node.title}`);
      };
    }
  }

  function renderDashboardAchievements() {
    const list = document.getElementById('dash-ach-list');
    if (!list) return;
    list.innerHTML = Models.ACHIEVEMENTS.slice(0, 3).map(a => `
      <div class="ach-item">
        <span class="ach-icon">${a.icon}</span>
        <span class="ach-name">${a.name}</span>
        <span class="ach-sub">${a.sub}</span>
      </div>
    `).join('');
  }

  // ==========================================================================
  // 5. PROJECTION LAB — ORTHOGRAPHIC PROJECTION TRAINER (MODULE 02)
  // ==========================================================================
  const projState = {
    modelIdx: 0,
    mesh: null,
    yaw: -0.68,
    pitch: 0.50,
    targetYaw: -0.68,
    targetPitch: 0.50,
    scale: 1.75,
    mode: '3d', // '3d' | 'ortho' | 'wireframe' | 'hidden'
    showAxes: true,
    showHidden: true,
    showHelpers: true,
    showDims: true,
    showPlanes: false,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    scanProgress: null,
    orthoDrawProgress: 1
  };

  function initProjectionLab() {
    const listEl = document.getElementById('proj-model-list');
    if (listEl) {
      listEl.innerHTML = Models.PROJECTION_MODELS.map((m, idx) => `
        <button class="model-item-btn ${idx === 0 ? 'active' : ''}" data-model-idx="${idx}">
          <span>${m.name}</span>
          <span class="model-code">${m.difficulty}</span>
        </button>
      `).join('');

      listEl.querySelectorAll('.model-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectProjectionModel(parseInt(btn.dataset.modelIdx, 10));
        });
      });
    }

    // Mode buttons: 3D VIEW, ORTHOGRAPHIC, WIRE FRAME, HIDDEN EDGES
    document.querySelectorAll('[data-proj-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-proj-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const m = btn.dataset.projMode;
        projState.mode = m;

        if (m === 'ortho') {
          // Snap to true isometric orthographic angle (yaw -45 deg, pitch 35.26 deg)
          projState.yaw = -Math.PI / 4;
          projState.pitch = 0.61548;
        } else if (m === 'hidden') {
          projState.showHidden = true;
          const chk = document.getElementById('proj-toggle-hidden');
          if (chk) chk.checked = true;
        }
        renderProjectionLabAll();
      });
    });

    // Layer toggles
    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        projState[key] = el.checked;
        renderProjectionLabAll();
      });
    };
    bindToggle('proj-toggle-axes', 'showAxes');
    bindToggle('proj-toggle-hidden', 'showHidden');
    bindToggle('proj-toggle-helpers', 'showHelpers');
    bindToggle('proj-toggle-dims', 'showDims');
    bindToggle('proj-toggle-planes', 'showPlanes');

    // Camera presets
    document.querySelectorAll('[data-cam]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.cam;
        if (preset === 'iso') {
          projState.yaw = -0.68;
          projState.pitch = 0.50;
        } else if (preset === 'front') {
          projState.yaw = 0;
          projState.pitch = 0;
        } else if (preset === 'top') {
          projState.yaw = 0;
          projState.pitch = Math.PI / 2;
        } else if (preset === 'left') {
          projState.yaw = -Math.PI / 2;
          projState.pitch = 0;
        }
        renderProjectionLabAll();
      });
    });

    // Zoom & reset buttons
    const zIn = document.getElementById('proj-zoom-in');
    const zOut = document.getElementById('proj-zoom-out');
    const zRes = document.getElementById('proj-reset-cam');
    if (zIn) zIn.addEventListener('click', () => { projState.scale = Math.min(3.0, projState.scale * 1.15); renderProjectionLabAll(); });
    if (zOut) zOut.addEventListener('click', () => { projState.scale = Math.max(0.8, projState.scale * 0.87); renderProjectionLabAll(); });
    if (zRes) zRes.addEventListener('click', () => {
      projState.yaw = -0.68;
      projState.pitch = 0.50;
      projState.scale = 1.75;
      renderProjectionLabAll();
    });

    // SCAN OBJECT button
    const scanBtn = document.getElementById('btn-scan-object');
    if (scanBtn) {
      scanBtn.addEventListener('click', triggerObjectLaserScan);
    }

    // 3D viewport drag orbit
    const canvas3d = document.getElementById('proj-3d-canvas');
    if (canvas3d) {
      canvas3d.addEventListener('mousedown', (e) => {
        projState.isDragging = true;
        projState.lastX = e.clientX;
        projState.lastY = e.clientY;
      });
      window.addEventListener('mousemove', (e) => {
        if (!projState.isDragging) return;
        const dx = e.clientX - projState.lastX;
        const dy = e.clientY - projState.lastY;
        projState.lastX = e.clientX;
        projState.lastY = e.clientY;
        projState.yaw += dx * 0.009;
        projState.pitch = Math.max(-1.4, Math.min(1.55, projState.pitch + dy * 0.009));
        renderProjectionLabAll();
      });
      window.addEventListener('mouseup', () => {
        projState.isDragging = false;
      });
      canvas3d.addEventListener('wheel', (e) => {
        e.preventDefault();
        projState.scale = Math.max(0.85, Math.min(3.1, projState.scale * (e.deltaY > 0 ? 0.92 : 1.08)));
        renderProjectionLabAll();
      }, { passive: false });
    }

    selectProjectionModel(0);
  }

  function selectProjectionModel(idx) {
    projState.modelIdx = idx;
    const modelDef = Models.PROJECTION_MODELS[idx];
    projState.mesh = modelDef.build();

    document.querySelectorAll('#proj-model-list .model-item-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });

    // Update specification table
    const codeEl = document.getElementById('spec-code');
    const dimsEl = document.getElementById('spec-dims');
    const topoEl = document.getElementById('spec-topo');
    const diffEl = document.getElementById('spec-diff');
    const noteEl = document.getElementById('spec-note');

    if (codeEl) codeEl.textContent = modelDef.code;
    if (dimsEl) dimsEl.textContent = modelDef.dims;
    if (topoEl) topoEl.textContent = `${projState.mesh.vertices.length} / ${projState.mesh.faces.length}`;
    if (diffEl) diffEl.textContent = modelDef.difficulty;
    if (noteEl) noteEl.textContent = modelDef.note;

    renderProjectionLabAll();
  }

  function triggerObjectLaserScan() {
    const banner = document.getElementById('scan-banner');
    if (banner) banner.classList.add('active');

    projState.showAxes = true;
    const axesChk = document.getElementById('proj-toggle-axes');
    if (axesChk) axesChk.checked = true;

    const start = performance.now();
    const duration = 1500;

    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      projState.scanProgress = p;
      projState.orthoDrawProgress = p;
      renderProjectionLabAll();

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        projState.scanProgress = null;
        projState.orthoDrawProgress = 1;
        if (banner) banner.classList.remove('active');
        renderProjectionLabAll();
        addXP(40, 'Лазерное сканирование и построение 3 проекций');
      }
    }
    requestAnimationFrame(step);
  }

  function renderProjectionLabAll() {
    if (!projState.mesh) return;

    const c3d = document.getElementById('proj-3d-canvas');
    const cFront = document.getElementById('ortho-front-canvas');
    const cLeft = document.getElementById('ortho-left-canvas');
    const cTop = document.getElementById('ortho-top-canvas');
    const cEpure = document.getElementById('ortho-epure-canvas');

    if (c3d) {
      let renderMode = 'solid';
      if (projState.mode === 'wireframe') renderMode = 'wireframe';
      else if (projState.mode === 'hidden') renderMode = 'hidden';

      Engine.renderMesh3D(c3d.getContext('2d'), projState.mesh, {
        yaw: projState.yaw,
        pitch: projState.pitch,
        scale: projState.scale,
        mode: renderMode,
        showAxes: projState.showAxes,
        showHiddenEdges: projState.showHidden || projState.mode === 'hidden',
        showDimensions: projState.showDims,
        showPlanes: projState.showPlanes,
        highlightOutline: projState.scanProgress !== null,
        scanProgress: projState.scanProgress
      });
    }

    const orthoOpts = {
      scale: 1.35,
      showHidden: projState.showHidden,
      showAxes: projState.showAxes,
      showDims: projState.showDims,
      drawProgress: projState.orthoDrawProgress
    };

    if (cFront) Engine.renderOrthoView(cFront.getContext('2d'), projState.mesh, 'front', orthoOpts);
    if (cLeft) Engine.renderOrthoView(cLeft.getContext('2d'), projState.mesh, 'left', orthoOpts);
    if (cTop) Engine.renderOrthoView(cTop.getContext('2d'), projState.mesh, 'top', orthoOpts);
    if (cEpure) {
      Engine.renderMongeEpure(cEpure.getContext('2d'), projState.mesh, {
        scale: 0.50,
        showHelpers: projState.showHelpers,
        showHidden: projState.showHidden
      });
    }
  }

  // ==========================================================================
  // 6. ISOMETRIC BUILDER — 3D SPATIAL CONSTRUCTOR (MODULE 03)
  // ==========================================================================
  const builderState = {
    items: [],
    selectedId: null,
    nextId: 10,
    history: [],
    redoStack: [],
    yaw: -0.785,
    pitch: 0.55,
    scale: 1.85,
    showGrid: true,
    wireframe: false,
    isDragging: false,
    dragMoved: false,
    lastX: 0,
    lastY: 0,
    combinedMesh: null
  };

  const PRIMITIVE_NAMES = {
    cube: 'Куб (1×1×1)',
    block: 'Прямоуг. блок (2×1×1)',
    cylinder: 'Цилиндр (Ø1×1)',
    sphere: 'Сфера (Ø1.0)',
    prism: 'Призма (1×1×1)',
    pyramid: 'Пирамида (1×1×1)'
  };

  function pushBuilderHistory() {
    builderState.history.push(JSON.stringify(builderState.items));
    if (builderState.history.length > 35) builderState.history.shift();
    builderState.redoStack = [];
  }

  function initIsometricBuilder() {
    // Load initial preset construction so the scene looks impressive right away
    loadBuilderPreset('arch', false);

    // Add Primitive buttons
    document.querySelectorAll('[data-prim]').forEach(btn => {
      btn.addEventListener('click', () => {
        addBuilderPrimitive(btn.dataset.prim);
      });
    });

    // Coordinate nudgers (+X/-X, +Y/-Y, +Z/-Z)
    document.querySelectorAll('[data-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const axis = btn.dataset.move;
        const dir = parseInt(btn.dataset.dir, 10);
        nudgeSelectedPart(axis, dir);
      });
    });

    // Rotate & Delete part
    const rotBtn = document.getElementById('builder-rotate-part');
    const delBtn = document.getElementById('builder-delete-part');
    if (rotBtn) rotBtn.addEventListener('click', rotateSelectedPart);
    if (delBtn) delBtn.addEventListener('click', deleteSelectedPart);

    // Preset blueprints
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        loadBuilderPreset(btn.dataset.preset, true);
      });
    });

    // Bottom CAD Dock buttons
    const undoBtn = document.getElementById('b-undo');
    const redoBtn = document.getElementById('b-redo');
    const resetBtn = document.getElementById('b-reset');
    const clearBtn = document.getElementById('b-clear');
    const gridBtn = document.getElementById('b-grid-toggle');
    const wireBtn = document.getElementById('b-wire-toggle');
    const saveBtn = document.getElementById('b-save-construction');

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (builderState.history.length === 0) return;
        builderState.redoStack.push(JSON.stringify(builderState.items));
        builderState.items = JSON.parse(builderState.history.pop());
        builderState.selectedId = builderState.items.length ? builderState.items[builderState.items.length - 1].id : null;
        renderBuilderAll();
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        if (builderState.redoStack.length === 0) return;
        builderState.history.push(JSON.stringify(builderState.items));
        builderState.items = JSON.parse(builderState.redoStack.pop());
        renderBuilderAll();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        builderState.yaw = -0.785;
        builderState.pitch = 0.55;
        builderState.scale = 1.85;
        renderBuilderAll();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        pushBuilderHistory();
        builderState.items = [];
        builderState.selectedId = null;
        renderBuilderAll();
        showToast('Изометрическая сцена очищена');
      });
    }

    if (gridBtn) {
      gridBtn.addEventListener('click', () => {
        builderState.showGrid = !builderState.showGrid;
        gridBtn.classList.toggle('active', builderState.showGrid);
        gridBtn.textContent = `⊞ GRID: ${builderState.showGrid ? 'ON' : 'OFF'}`;
        renderBuilderAll();
      });
    }

    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        builderState.wireframe = !builderState.wireframe;
        wireBtn.classList.toggle('active', builderState.wireframe);
        wireBtn.textContent = `⬡ WIREFRAME: ${builderState.wireframe ? 'ON' : 'OFF'}`;
        renderBuilderAll();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', saveCurrentConstruction);
    }

    // Canvas mouse orbit & click-picking of 3D primitives
    const canvas = document.getElementById('builder-canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => {
        builderState.isDragging = true;
        builderState.dragMoved = false;
        builderState.lastX = e.clientX;
        builderState.lastY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!builderState.isDragging) return;
        const dx = e.clientX - builderState.lastX;
        const dy = e.clientY - builderState.lastY;
        if (Math.hypot(dx, dy) > 3) builderState.dragMoved = true;
        builderState.lastX = e.clientX;
        builderState.lastY = e.clientY;
        builderState.yaw += dx * 0.0085;
        builderState.pitch = Math.max(-1.2, Math.min(1.45, builderState.pitch + dy * 0.0085));
        renderBuilderAll();
      });

      window.addEventListener('mouseup', (e) => {
        if (builderState.isDragging && !builderState.dragMoved && e.target === canvas) {
          handleBuilderCanvasClick(e, canvas);
        }
        builderState.isDragging = false;
      });

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        builderState.scale = Math.max(0.9, Math.min(3.2, builderState.scale * (e.deltaY > 0 ? 0.92 : 1.08)));
        renderBuilderAll();
      }, { passive: false });
    }

    // Keyboard shortcuts for isometric builder when view-builder is active
    window.addEventListener('keydown', (e) => {
      if (appState.currentView !== 'builder') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedPart();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        nudgeSelectedPart('x', 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        nudgeSelectedPart('x', -1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        nudgeSelectedPart('y', 1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        nudgeSelectedPart('y', -1);
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'PageUp') {
        e.preventDefault();
        nudgeSelectedPart('z', 1);
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'PageDown') {
        e.preventDefault();
        nudgeSelectedPart('z', -1);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateSelectedPart();
      }
    });

    renderSavedConstructionsList();
  }

  function addBuilderPrimitive(type) {
    pushBuilderHistory();

    // Find smart non-overlapping grid position
    let gx = 0, gy = 0, gz = 0;
    const sel = builderState.items.find(it => it.id === builderState.selectedId);
    if (sel) {
      gx = sel.gx;
      gy = sel.gy;
      gz = sel.gz + 1;
    }
    // Stack upwards if cell occupied
    while (builderState.items.some(it => it.gx === gx && it.gy === gy && it.gz === gz)) {
      gz++;
    }
    if (gz > 4) {
      gz = 0;
      gx = (gx + 1) % 3;
    }

    const newItem = {
      id: ++builderState.nextId,
      type,
      gx,
      gy,
      gz,
      rot: 0
    };
    builderState.items.push(newItem);
    builderState.selectedId = newItem.id;
    renderBuilderAll();

    // Check daily quest completion
    if (builderState.items.length >= 4 && !appState.dailyCompleted) {
      appState.dailyCount = 3;
      appState.dailyCompleted = true;
      addXP(150, 'Ежедневная задача: Собрана изометрическая конструкция!');
    }
  }

  function nudgeSelectedPart(axis, dir) {
    const sel = builderState.items.find(it => it.id === builderState.selectedId);
    if (!sel) return;
    pushBuilderHistory();
    if (axis === 'x') sel.gx = Math.max(-4, Math.min(4, sel.gx + dir));
    if (axis === 'y') sel.gy = Math.max(-4, Math.min(4, sel.gy + dir));
    if (axis === 'z') sel.gz = Math.max(0, Math.min(5, sel.gz + dir));
    renderBuilderAll();
  }

  function rotateSelectedPart() {
    const sel = builderState.items.find(it => it.id === builderState.selectedId);
    if (!sel) return;
    pushBuilderHistory();
    sel.rot = (sel.rot + 1) % 4;
    renderBuilderAll();
  }

  function deleteSelectedPart() {
    if (!builderState.selectedId) return;
    pushBuilderHistory();
    builderState.items = builderState.items.filter(it => it.id !== builderState.selectedId);
    builderState.selectedId = builderState.items.length ? builderState.items[builderState.items.length - 1].id : null;
    renderBuilderAll();
  }

  function handleBuilderCanvasClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30;
    const U = 28;

    // Pick closest projected primitive centroid
    let bestId = null;
    let bestDist = 42;
    for (const it of builderState.items) {
      const pt = Engine.transformPoint([it.gx * U, it.gy * U, (it.gz + 0.5) * U], builderState.yaw, builderState.pitch, builderState.scale);
      const d = Math.hypot(mx - (cx + pt.sx), my - (cy + pt.sy));
      if (d < bestDist) {
        bestDist = d;
        bestId = it.id;
      }
    }
    if (bestId !== null) {
      builderState.selectedId = bestId;
      renderBuilderAll();
    }
  }

  function loadBuilderPreset(presetName, notify) {
    pushBuilderHistory();
    if (presetName === 'arch') {
      builderState.items = [
        { id: 101, type: 'cube', gx: -1, gy: 0, gz: 0, rot: 0 },
        { id: 102, type: 'cube', gx: 1, gy: 0, gz: 0, rot: 0 },
        { id: 103, type: 'cylinder', gx: -1, gy: 0, gz: 1, rot: 0 },
        { id: 104, type: 'cylinder', gx: 1, gy: 0, gz: 1, rot: 0 },
        { id: 105, type: 'block', gx: 0, gy: 0, gz: 2, rot: 0 },
        { id: 106, type: 'prism', gx: 0, gy: 0, gz: 3, rot: 1 }
      ];
    } else if (presetName === 'tower') {
      builderState.items = [
        { id: 201, type: 'block', gx: 0, gy: -1, gz: 0, rot: 0 },
        { id: 202, type: 'block', gx: 0, gy: 0, gz: 0, rot: 0 },
        { id: 203, type: 'block', gx: 0, gy: 1, gz: 0, rot: 0 },
        { id: 204, type: 'cylinder', gx: 0, gy: 0, gz: 1, rot: 0 },
        { id: 205, type: 'cylinder', gx: 0, gy: 0, gz: 2, rot: 0 },
        { id: 206, type: 'sphere', gx: 0, gy: 0, gz: 3, rot: 0 }
      ];
    } else {
      builderState.items = [
        { id: 301, type: 'cube', gx: -1, gy: -1, gz: 0, rot: 0 },
        { id: 302, type: 'cube', gx: 0, gy: -1, gz: 0, rot: 0 },
        { id: 303, type: 'cube', gx: 1, gy: -1, gz: 0, rot: 0 },
        { id: 304, type: 'cube', gx: -1, gy: 0, gz: 0, rot: 0 },
        { id: 305, type: 'cube', gx: -1, gy: 0, gz: 1, rot: 0 },
        { id: 306, type: 'pyramid', gx: -1, gy: 0, gz: 2, rot: 0 }
      ];
    }
    builderState.selectedId = builderState.items[builderState.items.length - 1].id;
    renderBuilderAll();
    if (notify) showToast('Загружена типовая 3D-конструкция');
  }

  function saveCurrentConstruction() {
    if (builderState.items.length === 0) {
      showToast('Сцена пуста — добавьте хотя бы одну деталь');
      return;
    }
    const idx = appState.savedConstructions.length + 1;
    appState.savedConstructions.unshift({
      name: `Сборка #0${idx} (${builderState.items.length} дет.)`,
      date: `ГОСТ-СБ-0${idx}`,
      items: JSON.parse(JSON.stringify(builderState.items))
    });
    saveState();
    renderSavedConstructionsList();
    addXP(80, 'Конструкция сохранена в архив чертежей');
  }

  function renderSavedConstructionsList() {
    const list = document.getElementById('saved-constructions-list');
    if (!list) return;
    list.innerHTML = appState.savedConstructions.map((sc, idx) => `
      <div class="saved-item">
        <span>${sc.name}</span>
        <button data-load-idx="${idx}">ЗАГРУЗИТЬ</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-load-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sc = appState.savedConstructions[parseInt(btn.dataset.loadIdx, 10)];
        if (sc) {
          pushBuilderHistory();
          builderState.items = JSON.parse(JSON.stringify(sc.items));
          builderState.selectedId = builderState.items.length ? builderState.items[0].id : null;
          renderBuilderAll();
          showToast(`Загружена: ${sc.name}`);
        }
      });
    });
  }

  function renderBuilderAll() {
    const canvas = document.getElementById('builder-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Build combined mesh from placed primitives
    const subMeshes = builderState.items.map(it =>
      Models.createBuilderPrimitive(it.type, it.gx, it.gy, it.gz, it.rot, it.id, it.id === builderState.selectedId)
    );
    const merged = Models.mergeMeshes(subMeshes);
    builderState.combinedMesh = merged;

    Engine.renderMesh3D(ctx, merged, {
      cy: canvas.height / 2 + 30,
      yaw: builderState.yaw,
      pitch: builderState.pitch,
      scale: builderState.scale,
      mode: builderState.wireframe ? 'wireframe' : 'solid',
      showGrid: builderState.showGrid,
      showAxes: true,
      gridZ: 0
    });

    // Update top counters & inspector coordinates
    const countEl = document.getElementById('builder-count');
    const selNameEl = document.getElementById('builder-selected-name');
    const selX = document.getElementById('sel-x');
    const selY = document.getElementById('sel-y');
    const selZ = document.getElementById('sel-z');

    if (countEl) countEl.textContent = builderState.items.length;
    const selItem = builderState.items.find(it => it.id === builderState.selectedId);
    if (selItem) {
      if (selNameEl) selNameEl.textContent = PRIMITIVE_NAMES[selItem.type] || selItem.type.toUpperCase();
      if (selX) selX.textContent = selItem.gx;
      if (selY) selY.textContent = selItem.gy;
      if (selZ) selZ.textContent = selItem.gz;
    } else {
      if (selNameEl) selNameEl.textContent = 'НЕТ';
      if (selX) selX.textContent = '0';
      if (selY) selY.textContent = '0';
      if (selZ) selZ.textContent = '0';
    }

    // Update live mini Monge orthographic drawing of the user's custom construction
    const miniCanvas = document.getElementById('builder-mini-ortho');
    if (miniCanvas) {
      Engine.renderMongeEpure(miniCanvas.getContext('2d'), merged, {
        scale: 0.44,
        showHelpers: true,
        showHidden: true
      });
    }
  }

  // ==========================================================================
  // 7. INTERACTIVE STEP-BY-STEP TRAINING LESSONS (MODULE 04)
  // ==========================================================================
  const trainState = {
    lessonIdx: 0,
    stepIdx: 0,
    paramVal: 60
  };

  function initTrainingModule() {
    const navList = document.getElementById('lesson-nav-list');
    if (navList) {
      navList.innerHTML = Models.TRAINING_LESSONS.map((les, idx) => `
        <button class="lesson-nav-item ${idx === 0 ? 'active' : ''}" data-les-idx="${idx}">
          <span class="ln-num">${les.tag}</span>
          <span class="ln-title">${les.title}</span>
        </button>
      `).join('');

      navList.querySelectorAll('.lesson-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          selectTrainingLesson(parseInt(btn.dataset.lesIdx, 10));
        });
      });
    }

    const slider = document.getElementById('train-param-slider');
    if (slider) {
      slider.addEventListener('input', () => {
        trainState.paramVal = parseFloat(slider.value);
        renderTrainingCanvas();
      });
    }

    const prevBtn = document.getElementById('train-prev-step');
    const nextBtn = document.getElementById('train-next-step');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (trainState.stepIdx > 0) {
          trainState.stepIdx--;
          updateTrainingUI();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const les = Models.TRAINING_LESSONS[trainState.lessonIdx];
        if (trainState.stepIdx < les.steps.length - 1) {
          trainState.stepIdx++;
          updateTrainingUI();
          if (trainState.stepIdx === les.steps.length - 1) {
            appState.lessonsDone = Math.min(12, appState.lessonsDone + 1);
            addXP(100, `Завершено построение: ${les.title}`);
          }
        } else {
          // Move to next lesson
          const nextLes = (trainState.lessonIdx + 1) % Models.TRAINING_LESSONS.length;
          selectTrainingLesson(nextLes);
        }
      });
    }

    selectTrainingLesson(0);
  }

  function selectTrainingLesson(idx) {
    trainState.lessonIdx = idx;
    trainState.stepIdx = 0;
    const les = Models.TRAINING_LESSONS[idx];
    trainState.paramVal = les.paramDefault;

    document.querySelectorAll('#lesson-nav-list .lesson-nav-item').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
    });

    const slider = document.getElementById('train-param-slider');
    const label = document.getElementById('train-param-label');
    if (slider) {
      slider.min = les.paramMin;
      slider.max = les.paramMax;
      slider.value = les.paramDefault;
    }
    if (label) label.textContent = les.paramLabel;

    updateTrainingUI();
  }

  function updateTrainingUI() {
    const les = Models.TRAINING_LESSONS[trainState.lessonIdx];
    const step = les.steps[trainState.stepIdx];

    document.getElementById('train-lesson-tag').textContent = les.tag;
    document.getElementById('train-lesson-title').textContent = les.title;
    document.getElementById('train-step-num').textContent = trainState.stepIdx + 1;
    document.getElementById('train-step-total').textContent = les.steps.length;
    document.getElementById('train-step-heading').textContent = step.heading;
    document.getElementById('train-step-body').textContent = step.body;

    renderTrainingCanvas();
  }

  function renderTrainingCanvas() {
    const canvas = document.getElementById('training-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Millimeter grid
    ctx.strokeStyle = 'rgba(66, 217, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 25; x < w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 25; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const les = Models.TRAINING_LESSONS[trainState.lessonIdx];
    const step = trainState.stepIdx;
    const R = trainState.paramVal;

    if (les.id === 'fillet') {
      // External Tangent Arc (Fillet) between two circles O1 and O2
      const O1 = { x: 260, y: 265, r: 58 };
      const O2 = { x: 500, y: 265, r: 44 };

      // Base circles O1, O2
      ctx.strokeStyle = '#42D9FF';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(O1.x, O1.y, O1.r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(O2.x, O2.y, O2.r, 0, Math.PI * 2); ctx.stroke();

      // Centers
      ctx.fillStyle = '#F0F4F8';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText('O₁ (R₁=58)', O1.x - 34, O1.y + 22);
      ctx.fillText('O₂ (R₂=44)', O2.x - 34, O2.y + 22);

      // Compute exact intersection O3 of circle(O1, R1+R) and circle(O2, R2+R)
      const rA = O1.r + R;
      const rB = O2.r + R;
      const d = O2.x - O1.x;
      const a = (rA * rA - rB * rB + d * d) / (2 * d);
      const hSq = Math.max(0, rA * rA - a * a);
      const O3 = { x: O1.x + a, y: O1.y - Math.sqrt(hSq) };

      const angO1ToO3 = Math.atan2(O3.y - O1.y, O3.x - O1.x);
      const angO2ToO3 = Math.atan2(O3.y - O2.y, O3.x - O2.x);

      if (step >= 1) {
        // Auxiliary construction arcs (R1+R) and (R2+R) centered around their true intersection O3
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 157, 69, 0.55)';
        ctx.lineWidth = 1.25;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(O1.x, O1.y, rA, angO1ToO3 - 0.35, angO1ToO3 + 0.35); ctx.stroke();
        ctx.beginPath(); ctx.arc(O2.x, O2.y, rB, angO2ToO3 - 0.35, angO2ToO3 + 0.35); ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#FF9D45';
        ctx.beginPath(); ctx.arc(O3.x, O3.y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(`O₃ (R=${Math.round(R)})`, O3.x - 36, O3.y - 14);
      }

      // Tangency points K1 and K2
      const ang1 = Math.atan2(O1.y - O3.y, O1.x - O3.x);
      const ang2 = Math.atan2(O2.y - O3.y, O2.x - O3.x);
      const K1 = { x: O3.x + R * Math.cos(ang1), y: O3.y + R * Math.sin(ang1) };
      const K2 = { x: O3.x + R * Math.cos(ang2), y: O3.y + R * Math.sin(ang2) };

      if (step >= 2) {
        ctx.save();
        ctx.strokeStyle = 'rgba(66, 217, 255, 0.45)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(O3.x, O3.y); ctx.lineTo(O1.x, O1.y);
        ctx.moveTo(O3.x, O3.y); ctx.lineTo(O2.x, O2.y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#2EE59D';
        ctx.beginPath(); ctx.arc(K1.x, K1.y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(K2.x, K2.y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('K₁', K1.x - 24, K1.y - 8);
        ctx.fillText('K₂', K2.x + 12, K2.y - 8);
      }

      if (step >= 3) {
        // Final thick tangent fillet arc from K2 to K1
        ctx.save();
        ctx.strokeStyle = '#FF9D45';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#FF9D45';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(O3.x, O3.y, R, ang2, ang1);
        ctx.stroke();
        ctx.restore();
      }
    } else if (les.id === 'monge') {
      // Step-by-step Monge Epure construction
      const ox = 390, oy = 195;
      const W = 110, H = 75, Y = R; // groove depth

      // Axes
      ctx.strokeStyle = 'rgba(66, 217, 255, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(40, oy); ctx.lineTo(w - 40, oy);
      ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20);
      ctx.stroke();

      // Step 1: Front view V
      const vx = ox - 150, vy = oy - 25;
      ctx.strokeStyle = '#42D9FF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(vx - W, vy);
      ctx.lineTo(vx, vy);
      ctx.lineTo(vx, vy - H);
      ctx.lineTo(vx - 35, vy - H);
      ctx.lineTo(vx - 35, vy - H + 30);
      ctx.lineTo(vx - W + 35, vy - H + 30);
      ctx.lineTo(vx - W + 35, vy - H);
      ctx.lineTo(vx - W, vy - H);
      ctx.closePath();
      ctx.stroke();

      if (step >= 1) {
        // Projection lines down to H and Top View
        const hy = oy + 30;
        ctx.save();
        ctx.strokeStyle = 'rgba(66, 217, 255, 0.25)';
        ctx.setLineDash([4, 4]);
        for (const xOff of [-W, -W + 35, -35, 0]) {
          ctx.beginPath(); ctx.moveTo(vx + xOff, vy); ctx.lineTo(vx + xOff, hy + Y); ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#42D9FF';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(vx - W, hy, W, Y);
        ctx.beginPath();
        ctx.moveTo(vx - W + 35, hy); ctx.lineTo(vx - W + 35, hy + Y);
        ctx.moveTo(vx - 35, hy); ctx.lineTo(vx - 35, hy + Y);
        ctx.stroke();
      }

      if (step >= 2) {
        // 45 degree bisector & horizontal rays
        ctx.strokeStyle = '#FF9D45';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 165, oy + 165); ctx.stroke();

        const hy = oy + 30;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 157, 69, 0.35)';
        ctx.setLineDash([4, 4]);
        for (const yVal of [hy, hy + Y]) {
          const d = yVal - oy;
          ctx.beginPath();
          ctx.moveTo(vx, yVal);
          ctx.lineTo(ox + d, yVal);
          ctx.lineTo(ox + d, vy - H);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (step >= 3) {
        // Left View W with dashed hidden groove line
        const wx = ox + 30;
        ctx.strokeStyle = '#42D9FF';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(wx, vy - H, Y, H);

        ctx.save();
        ctx.strokeStyle = '#FF9D45';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(wx, vy - H + 30);
        ctx.lineTo(wx + Y, vy - H + 30);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Isometric Axes (120 deg) & Isometric Oval Construction
      const cx = w / 2, cy = h / 2 - 15;
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = 0.5;

      // Step 1: 120 deg axes
      ctx.strokeStyle = 'rgba(66, 217, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 140); ctx.lineTo(cx, cy + 140); // Z
      ctx.moveTo(cx - 160 * cos30, cy - 160 * sin30); ctx.lineTo(cx + 160 * cos30, cy + 160 * sin30); // X
      ctx.moveTo(cx + 160 * cos30, cy - 160 * sin30); ctx.lineTo(cx - 160 * cos30, cy + 160 * sin30); // Y
      ctx.stroke();

      // Isometric rhombus corners
      const A = { x: cx - R * 2 * cos30, y: cy };
      const C = { x: cx + R * 2 * cos30, y: cy };
      const B = { x: cx, y: cy - R };
      const D = { x: cx, y: cy + R };

      if (step >= 1) {
        ctx.strokeStyle = 'rgba(240, 244, 248, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y);
        ctx.closePath();
        ctx.stroke();
      }

      if (step >= 2) {
        // Four-center oval construction rays from B and D
        const m1 = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        const m2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
        const m3 = { x: (A.x + D.x) / 2, y: (A.y + D.y) / 2 };
        const m4 = { x: (D.x + C.x) / 2, y: (D.y + C.y) / 2 };

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 157, 69, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(D.x, D.y); ctx.lineTo(m1.x, m1.y);
        ctx.moveTo(D.x, D.y); ctx.lineTo(m2.x, m2.y);
        ctx.moveTo(B.x, B.y); ctx.lineTo(m3.x, m3.y);
        ctx.moveTo(B.x, B.y); ctx.lineTo(m4.x, m4.y);
        ctx.stroke();
        ctx.restore();
      }

      if (step >= 3) {
        // Draw smooth isometric oval and cylinder extruded body
        const rx = R * Math.sqrt(1.5);
        const ry = R * Math.sqrt(0.5);
        ctx.save();
        ctx.strokeStyle = '#42D9FF';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Extruded bottom cylinder contour
        const hCyl = 75;
        ctx.beginPath();
        ctx.ellipse(cx, cy + hCyl, rx, ry, 0, 0, Math.PI);
        ctx.moveTo(cx - rx, cy); ctx.lineTo(cx - rx, cy + hCyl);
        ctx.moveTo(cx + rx, cy); ctx.lineTo(cx + rx, cy + hCyl);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // 8. SPATIAL REASONING CHALLENGES (MODULE 05)
  // ==========================================================================
  const chalState = {
    idx: 0,
    streak: 0,
    score: 0,
    answered: false,
    yaw: -0.68,
    pitch: 0.50,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    currentMesh: null
  };

  function initChallengesModule() {
    const nextBtn = document.getElementById('chal-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        chalState.idx = (chalState.idx + 1) % Models.CHALLENGES.length;
        renderCurrentChallenge();
      });
    }

    const c3d = document.getElementById('challenge-3d-canvas');
    if (c3d) {
      c3d.addEventListener('mousedown', (e) => {
        chalState.isDragging = true;
        chalState.lastX = e.clientX;
        chalState.lastY = e.clientY;
      });
      window.addEventListener('mousemove', (e) => {
        if (!chalState.isDragging) return;
        const dx = e.clientX - chalState.lastX;
        const dy = e.clientY - chalState.lastY;
        chalState.lastX = e.clientX;
        chalState.lastY = e.clientY;
        chalState.yaw += dx * 0.009;
        chalState.pitch = Math.max(-1.2, Math.min(1.4, chalState.pitch + dy * 0.009));
        renderChallenge3DOnly();
      });
      window.addEventListener('mouseup', () => {
        chalState.isDragging = false;
      });
    }

    renderCurrentChallenge();
  }

  function renderChallenge3DOnly() {
    const c3d = document.getElementById('challenge-3d-canvas');
    if (!c3d || !chalState.currentMesh) return;
    Engine.renderMesh3D(c3d.getContext('2d'), chalState.currentMesh, {
      yaw: chalState.yaw,
      pitch: chalState.pitch,
      scale: 1.65,
      mode: 'solid',
      showAxes: true,
      showHiddenEdges: false
    });
  }

  function renderCurrentChallenge() {
    const chal = Models.CHALLENGES[chalState.idx];
    chalState.answered = false;
    chalState.yaw = -0.68;
    chalState.pitch = 0.50;
    chalState.currentMesh = Models.PROJECTION_MODELS[chal.modelIdx].build();

    document.getElementById('chal-category').textContent = chal.category;
    document.getElementById('chal-xp-reward').textContent = `+${chal.xp} XP`;
    document.getElementById('chal-question').textContent = chal.question;
    document.getElementById('chal-index').textContent = `${chalState.idx + 1} / ${Models.CHALLENGES.length}`;
    document.getElementById('chal-feedback-text').textContent = 'Выберите один из четырёх вариантов чертежа для проверки по ГОСТ.';
    document.getElementById('chal-next-btn').style.display = 'none';

    renderChallenge3DOnly();

    // Generate 4 option canvases (1 exact orthographic drawing + 3 plausible engineering distractors)
    const grid = document.getElementById('chal-options-grid');
    if (!grid) return;

    const letters = ['A', 'B', 'C', 'D'];
    grid.innerHTML = letters.map((L, i) => `
      <div class="chal-opt-btn" data-opt-idx="${i}">
        <span class="chal-opt-label">ВАРИАНТ ${L}</span>
        <canvas id="chal-opt-canvas-${i}" width="240" height="165"></canvas>
      </div>
    `).join('');

    const distractors = [
      { view: chal.targetView, mut: 'swap-hidden' },
      { view: chal.targetView === 'top' ? 'front' : 'top', mut: null },
      { view: chal.targetView, mut: 'drop-inner' }
    ];
    let dPtr = 0;

    letters.forEach((_, i) => {
      const c = document.getElementById(`chal-opt-canvas-${i}`);
      if (!c) return;
      if (i === chal.correctOption) {
        Engine.renderOrthoView(c.getContext('2d'), chalState.currentMesh, chal.targetView, {
          scale: 1.15,
          showHidden: true,
          showAxes: true,
          showDims: false
        });
      } else {
        const d = distractors[dPtr++];
        Engine.renderOrthoView(c.getContext('2d'), chalState.currentMesh, d.view, {
          scale: 1.15,
          showHidden: true,
          showAxes: true,
          showDims: false,
          variantMutation: d.mut
        });
      }
    });

    grid.querySelectorAll('.chal-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (chalState.answered) return;
        chalState.answered = true;
        const picked = parseInt(btn.dataset.optIdx, 10);
        const fb = document.getElementById('chal-feedback-text');
        const nextBtn = document.getElementById('chal-next-btn');

        if (picked === chal.correctOption) {
          btn.classList.add('correct');
          chalState.streak++;
          chalState.score += chal.xp;
          appState.tasksDone++;
          if (fb) fb.innerHTML = `<strong style="color:#2EE59D;">ВЕРНО!</strong> ${chal.explanation}`;
          addXP(chal.xp, `Испытание #${chal.id} пройдено верно`);
        } else {
          btn.classList.add('wrong');
          const rightEl = grid.querySelector(`[data-opt-idx="${chal.correctOption}"]`);
          if (rightEl) rightEl.classList.add('correct');
          chalState.streak = 0;
          if (fb) fb.innerHTML = `<strong style="color:#FF5470;">ОШИБКА ЧТЕНИЯ ЧЕРТЕЖА.</strong> ${chal.explanation}`;
        }

        document.getElementById('chal-streak').textContent = chalState.streak;
        document.getElementById('chal-score').textContent = chalState.score;
        if (nextBtn) nextBtn.style.display = 'inline-flex';
      });
    });
  }

  // ==========================================================================
  // 9. PROGRESS & COMPETENCY RADAR (MODULE 06)
  // ==========================================================================
  function initProgressModule() {
    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem('grafika_lab_state_v1');
        appState = JSON.parse(JSON.stringify(defaultState));
        updateDashboardHeaderUI();
        renderProgressPage();
        showToast('Прогресс сброшен к базовым параметрам');
      });
    }
    renderProgressPage();
  }

  function renderProgressPage() {
    // Full achievements grid
    const achGrid = document.getElementById('full-ach-grid');
    if (achGrid) {
      achGrid.innerHTML = Models.ACHIEVEMENTS.map(a => `
        <div class="ach-item" style="opacity: ${a.unlocked || appState.xp > 1600 ? 1 : 0.55}">
          <span class="ach-icon">${a.icon}</span>
          <span class="ach-name">${a.name}</span>
          <span class="ach-sub">${a.sub}</span>
        </div>
      `).join('');
    }

    // Draw Competency Radar Chart
    const canvas = document.getElementById('progress-radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 6;
    const R = 115;
    ctx.clearRect(0, 0, w, h);

    const labels = [
      'Геометрия',
      'Проекции V/H/W',
      'Изометрия 3D',
      'Чтение чертежей',
      'ГОСТ Размеры',
      'Сборка узлов'
    ];
    const values = [0.92, 0.88, 0.85, 0.78, 0.82, 0.74];

    // Draw concentric hex webs
    for (let ring = 1; ring <= 4; ring++) {
      const r = (R * ring) / 4;
      ctx.strokeStyle = ring === 4 ? 'rgba(66, 217, 255, 0.35)' : 'rgba(135, 149, 167, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 - Math.PI / 2;
        const px = cx + r * Math.cos(ang);
        const py = cy + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Spokes & labels
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#F0F4F8';
    ctx.textAlign = 'center';
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3 - Math.PI / 2;
      const px = cx + R * Math.cos(ang);
      const py = cy + R * Math.sin(ang);
      ctx.strokeStyle = 'rgba(135, 149, 167, 0.2)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      const lx = cx + (R + 34) * Math.cos(ang);
      const ly = cy + (R + 22) * Math.sin(ang);
      ctx.fillText(labels[i], lx, ly + 4);
    }

    // Data polygon
    ctx.fillStyle = 'rgba(66, 217, 255, 0.22)';
    ctx.strokeStyle = '#42D9FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3 - Math.PI / 2;
      const r = R * values[i];
      const px = cx + r * Math.cos(ang);
      const py = cy + r * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ==========================================================================
  // INITIALIZE ALL MODULES ON DOM READY
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    runBootSequence(false);
    initHero3D();
    initDashboard();
    initProjectionLab();
    initIsometricBuilder();
    initTrainingModule();
    initChallengesModule();
    initProgressModule();
  });
})();

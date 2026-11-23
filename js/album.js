/* ==========================================================================
   ГРАФИКА LAB — DYNAMIC LIGHT ATMOSPHERES + INTERACTIVE 3D DRAWING ALBUM
   (js/album.js)
   Features:
   1. Dynamic Light Theme Manager (Arctic, Pink Graphite, Fresh Sage, Warm Paper)
      - Smooth 650ms transition across CSS variables, 3D meshes, ortho drawings,
        and album sheets.
      - Respects prefers-reduced-motion & persists to localStorage.
   2. 12 High-Precision Technical Engineering Drawings (GOST 2.305 / 2.307 / 2.317)
      rendered dynamically via crisp SVG vector drafting & computed 3D projections.
   3. Realistic 3D Two-Sided Page-Flip Engine:
      - Open book spread (Left + Right pages) with spine crease, paper grain,
        ESKD stamp frame, and dynamic moving shadow.
      - Physics-inspired 3D leaf rotation around central spine (0deg -> -180deg)
        with front/back faces and bend shading gradient.
      - View modes: ALBUM (2-page spread), SINGLE PAGE, THUMBNAILS drawer.
      - Bookmarks with animation & filter.
      - Interactive Zoom Lightbox (Zoom In, Zoom Out, Reset, Pan drag).
   ========================================================================== */

window.GrafikaAlbumAndTheme = (function () {
  'use strict';

  // ==========================================================================
  // 1. DYNAMIC LIGHT ATMOSPHERE PALETTES (REFINED SOFT PASTEL EDITION)
  // ==========================================================================
  const THEMES = {
    'warm-paper': {
      id: 'warm-paper',
      name: 'Warm Paper',
      ruName: 'Светлая бумага',
      desc: 'Нежная чертёжная бумага, мягкий свет и пастельный уют',
      swatches: ['#FAF7F1', '#FFFDF9', '#F1EAE0', '#E3D0BA', '#B49779'],
      canvas: {
        meshPrimary: '#E3D0BA',
        meshSecondary: '#D6BFA6',
        meshAccent: '#B49779',
        meshSelected: '#B49779',
        edgeVisible: '#625244',
        edgeHidden: '#B49779',
        gridLine: 'rgba(180, 151, 121, 0.13)',
        orthoGrid: 'rgba(180, 151, 121, 0.08)',
        axisX: '#C47A72',
        axisY: '#7A9A78',
        axisZ: '#B49779',
        dimColor: '#B49779',
        paperBg: '#FFFDF9',
        paperGrid: 'rgba(180, 151, 121, 0.08)',
        inkMain: '#625244',
        inkAccent: '#9C8063',
        inkHidden: '#C7AE94',
        inkMuted: '#A09285',
        frameBorder: '#DECBB6'
      }
    },
    'arctic': {
      id: 'arctic',
      name: 'Arctic',
      ruName: 'Мягкая арктика',
      desc: 'Нежный лёд, свет, воздушность и мягкие голубые оттенки',
      swatches: ['#F4F8FA', '#FCFDFE', '#EAF1F5', '#B8D2DF', '#7F9EAF'],
      canvas: {
        meshPrimary: '#CBE0EA',
        meshSecondary: '#B8D2DF',
        meshAccent: '#96B8C8',
        meshSelected: '#7F9EAF',
        edgeVisible: '#425766',
        edgeHidden: '#8FAEC0',
        gridLine: 'rgba(127, 158, 175, 0.13)',
        orthoGrid: 'rgba(127, 158, 175, 0.08)',
        axisX: '#C27D85',
        axisY: '#6E9E8D',
        axisZ: '#7F9EAF',
        dimColor: '#7F9EAF',
        paperBg: '#FCFDFE',
        paperGrid: 'rgba(127, 158, 175, 0.08)',
        inkMain: '#425766',
        inkAccent: '#6E8E9F',
        inkHidden: '#9EBAC9',
        inkMuted: '#8C9CA6',
        frameBorder: '#C6D9E3'
      }
    },
    'pink-graphite': {
      id: 'pink-graphite',
      name: 'Pink Graphite',
      ruName: 'Пудровый розовый',
      desc: 'Пудровый розовый, нежность и мягкая дизайнерская эстетика',
      swatches: ['#FAF5F7', '#FFFCFD', '#F2E7EC', '#DCC1CF', '#AC899D'],
      canvas: {
        meshPrimary: '#E8D3DE',
        meshSecondary: '#DCC1CF',
        meshAccent: '#C4A3B5',
        meshSelected: '#AC899D',
        edgeVisible: '#594853',
        edgeHidden: '#B897AA',
        gridLine: 'rgba(172, 137, 157, 0.13)',
        orthoGrid: 'rgba(172, 137, 157, 0.08)',
        axisX: '#C27A8E',
        axisY: '#769989',
        axisZ: '#AC899D',
        dimColor: '#AC899D',
        paperBg: '#FFFCFD',
        paperGrid: 'rgba(172, 137, 157, 0.08)',
        inkMain: '#594853',
        inkAccent: '#9A788B',
        inkHidden: '#C4A6B7',
        inkMuted: '#A08D98',
        frameBorder: '#DEC8D4'
      }
    },
    'fresh-sage': {
      id: 'fresh-sage',
      name: 'Fresh Sage',
      ruName: 'Пастельная зелень',
      desc: 'Нежный шалфей, свежесть, природа и комфорт',
      swatches: ['#F5F8F3', '#FCFDFB', '#EAF0E7', '#C8D9C3', '#91AA8C'],
      canvas: {
        meshPrimary: '#D5E3D0',
        meshSecondary: '#C8D9C3',
        meshAccent: '#ACC2A6',
        meshSelected: '#91AA8C',
        edgeVisible: '#4B5C49',
        edgeHidden: '#9BB396',
        gridLine: 'rgba(145, 170, 140, 0.13)',
        orthoGrid: 'rgba(145, 170, 140, 0.08)',
        axisX: '#C27F76',
        axisY: '#6E9975',
        axisZ: '#91AA8C',
        dimColor: '#91AA8C',
        paperBg: '#FCFDFB',
        paperGrid: 'rgba(145, 170, 140, 0.08)',
        inkMain: '#4B5C49',
        inkAccent: '#7C9677',
        inkHidden: '#A8BEA3',
        inkMuted: '#929E8D',
        frameBorder: '#C8D8C3'
      }
    }
  };

  let currentThemeId = localStorage.getItem('grafika_theme_v2') || 'warm-paper';
  if (!THEMES[currentThemeId]) currentThemeId = 'warm-paper';

  function getActiveTheme() {
    return THEMES[currentThemeId] || THEMES['warm-paper'];
  }

  function applyTheme(themeId, announce) {
    if (!THEMES[themeId]) return;
    currentThemeId = themeId;
    localStorage.setItem('grafika_theme_v2', themeId);

    document.documentElement.setAttribute('data-theme', themeId);

    // Sync all theme switcher buttons & radio items
    document.querySelectorAll('[data-theme-pick]').forEach(btn => {
      const active = btn.dataset.themePick === themeId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    const labelEls = document.querySelectorAll('.current-theme-label');
    labelEls.forEach(el => {
      el.textContent = THEMES[themeId].name;
    });

    // Trigger redraw of 3D viewports, ortho canvases, and drawing album
    window.dispatchEvent(new CustomEvent('grafika:themechange', { detail: THEMES[themeId] }));
    renderAlbumView();

    if (announce && window.GrafikaShowToast) {
      window.GrafikaShowToast(`Атмосфера: ${THEMES[themeId].name} (${THEMES[themeId].ruName})`);
    }
  }

  // ==========================================================================
  // 2. 12 HIGH-PRECISION TECHNICAL DRAWINGS FOR THE ALBUM
  // ==========================================================================
  const ALBUM_PAGES = [
    {
      page: 1,
      code: 'DRAWING 01',
      gost: 'ГОСТ 2.303-68 // ЛИНИИ И СОПРЯЖЕНИЯ',
      title: 'ВНЕШНЕЕ И ВНУТРЕННЕЕ СОПРЯЖЕНИЕ ДУГ',
      level: 'EASY',
      desc: 'Построение плавных переходов (сопряжений) между двумя окружностями заданными радиусами R₁, R₂ и сопрягающей дугой R.',
      dims: 'R₁=28 • R₂=20 • R=42 мм',
      type: 'fillet-sheet'
    },
    {
      page: 2,
      code: 'DRAWING 02',
      gost: 'ГОСТ 2.305-2008 // МЕТОД МОНЖА',
      title: 'КОМПЛЕКСНЫЙ ЭПЮР СТУПЕНЧАТОЙ ОПОРЫ',
      level: 'EASY',
      desc: 'Три проекции (фронтальная V, горизонтальная H, профильная W) с постоянной прямой чертежа под углом 45° и линиями связи.',
      dims: '80 × 60 × 60 мм',
      type: 'epure-model',
      modelIdx: 0
    },
    {
      page: 3,
      code: 'DRAWING 03',
      gost: 'ГОСТ 2.317-2011 // АКСОНОМЕТРИЯ',
      title: 'ИЗОМЕТРИЧЕСКАЯ ПРОЕКЦИЯ ОПОРЫ С ПАЗОМ',
      level: 'MEDIUM',
      desc: 'Прямоугольная изометрия в осях X, Y, Z под углом 120° с выносными размерными линиями и штриховым невидимым контуром.',
      dims: 'Масштаб 1:1 • Изометрия',
      type: 'iso-model',
      modelIdx: 0
    },
    {
      page: 4,
      code: 'DRAWING 04',
      gost: 'ГОСТ 2.305-2008 // ДЕТАЛЬ С ОТВЕРСТИЕМ',
      title: 'КРОНШТЕЙН С Т-ОБРАЗНЫМ ВЫРЕЗОМ И КАНАЛОМ',
      level: 'MEDIUM',
      desc: 'Ортогональные проекции детали с внутренним сквозным призматическим отверстием. Чтение видимых и скрытых штриховых кромок.',
      dims: '100 × 60 × 80 мм',
      type: 'epure-model',
      modelIdx: 1
    },
    {
      page: 5,
      code: 'DRAWING 05',
      gost: 'ГОСТ 2.307-2011 // ТЕЛА ВРАЩЕНИЯ',
      title: 'ЦИЛИНДРИЧЕСКАЯ ВТУЛКА С ОПОРНЫМ ФЛАНЦЕМ',
      level: 'MEDIUM',
      desc: 'Сочетание цилиндрических поверхностей вращения и призматического основания. Нанесение знаков диаметра Ø и осевых штрихпунктирных линий.',
      dims: 'Ø90 × Ø56 × 75 мм',
      type: 'epure-model',
      modelIdx: 2
    },
    {
      page: 6,
      code: 'DRAWING 06',
      gost: 'ГОСТ 2.317-2011 // ОВАЛЫ В ИЗОМЕТРИИ',
      title: 'ПОСТРОЕНИЕ ИЗОМЕТРИЧЕСКОГО ОВАЛА И ЦИЛИНДРА',
      level: 'MEDIUM',
      desc: 'Четырёхцентровой способ вычерчивания эллипса (овала) в изометрическом ромбе со стороной D и построение тела вращения.',
      dims: 'Ø70 × 65 мм • Угол 120°',
      type: 'iso-oval-sheet'
    },
    {
      page: 7,
      code: 'DRAWING 07',
      gost: 'ГОСТ 2.305-2008 // НАКЛОННЫЕ ГРАНИ',
      title: 'НАПРАВЛЯЮЩАЯ СТАНКА С РЕБРОМ ЖЁСТКОСТИ',
      level: 'HARD',
      desc: 'Построение проекций наклонного ребра жёсткости. Анализ проекционного укорочения наклонной грани на горизонтальной и профильной плоскостях.',
      dims: '96 × 64 × 72 мм',
      type: 'epure-model',
      modelIdx: 3
    },
    {
      page: 8,
      code: 'DRAWING 08',
      gost: 'ГОСТ 2.305-2008 // РАЗРЕЗЫ И СЕЧЕНИЯ',
      title: 'ФРОНТАЛЬНЫЙ РАЗРЕЗ КОРПУСА ПОДШИПНИКА А-А',
      level: 'HARD',
      desc: 'Соединение половины вида и половины фронтального разреза со штриховкой металла под углом 45° по ГОСТ 2.306-68.',
      dims: '90 × 90 × 90 мм • Разрез А-А',
      type: 'section-sheet'
    },
    {
      page: 9,
      code: 'DRAWING 09',
      gost: 'ГОСТ 2.317-2011 // ПРОСТРАНСТВЕННЫЙ КАРКАС',
      title: 'КОРПУС С ПЕРЕСЕКАЮЩИМИСЯ СКВОЗНЫМИ ОКНАМИ',
      level: 'HARD',
      desc: 'Аксонометрический чертёж полого корпуса с взаимно перпендикулярными каналами по осям X, Y и вертикальным колодцем Z.',
      dims: '90 × 90 × 90 мм',
      type: 'iso-model',
      modelIdx: 4
    },
    {
      page: 10,
      code: 'DRAWING 10',
      gost: 'ГОСТ 2.307-2011 // РАЗМЕРНЫЕ ЦЕПИ',
      title: 'ПОЛЗУН СТАНКА (КОМПЛЕКСНЫЙ ЧЕРТЁЖ)',
      level: 'HARD',
      desc: 'Комбинированная деталь с направляющим пазом, двухскатной призмой и цилиндрической цапфой. Полная размерная схема.',
      dims: '110 × 75 × 85 мм',
      type: 'epure-model',
      modelIdx: 5
    },
    {
      page: 11,
      code: 'DRAWING 11',
      gost: 'ГОСТ 2.317-2011 // КОМБИНИРОВАННЫЕ ТЕЛА',
      title: 'ИЗОМЕТРИЯ МАШИНОСТРОИТЕЛЬНОГО ПОЛЗУНА',
      level: 'EXPERT',
      desc: 'Наглядное объёмное изображение сложной детали с выявлением видимых и скрытых контуров всех конструктивных элементов.',
      dims: '110 × 75 × 85 мм • М 1:1',
      type: 'iso-model',
      modelIdx: 5
    },
    {
      page: 12,
      code: 'DRAWING 12',
      gost: 'ГОСТ 2.109-73 // СБОРОЧНЫЙ ЧЕРТЁЖ',
      title: 'МНОГОКОМПОНЕНТНЫЙ СБОРОЧНЫЙ УЗЕЛ CAD-MECH-09',
      level: 'EXPERT',
      desc: 'Итоговый сборочный узел лаборатории: базовый корпус, цилиндрическая башня, фланцы, клиновое ребро и направляющий штифт.',
      dims: '150 × 118 × 112 мм • СБ',
      type: 'assembly-sheet'
    }
  ];

  // ==========================================================================
  // 3. SVG TECHNICAL DRAFTING GENERATOR FOR EACH ALBUM PAGE
  // ==========================================================================
  function generateDrawingSVG(pageObj, forZoom) {
    const theme = getActiveTheme().canvas;
    const W = 500;
    const H = 350;
    const ink = theme.inkMain;
    const acc = theme.inkAccent;
    const hid = theme.inkHidden;
    const mut = theme.inkMuted;
    const grid = theme.paperGrid;

    let body = '';

    // Background technical millimeter grid
    for (let x = 20; x < W; x += 20) {
      body += `<line x1="${x}" y1="12" x2="${x}" y2="${H - 12}" stroke="${grid}" stroke-width="0.8"/>`;
    }
    for (let y = 20; y < H; y += 20) {
      body += `<line x1="12" y1="${y}" x2="${W - 12}" y2="${y}" stroke="${grid}" stroke-width="0.8"/>`;
    }

    // Center symmetry axes helper
    const drawCrosshair = (cx, cy, r) => `
      <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${mut}" stroke-width="0.9" stroke-dasharray="10,3,2,3"/>
      <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${mut}" stroke-width="0.9" stroke-dasharray="10,3,2,3"/>
    `;

    // Dimension arrow helper
    const drawDim = (x1, y1, x2, y2, label, offset) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len * offset;
      const ny = dx / len * offset;
      const ax = x1 + nx, ay = y1 + ny;
      const bx = x2 + nx, by = y2 + ny;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      return `
        <line x1="${x1}" y1="${y1}" x2="${ax}" y2="${ay}" stroke="${acc}" stroke-width="0.9"/>
        <line x1="${x2}" y1="${y2}" x2="${bx}" y2="${by}" stroke="${acc}" stroke-width="0.9"/>
        <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${acc}" stroke-width="1.1"/>
        <circle cx="${ax}" cy="${ay}" r="2" fill="${acc}"/>
        <circle cx="${bx}" cy="${by}" r="2" fill="${acc}"/>
        <rect x="${mx - 22}" y="${my - 8}" width="44" height="15" rx="3" fill="${theme.paperBg}" stroke="${acc}" stroke-width="0.8"/>
        <text x="${mx}" y="${my + 3}" text-anchor="middle" fill="${ink}" font-family="JetBrains Mono, monospace" font-size="9.5" font-weight="700">${label}</text>
      `;
    };

    if (pageObj.type === 'fillet-sheet') {
      const O1 = { x: 165, y: 215, r: 54 };
      const O2 = { x: 345, y: 215, r: 40 };
      const R = 88;
      const rA = O1.r + R;
      const rB = O2.r + R;
      const d = O2.x - O1.x;
      const a = (rA * rA - rB * rB + d * d) / (2 * d);
      const O3 = { x: O1.x + a, y: O1.y - Math.sqrt(Math.max(0, rA * rA - a * a)) };
      const ang1 = Math.atan2(O1.y - O3.y, O1.x - O3.x);
      const ang2 = Math.atan2(O2.y - O3.y, O2.x - O3.x);
      const K1 = { x: O3.x + R * Math.cos(ang1), y: O3.y + R * Math.sin(ang1) };
      const K2 = { x: O3.x + R * Math.cos(ang2), y: O3.y + R * Math.sin(ang2) };

      body += drawCrosshair(O1.x, O1.y, 72);
      body += drawCrosshair(O2.x, O2.y, 58);
      body += `<circle cx="${O1.x}" cy="${O1.y}" r="${O1.r}" fill="none" stroke="${ink}" stroke-width="2.2"/>`;
      body += `<circle cx="${O2.x}" cy="${O2.y}" r="${O2.r}" fill="none" stroke="${ink}" stroke-width="2.2"/>`;
      // Construction rays
      body += `<line x1="${O3.x}" y1="${O3.y}" x2="${O1.x}" y2="${O1.y}" stroke="${hid}" stroke-width="1.1" stroke-dasharray="5,4"/>`;
      body += `<line x1="${O3.x}" y1="${O3.y}" x2="${O2.x}" y2="${O2.y}" stroke="${hid}" stroke-width="1.1" stroke-dasharray="5,4"/>`;
      // Auxiliary arcs
      body += `<circle cx="${O3.x}" cy="${O3.y}" r="3.5" fill="${acc}"/>`;
      body += `<text x="${O3.x}" y="${O3.y - 10}" text-anchor="middle" fill="${acc}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="700">O₃ (R₁+R, R₂+R)</text>`;
      // Tangent fillet arc SVG path
      body += `<path d="M ${K2.x.toFixed(1)} ${K2.y.toFixed(1)} A ${R} ${R} 0 0 1 ${K1.x.toFixed(1)} ${K1.y.toFixed(1)}" fill="none" stroke="${acc}" stroke-width="2.8"/>`;
      body += `<circle cx="${K1.x}" cy="${K1.y}" r="3.5" fill="${ink}"/>`;
      body += `<circle cx="${K2.x}" cy="${K2.y}" r="3.5" fill="${ink}"/>`;
      body += `<text x="${K1.x - 16}" y="${K1.y - 6}" fill="${ink}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">K₁</text>`;
      body += `<text x="${K2.x + 8}" y="${K2.y - 6}" fill="${ink}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">K₂</text>`;
      body += drawDim(O1.x, O1.y + 54, O2.x, O2.y + 54, '180 мм', 28);
    } else if (pageObj.type === 'iso-oval-sheet') {
      const cx = 250, cy = 145;
      const R = 54;
      const cos30 = Math.cos(Math.PI / 6);
      const A = { x: cx - R * 2 * cos30, y: cy };
      const C = { x: cx + R * 2 * cos30, y: cy };
      const B = { x: cx, y: cy - R };
      const D = { x: cx, y: cy + R };
      const m1 = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const m2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
      const m3 = { x: (A.x + D.x) / 2, y: (A.y + D.y) / 2 };
      const m4 = { x: (D.x + C.x) / 2, y: (D.y + C.y) / 2 };
      const rx = R * Math.sqrt(1.5);
      const ry = R * Math.sqrt(0.5);
      const hCyl = 82;

      // Isometric axes 120 deg
      body += `<line x1="${cx}" y1="30" x2="${cx}" y2="310" stroke="${mut}" stroke-width="1" stroke-dasharray="10,3,2,3"/>`;
      body += `<line x1="${cx - 140 * cos30}" y1="${cy - 70}" x2="${cx + 140 * cos30}" y2="${cy + 70}" stroke="${mut}" stroke-width="1" stroke-dasharray="10,3,2,3"/>`;
      body += `<line x1="${cx + 140 * cos30}" y1="${cy - 70}" x2="${cx - 140 * cos30}" y2="${cy + 70}" stroke="${mut}" stroke-width="1" stroke-dasharray="10,3,2,3"/>`;
      // Isometric rhombus
      body += `<polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}" fill="none" stroke="${hid}" stroke-width="1.2" stroke-dasharray="4,3"/>`;
      // 4-center rays
      body += `<line x1="${D.x}" y1="${D.y}" x2="${m1.x}" y2="${m1.y}" stroke="${acc}" stroke-width="1" stroke-dasharray="3,3"/>`;
      body += `<line x1="${D.x}" y1="${D.y}" x2="${m2.x}" y2="${m2.y}" stroke="${acc}" stroke-width="1" stroke-dasharray="3,3"/>`;
      body += `<line x1="${B.x}" y1="${B.y}" x2="${m3.x}" y2="${m3.y}" stroke="${acc}" stroke-width="1" stroke-dasharray="3,3"/>`;
      body += `<line x1="${B.x}" y1="${B.y}" x2="${m4.x}" y2="${m4.y}" stroke="${acc}" stroke-width="1" stroke-dasharray="3,3"/>`;
      // Top & bottom ellipses + vertical cylinder walls
      body += `<ellipse cx="${cx}" cy="${cy + hCyl}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${hid}" stroke-width="1.3" stroke-dasharray="5,4"/>`;
      body += `<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * 0.48).toFixed(1)}" ry="${(ry * 0.48).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1.8"/>`;
      body += `<path d="M ${(cx - rx).toFixed(1)} ${cy} L ${(cx - rx).toFixed(1)} ${cy + hCyl} A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(cx + rx).toFixed(1)} ${cy + hCyl} L ${(cx + rx).toFixed(1)} ${cy}" fill="none" stroke="${ink}" stroke-width="2.3"/>`;
      body += drawDim(cx - rx, cy + hCyl + 18, cx + rx, cy + hCyl + 18, 'Ø70 мм', 24);
    } else if (pageObj.type === 'section-sheet') {
      // Front half-view / half-section A-A with 45-deg hatching
      const cx = 250, cy = 175;
      body += `
        <defs>
          <pattern id="hatch45" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="${acc}" stroke-width="1.1" />
          </pattern>
        </defs>
      `;
      body += drawCrosshair(cx, cy, 135);
      // Left half: external view
      body += `<path d="M ${cx} ${cy - 85} L ${cx - 55} ${cy - 85} L ${cx - 55} ${cy - 30} L ${cx - 110} ${cy - 30} L ${cx - 110} ${cy + 75} L ${cx} ${cy + 75}" fill="none" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<line x1="${cx - 110}" y1="${cy + 35}" x2="${cx}" y2="${cy + 35}" stroke="${ink}" stroke-width="1.6"/>`;
      // Hidden bore in left half
      body += `<line x1="${cx - 32}" y1="${cy - 85}" x2="${cx - 32}" y2="${cy + 75}" stroke="${hid}" stroke-width="1.3" stroke-dasharray="6,4"/>`;
      body += `<line x1="${cx - 82}" y1="${cy + 35}" x2="${cx - 82}" y2="${cy + 75}" stroke="${hid}" stroke-width="1.3" stroke-dasharray="6,4"/>`;

      // Right half: Section A-A with hatching polygons
      body += `<polygon points="${cx + 32},${cy - 85} ${cx + 55},${cy - 85} ${cx + 55},${cy - 30} ${cx + 110},${cy - 30} ${cx + 110},${cy + 35} ${cx + 82},${cy + 35} ${cx + 82},${cy + 75} ${cx + 32},${cy + 75}" fill="url(#hatch45)" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<line x1="${cx}" y1="${cy - 85}" x2="${cx + 32}" y2="${cy - 85}" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<line x1="${cx}" y1="${cy + 75}" x2="${cx + 32}" y2="${cy + 75}" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<line x1="${cx + 82}" y1="${cy + 75}" x2="${cx + 110}" y2="${cy + 75}" stroke="${ink}" stroke-width="2.3"/>`;
      body += `<line x1="${cx + 110}" y1="${cy + 35}" x2="${cx + 110}" y2="${cy + 75}" stroke="${ink}" stroke-width="2.3"/>`;

      body += `<text x="${cx - 65}" y="${cy - 102}" text-anchor="middle" fill="${mut}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">ВИД СПЕРЕДИ</text>`;
      body += `<text x="${cx + 68}" y="${cy - 102}" text-anchor="middle" fill="${acc}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">РАЗРЕЗ А-А (ГОСТ 2.306)</text>`;
      body += drawDim(cx - 110, cy + 75, cx + 110, cy + 75, 'Ø140 мм', 28);
      body += drawDim(cx - 32, cy - 85, cx + 32, cy - 85, 'Ø42', -20);
    } else if (pageObj.type === 'epure-model') {
      // Compute live exact orthographic views (V, H, W) + 45° Monge lines from our 3D model!
      const modelDef = window.GrafikaModels.PROJECTION_MODELS[pageObj.modelIdx || 0];
      const mesh = modelDef.build();
      const ox = 250, oy = 175;
      const sc = 0.88;

      // Monge axes & 45-deg bisector
      body += `<line x1="24" y1="${oy}" x2="${W - 24}" y2="${oy}" stroke="${acc}" stroke-width="1.2"/>`;
      body += `<line x1="${ox}" y1="20" x2="${ox}" y2="${H - 20}" stroke="${acc}" stroke-width="1.2"/>`;
      body += `<line x1="${ox}" y1="${oy}" x2="${ox + 150}" y2="${oy + 150}" stroke="${hid}" stroke-width="1.2"/>`;
      body += `<text x="34" y="34" fill="${acc}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">V (СПЕРЕДИ)</text>`;
      body += `<text x="${W - 95}" y="34" fill="${acc}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">W (СЛЕВА)</text>`;
      body += `<text x="34" y="${H - 22}" fill="${acc}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">H (СВЕРХУ)</text>`;
      body += `<text x="${ox + 128}" y="${oy + 145}" fill="${hid}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">45°</text>`;

      const vCx = ox - 98, vCy = oy - 74;
      const hCx = ox - 98, hCy = oy + 78;
      const wCx = ox + 78, wCy = oy - 74;

      // Bounding projection connection rays
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
      mesh.vertices.forEach(v => {
        minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
        minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
        minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
      });

      [minX, maxX].forEach(xv => {
        body += `<line x1="${(vCx + xv * sc).toFixed(1)}" y1="${(vCy - minZ * sc).toFixed(1)}" x2="${(hCx + xv * sc).toFixed(1)}" y2="${(hCy + maxY * sc).toFixed(1)}" stroke="${hid}" stroke-width="0.85" stroke-dasharray="3,3"/>`;
      });
      [minZ, maxZ].forEach(zv => {
        body += `<line x1="${(vCx + maxX * sc).toFixed(1)}" y1="${(vCy - zv * sc).toFixed(1)}" x2="${(wCx + maxY * sc).toFixed(1)}" y2="${(wCy - zv * sc).toFixed(1)}" stroke="${hid}" stroke-width="0.85" stroke-dasharray="3,3"/>`;
      });
      [minY, maxY].forEach(yv => {
        const ry = hCy + yv * sc;
        const tx = ox + (ry - oy);
        body += `<polyline points="${(hCx + maxX * sc).toFixed(1)},${ry.toFixed(1)} ${tx.toFixed(1)},${ry.toFixed(1)} ${tx.toFixed(1)},${(wCy - maxZ * sc).toFixed(1)}" fill="none" stroke="${hid}" stroke-width="0.85" stroke-dasharray="3,3"/>`;
      });

      const renderOrthoGroup = (viewType, cx, cy) => {
        const { visibleSegments, hiddenSegments } = window.GrafikaEngine3D.computeOrthoDrawing(mesh, viewType);
        hiddenSegments.forEach(s => {
          body += `<line x1="${(cx + s.u1 * sc).toFixed(1)}" y1="${(cy + s.v1 * sc).toFixed(1)}" x2="${(cx + s.u2 * sc).toFixed(1)}" y2="${(cy + s.v2 * sc).toFixed(1)}" stroke="${hid}" stroke-width="1.3" stroke-dasharray="5,3"/>`;
        });
        visibleSegments.forEach(s => {
          body += `<line x1="${(cx + s.u1 * sc).toFixed(1)}" y1="${(cy + s.v1 * sc).toFixed(1)}" x2="${(cx + s.u2 * sc).toFixed(1)}" y2="${(cy + s.v2 * sc).toFixed(1)}" stroke="${ink}" stroke-width="2.1" stroke-linecap="round"/>`;
        });
      };

      renderOrthoGroup('front', vCx, vCy);
      renderOrthoGroup('top', hCx, hCy);
      renderOrthoGroup('left', wCx, wCy);
    } else if (pageObj.type === 'iso-model' || pageObj.type === 'assembly-sheet') {
      // Render crisp isometric 3D vector projection of the mesh with shaded faces & hidden dashed edges
      const mesh = pageObj.type === 'assembly-sheet'
        ? window.GrafikaModels.createHeroAssembly()
        : window.GrafikaModels.PROJECTION_MODELS[pageObj.modelIdx || 0].build();

      const cx = 250, cy = 180;
      const yaw = -0.72, pitch = 0.54;
      const sc = pageObj.type === 'assembly-sheet' ? 1.55 : 1.75;

      // Isometric axes
      const orig = window.GrafikaEngine3D.transformPoint([0, 0, 0], yaw, pitch, sc);
      const axList = [
        { lbl: 'X', pt: [88, 0, 0], col: theme.axisX },
        { lbl: 'Y', pt: [0, 88, 0], col: theme.axisY },
        { lbl: 'Z', pt: [0, 0, 82], col: theme.axisZ }
      ];
      axList.forEach(a => {
        const pEnd = window.GrafikaEngine3D.transformPoint(a.pt, yaw, pitch, sc);
        body += `<line x1="${(cx + orig.sx).toFixed(1)}" y1="${(cy + orig.sy).toFixed(1)}" x2="${(cx + pEnd.sx).toFixed(1)}" y2="${(cy + pEnd.sy).toFixed(1)}" stroke="${a.col}" stroke-width="1.2" stroke-dasharray="8,3,2,3"/>`;
        body += `<text x="${(cx + pEnd.sx + 6).toFixed(1)}" y="${(cy + pEnd.sy + 4).toFixed(1)}" fill="${a.col}" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">${a.lbl}</text>`;
      });

      // Prepare painter's sorted polygons
      const lightDir = window.GrafikaModels.vecNorm([-0.45, -0.65, 0.62]);
      const cosZ = Math.cos(yaw), sinZ = Math.sin(yaw);
      const cosX = Math.cos(pitch), sinX = Math.sin(pitch);

      const pFaces = mesh.faces.map(f => {
        const pts = f.idx.map(vi => window.GrafikaEngine3D.transformPoint(mesh.vertices[vi], yaw, pitch, sc));
        let avgD = 0;
        pts.forEach(p => { avgD += p.depth; });
        avgD /= pts.length;
        const n = f.normal;
        const y1 = n[0] * sinZ + n[1] * cosZ;
        const nz = y1 * cosX + n[2] * sinX;
        const isFront = nz < 0.02;
        const diff = Math.max(0, window.GrafikaModels.vecDot(n, lightDir));
        return { f, pts, avgD, isFront, diff };
      });

      const sorted = pFaces.slice().sort((a, b) => b.avgD - a.avgD);

      // Hidden crease edges first
      mesh.edges.forEach(e => {
        if (!e.isCrease) return;
        const f0 = pFaces[e.faces[0]];
        const f1 = e.faces[1] !== undefined ? pFaces[e.faces[1]] : null;
        if (!f0.isFront && (!f1 || !f1.isFront)) {
          const pA = window.GrafikaEngine3D.transformPoint(mesh.vertices[e.a], yaw, pitch, sc);
          const pB = window.GrafikaEngine3D.transformPoint(mesh.vertices[e.b], yaw, pitch, sc);
          body += `<line x1="${(cx + pA.sx).toFixed(1)}" y1="${(cy + pA.sy).toFixed(1)}" x2="${(cx + pB.sx).toFixed(1)}" y2="${(cy + pB.sy).toFixed(1)}" stroke="${hid}" stroke-width="1.15" stroke-dasharray="5,4"/>`;
        }
      });

      // Shaded front faces
      sorted.forEach(pf => {
        if (!pf.isFront) return;
        const polyStr = pf.pts.map(p => `${(cx + p.sx).toFixed(1)},${(cy + p.sy).toFixed(1)}`).join(' ');
        const fillOp = (0.14 + pf.diff * 0.22).toFixed(2);
        body += `<polygon points="${polyStr}" fill="${acc}" fill-opacity="${fillOp}" stroke="none"/>`;
      });

      // Visible sharp contour edges
      mesh.edges.forEach(e => {
        if (!e.isCrease) return;
        const f0 = pFaces[e.faces[0]];
        const f1 = e.faces[1] !== undefined ? pFaces[e.faces[1]] : null;
        if (f0.isFront || (f1 && f1.isFront)) {
          const pA = window.GrafikaEngine3D.transformPoint(mesh.vertices[e.a], yaw, pitch, sc);
          const pB = window.GrafikaEngine3D.transformPoint(mesh.vertices[e.b], yaw, pitch, sc);
          body += `<line x1="${(cx + pA.sx).toFixed(1)}" y1="${(cy + pA.sy).toFixed(1)}" x2="${(cx + pB.sx).toFixed(1)}" y2="${(cy + pB.sy).toFixed(1)}" stroke="${ink}" stroke-width="1.9" stroke-linecap="round"/>`;
        }
      });
    }

    // Progressive stage reveal overlay if user is in step-by-step drafting mode (stages 1..3)
    const stage = forZoom ? 4 : (albumState.buildStage || 4);
    const clipId = `stageClip_${pageObj.page}_${forZoom ? 'z' : 'p'}`;
    const stageWidths = { 1: 165, 2: 315, 3: 425, 4: W };
    const clipW = stageWidths[stage] || W;
    const hideDimStyle = (!albumState.showDims && !forZoom) ? 'opacity:0;' : '';

    return `
      <svg viewBox="0 0 ${W} ${H}" class="sheet-drawing-svg ${forZoom ? 'zoom-svg' : ''}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="${clipId}">
            <rect x="0" y="0" width="${clipW}" height="${H}"/>
          </clipPath>
        </defs>
        <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${theme.frameBorder}" stroke-width="1.2"/>
        <g clip-path="url(#${clipId})">${body}</g>
        ${stage < 4 ? `<line x1="${clipW}" y1="10" x2="${clipW}" y2="${H - 10}" stroke="${acc}" stroke-width="1.4" stroke-dasharray="5,4"/>` : ''}
        <g style="${hideDimStyle}"></g>
      </svg>
    `;
  }

  // Generate complete HTML for a single engineering sheet (Header + Drawing + ESKD Title Block Stamp)
  function renderSheetHTML(pageObj) {
    if (!pageObj) {
      return `<div class="album-sheet-inner empty-sheet"></div>`;
    }
    const isBookmarked = albumState.bookmarks.includes(pageObj.page);
    const pageNumStr = String(pageObj.page).padStart(2, '0');
    const totalStr = String(ALBUM_PAGES.length).padStart(2, '0');

    return `
      <div class="album-sheet-inner" data-sheet-page="${pageObj.page}">
        <div class="sheet-frame-outer">
          <!-- Sheet Top Meta Header -->
          <div class="sheet-top-bar">
            <div class="sheet-code-group">
              <span class="sheet-code">${pageObj.code}</span>
              <span class="sheet-gost">${pageObj.gost}</span>
            </div>
            <div class="sheet-actions-group">
              <span class="sheet-level-pill level-${pageObj.level.toLowerCase()}">УРОВЕНЬ: ${pageObj.level}</span>
              <button class="sheet-icon-btn bookmark-toggle-btn ${isBookmarked ? 'active' : ''}" data-bm-page="${pageObj.page}" title="Сохранить лист в закладки">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button class="sheet-icon-btn zoom-open-btn" data-zoom-page="${pageObj.page}" title="Увеличить чертёж (Zoom)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Sheet Title & Description -->
          <div class="sheet-heading-block">
            <h3 class="sheet-title">${pageObj.title}</h3>
            <p class="sheet-desc">${pageObj.desc}</p>
          </div>

          <!-- Interactive Drawing Vector Canvas (Clickable for Zoom) -->
          <div class="sheet-drawing-stage" data-zoom-page="${pageObj.page}" title="Нажмите для увеличения чертежа">
            ${generateDrawingSVG(pageObj, false)}
            <span class="sheet-zoom-hint">🔍 Нажмите для детального увеличения</span>
          </div>

          <!-- Bottom ESKD Engineering Title Block (Штамп ГОСТ 2.104-2006) -->
          <div class="sheet-eskd-stamp">
            <div class="stamp-cell stamp-inst">
              <span class="stamp-lbl">КАФЕДРА // ЛАБОРАТОРИЯ</span>
              <strong>ГРАФИКА LAB • ЕСКД</strong>
            </div>
            <div class="stamp-cell stamp-dims">
              <span class="stamp-lbl">ГАБАРИТЫ / ПАРАМЕТРЫ</span>
              <strong>${pageObj.dims}</strong>
            </div>
            <div class="stamp-cell stamp-page">
              <span class="stamp-lbl">ЛИСТ</span>
              <strong>${pageNumStr} / ${totalStr}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 4. INTERACTIVE 3D PAGE-FLIP ALBUM CONTROLLER
  // ==========================================================================
  const albumState = {
    mode: 'album', // 'album' (2-page spread) | 'single' (1 page) | 'thumbnails'
    leftPageIdx: 0, // 0, 2, 4, 6, 8, 10 in spread mode; any 0..11 in single mode
    isFlipping: false,
    buildStage: 4, // 1..4 step-by-step construction stage
    showDims: true,
    bookmarks: JSON.parse(localStorage.getItem('grafika_album_bookmarks') || '[1, 4]'),
    onlyBookmarked: false,
    zoomPage: null,
    zoomScale: 1.0,
    zoomPanX: 0,
    zoomPanY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0
  };

  function saveBookmarks() {
    localStorage.setItem('grafika_album_bookmarks', JSON.stringify(albumState.bookmarks));
  }

  function updateAlbumPaginationReadout() {
    const total = ALBUM_PAGES.length;
    const totalStr = String(total).padStart(2, '0');
    const readout = document.getElementById('album-page-counter');
    const prevBtn = document.getElementById('album-prev-btn');
    const nextBtn = document.getElementById('album-next-btn');
    const prevFloat = document.getElementById('album-arrow-left');
    const nextFloat = document.getElementById('album-arrow-right');

    let currentStr = '';
    let atStart = false;
    let atEnd = false;

    if (albumState.mode === 'single') {
      const pNum = albumState.leftPageIdx + 1;
      currentStr = `${String(pNum).padStart(2, '0')} / ${totalStr}`;
      atStart = albumState.leftPageIdx <= 0;
      atEnd = albumState.leftPageIdx >= total - 1;
    } else {
      const pLeft = albumState.leftPageIdx + 1;
      const pRight = Math.min(total, albumState.leftPageIdx + 2);
      currentStr = `${String(pLeft).padStart(2, '0')}–${String(pRight).padStart(2, '0')} / ${totalStr}`;
      atStart = albumState.leftPageIdx <= 0;
      atEnd = albumState.leftPageIdx >= total - 2;
    }

    if (readout) readout.textContent = currentStr;
    [prevBtn, prevFloat].forEach(b => { if (b) b.disabled = atStart || albumState.isFlipping; });
    [nextBtn, nextFloat].forEach(b => { if (b) b.disabled = atEnd || albumState.isFlipping; });

    // Bookmark count pill
    const bmCount = document.getElementById('album-bm-count');
    if (bmCount) bmCount.textContent = albumState.bookmarks.length;
  }

  function renderAlbumView() {
    const bookSpread = document.getElementById('album-book-spread');
    const singleWrap = document.getElementById('album-single-wrap');
    const thumbWrap = document.getElementById('album-thumbnails-wrap');
    const stageArea = document.getElementById('album-stage-area');
    if (!bookSpread || !singleWrap || !thumbWrap) return;

    // Sync view mode buttons
    document.querySelectorAll('[data-album-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.albumMode === albumState.mode);
    });

    if (albumState.mode === 'thumbnails') {
      if (stageArea) stageArea.style.display = 'none';
      thumbWrap.style.display = 'block';
      renderThumbnailsGrid();
      updateAlbumPaginationReadout();
      return;
    }

    if (stageArea) stageArea.style.display = 'flex';
    thumbWrap.style.display = 'none';

    if (albumState.mode === 'single') {
      bookSpread.style.display = 'none';
      singleWrap.style.display = 'block';
      const pageObj = ALBUM_PAGES[albumState.leftPageIdx];
      singleWrap.innerHTML = `<div class="single-sheet-card">${renderSheetHTML(pageObj)}</div>`;
      bindSheetInteractions(singleWrap);
    } else {
      // Ensure even index for 2-page spread
      if (albumState.leftPageIdx % 2 !== 0) {
        albumState.leftPageIdx = Math.max(0, albumState.leftPageIdx - 1);
      }
      bookSpread.style.display = 'grid';
      singleWrap.style.display = 'none';

      const leftSlot = document.getElementById('album-page-left');
      const rightSlot = document.getElementById('album-page-right');
      const flipLeaf = document.getElementById('album-flip-leaf');

      if (leftSlot) leftSlot.innerHTML = renderSheetHTML(ALBUM_PAGES[albumState.leftPageIdx]);
      if (rightSlot) rightSlot.innerHTML = renderSheetHTML(ALBUM_PAGES[albumState.leftPageIdx + 1]);
      if (flipLeaf && !albumState.isFlipping) {
        flipLeaf.className = 'album-flip-leaf';
        flipLeaf.innerHTML = '';
      }

      bindSheetInteractions(bookSpread);
    }

    updateAlbumPaginationReadout();
  }

  // Physics-inspired 3D Page Flip Animation (Right or Left across central spine)
  function flipAlbumPage(direction) {
    if (albumState.isFlipping) return;
    const total = ALBUM_PAGES.length;

    if (albumState.mode === 'thumbnails') {
      albumState.mode = 'album';
    }

    // In Single Page mode: smooth 3D card turn
    if (albumState.mode === 'single') {
      const nextIdx = albumState.leftPageIdx + (direction === 'next' ? 1 : -1);
      if (nextIdx < 0 || nextIdx >= total) return;
      const singleWrap = document.getElementById('album-single-wrap');
      albumState.isFlipping = true;
      updateAlbumPaginationReadout();

      if (singleWrap) {
        singleWrap.classList.add(direction === 'next' ? 'single-flip-next' : 'single-flip-prev');
      }
      setTimeout(() => {
        albumState.leftPageIdx = nextIdx;
        renderAlbumView();
        if (singleWrap) {
          singleWrap.classList.remove('single-flip-next', 'single-flip-prev');
        }
        albumState.isFlipping = false;
        updateAlbumPaginationReadout();
      }, 420);
      return;
    }

    // In 2-Page Spread ALBUM mode: realistic 3D two-sided leaf flip around spine
    const step = direction === 'next' ? 2 : -2;
    const targetLeftIdx = albumState.leftPageIdx + step;
    if (targetLeftIdx < 0 || targetLeftIdx >= total) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      albumState.leftPageIdx = targetLeftIdx;
      renderAlbumView();
      return;
    }

    const leftSlot = document.getElementById('album-page-left');
    const rightSlot = document.getElementById('album-page-right');
    const flipLeaf = document.getElementById('album-flip-leaf');
    const bookSpread = document.getElementById('album-book-spread');

    if (!leftSlot || !rightSlot || !flipLeaf || !bookSpread) return;

    albumState.isFlipping = true;
    updateAlbumPaginationReadout();

    if (direction === 'next') {
      // Flipping forward (Right page lifts and rotates -180deg over to the Left side):
      // - Front of flipping leaf = current right page (leftPageIdx + 1)
      // - Back of flipping leaf = new left page (targetLeftIdx)
      // - Underneath on the right slot = new right page (targetLeftIdx + 1)
      // - Underneath on the left slot = current left page (leftPageIdx)
      const curRightPage = ALBUM_PAGES[albumState.leftPageIdx + 1];
      const newLeftPage = ALBUM_PAGES[targetLeftIdx];
      const newRightPage = ALBUM_PAGES[targetLeftIdx + 1];

      rightSlot.innerHTML = renderSheetHTML(newRightPage);

      flipLeaf.innerHTML = `
        <div class="flip-leaf-face flip-leaf-front">
          ${renderSheetHTML(curRightPage)}
          <div class="flip-curl-gradient"></div>
          <div class="flip-specular-highlight"></div>
        </div>
        <div class="flip-leaf-face flip-leaf-back">
          ${renderSheetHTML(newLeftPage)}
          <div class="flip-curl-gradient back"></div>
          <div class="flip-specular-highlight back"></div>
        </div>
      `;

      flipLeaf.className = 'album-flip-leaf flip-forward-start';
      bookSpread.classList.add('is-flipping-forward');

      // Force layout reflow so 3D keyframe animation triggers reliably
      void flipLeaf.offsetWidth;
      flipLeaf.classList.add('flip-forward-active');
    } else {
      // Flipping backward (Left page lifts and rotates +180deg over to the Right side):
      const curLeftPage = ALBUM_PAGES[albumState.leftPageIdx];
      const newLeftPage = ALBUM_PAGES[targetLeftIdx];
      const newRightPage = ALBUM_PAGES[targetLeftIdx + 1];

      leftSlot.innerHTML = renderSheetHTML(newLeftPage);

      flipLeaf.innerHTML = `
        <div class="flip-leaf-face flip-leaf-front">
          ${renderSheetHTML(curLeftPage)}
          <div class="flip-curl-gradient"></div>
          <div class="flip-specular-highlight"></div>
        </div>
        <div class="flip-leaf-face flip-leaf-back">
          ${renderSheetHTML(newRightPage)}
          <div class="flip-curl-gradient back"></div>
          <div class="flip-specular-highlight back"></div>
        </div>
      `;

      flipLeaf.className = 'album-flip-leaf flip-backward-start';
      bookSpread.classList.add('is-flipping-backward');

      void flipLeaf.offsetWidth;
      flipLeaf.classList.add('flip-backward-active');
    }

    setTimeout(() => {
      albumState.leftPageIdx = targetLeftIdx;
      albumState.isFlipping = false;
      bookSpread.classList.remove('is-flipping-forward', 'is-flipping-backward');
      renderAlbumView();
    }, 820);
  }

  function renderThumbnailsGrid() {
    const grid = document.getElementById('album-thumbnails-grid');
    if (!grid) return;

    const list = albumState.onlyBookmarked
      ? ALBUM_PAGES.filter(p => albumState.bookmarks.includes(p.page))
      : ALBUM_PAGES;

    if (list.length === 0) {
      grid.innerHTML = `<div class="thumb-empty-msg">У вас пока нет сохранённых закладок. Нажмите на иконку закладки на любом листе альбома!</div>`;
      return;
    }

    grid.innerHTML = list.map(p => {
      const isCurrent = (albumState.mode === 'single')
        ? (albumState.leftPageIdx === p.page - 1)
        : (p.page - 1 === albumState.leftPageIdx || p.page - 1 === albumState.leftPageIdx + 1);
      const isBm = albumState.bookmarks.includes(p.page);

      return `
        <div class="album-thumb-card ${isCurrent ? 'current' : ''}" data-jump-page="${p.page}">
          <div class="thumb-top">
            <span class="thumb-code">${p.code}</span>
            <span class="thumb-bm ${isBm ? 'active' : ''}">${isBm ? '★ В закладках' : `Лист ${String(p.page).padStart(2, '0')}`}</span>
          </div>
          <div class="thumb-svg-preview">
            ${generateDrawingSVG(p, false)}
          </div>
          <div class="thumb-title">${p.title}</div>
          <div class="thumb-meta">${p.dims}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-jump-page]').forEach(card => {
      card.addEventListener('click', () => {
        const pageNum = parseInt(card.dataset.jumpPage, 10);
        jumpToAlbumPage(pageNum);
      });
    });
  }

  function jumpToAlbumPage(pageNum) {
    const idx = Math.max(0, Math.min(ALBUM_PAGES.length - 1, pageNum - 1));
    albumState.mode = 'album';
    albumState.leftPageIdx = idx % 2 === 0 ? idx : idx - 1;
    renderAlbumView();
  }

  function bindSheetInteractions(container) {
    container.querySelectorAll('[data-bm-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageNum = parseInt(btn.dataset.bmPage, 10);
        const idx = albumState.bookmarks.indexOf(pageNum);
        if (idx === -1) {
          albumState.bookmarks.push(pageNum);
          btn.classList.add('active', 'bm-pop');
          if (window.GrafikaShowToast) window.GrafikaShowToast(`Лист ${String(pageNum).padStart(2, '0')} добавлен в закладки`);
        } else {
          albumState.bookmarks.splice(idx, 1);
          btn.classList.remove('active');
          if (window.GrafikaShowToast) window.GrafikaShowToast(`Лист ${String(pageNum).padStart(2, '0')} удалён из закладок`);
        }
        saveBookmarks();
        updateAlbumPaginationReadout();
        renderAlbumView();
      });
    });

    container.querySelectorAll('[data-zoom-page]').forEach(el => {
      el.addEventListener('click', () => {
        const pageNum = parseInt(el.dataset.zoomPage, 10);
        openZoomModal(pageNum);
      });
    });
  }

  // ==========================================================================
  // 5B. MULTILINGUAL SYSTEM (RU / KZ / EN) & ROLE SECURITY
  // ==========================================================================
  const I18N_DICT = {
    ru: {
      authSub: 'ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ ИНЖЕНЕРНОЙ ГРАФИКИ',
      aboutBtn: 'О проекте',
      helpBtn: 'Помощь',
      heroPill: 'ОБРАЗОВАТЕЛЬНАЯ 3D-ПЛАТФОРМА И ТРЕНАЖЁР ЧЕРЧЕНИЯ',
      heroMotto: 'ВИДИ. ПОСТРОЙ. ПОНИМАЙ.',
      heroQuote: '«Изучай черчение, проекции и изометрию через практику, эксперименты и интерактивные задания».',
      whoAreYou: 'Кто вы?',
      teacherBadge: 'ДЛЯ ПРЕПОДАВАТЕЛЕЙ И КАФЕДР (ЗАЩИЩЁННЫЙ ДОСТУП)',
      teacherTitle: 'Я преподаватель',
      teacherDesc: 'Демонстрируйте 3D-проекции на интерактивной доске, проводите наглядные разборы эпюра Монжа, проверяйте конструкции и управляйте учебными группами.',
      teacherSubmit: 'ВОЙТИ КАК ПРЕПОДАВАТЕЛЬ',
      studentBadge: 'ДЛЯ СТУДЕНТОВ И УЧЕНИКОВ',
      studentTitle: 'Я ученик / студент',
      studentDesc: 'Изучайте проекции в интерактивной 3D-лаборатории, собирайте изометрические конструкции, проходите испытания и прокачивайте дерево инженерных навыков.',
      studentSubmit: 'НАЧАТЬ ОБУЧЕНИЕ В ЛАБОРАТОРИИ',
      nav1: 'Главная',
      nav2: 'Лаборатория проекций',
      nav3: 'Альбом чертежей',
      nav4: 'Изометрия 3D',
      nav5: 'Тренировки',
      nav6: 'Испытания',
      nav7: 'Мой прогресс',
      switchRole: 'Сменить роль',
      ctaStart: 'НАЧАТЬ ОБУЧЕНИЕ',
      ctaAlbum: 'ОТКРЫТЬ АЛЬБОМ ЧЕРТЕЖЕЙ',
      ctaProj: '3D-ЛАБОРАТОРИЯ ПРОЕКЦИЙ'
    },
    kz: {
      authSub: 'ИНЖЕНЕРЛІК ГРАФИКАНЫҢ ИНТЕРАКТИВТІ ЗЕРТХАНАСЫ',
      aboutBtn: 'Жоба туралы',
      helpBtn: 'Көмек',
      heroPill: 'БІЛІМ БЕРУ 3D-ПЛАТФОРМАСЫ ЖӘНЕ СЫЗУ ТРЕНАЖЕРІ',
      heroMotto: 'КӨР. ҚҰРАСТЫР. ТҮСІН.',
      heroQuote: '«Сызуды, проекцияларды және изометрияны тәжірибе мен интерактивті тапсырмалар арқылы үйрен».',
      whoAreYou: 'Сіз кімсіз?',
      teacherBadge: 'ОҚЫТУШЫЛАР МЕН КАФЕДРАЛАР ҮШІН (ҚОРҒАЛҒАН КІРУ)',
      teacherTitle: 'Мен оқытушымын',
      teacherDesc: 'Интерактивті тақтада 3D-проекцияларды көрсетіңіз, Монж эпюрін талдаңыз, құрылымдарды тексеріңіз және оқу топтарын басқарыңыз.',
      teacherSubmit: 'ОҚЫТУШЫ РЕТІНДЕ КІРУ',
      studentBadge: 'СТУДЕНТТЕР МЕН ОҚУШЫЛАР ҮШІН',
      studentTitle: 'Мен оқушымын / студентпін',
      studentDesc: 'Интерактивті 3D-зертханада проекцияларды зерттеңіз, изометриялық фигураларды жинаңыз, сынақтардан өтіп, инженерлік дағдыларды дамытыңыз.',
      studentSubmit: 'ЗЕРТХАНАДА ОҚУДЫ БАСТАУ',
      nav1: 'Басты бет',
      nav2: 'Проекциялар зертханасы',
      nav3: 'Сызбалар альбомы',
      nav4: 'Изометрия 3D',
      nav5: 'Жаттығулар',
      nav6: 'Сынақтар',
      nav7: 'Менің прогресім',
      switchRole: 'Рөлді ауыстыру',
      ctaStart: 'ОҚУДЫ БАСТАУ',
      ctaAlbum: 'СЫЗБАЛАР АЛЬБОМЫН АШУ',
      ctaProj: '3D-ПРОЕКЦИЯЛАР ЗЕРТХАНАСЫ'
    },
    en: {
      authSub: 'INTERACTIVE ENGINEERING GRAPHICS LABORATORY',
      aboutBtn: 'About',
      helpBtn: 'Help',
      heroPill: 'EDUCATIONAL 3D PLATFORM & DRAFTING TRAINER',
      heroMotto: 'SEE. BUILD. UNDERSTAND.',
      heroQuote: '“Master technical drafting, orthographic projections, and isometry through hands-on practice and interactive challenges.”',
      whoAreYou: 'Who are you?',
      teacherBadge: 'FOR INSTRUCTORS & DEPARTMENTS (VERIFIED ACCESS)',
      teacherTitle: 'I am a Teacher',
      teacherDesc: 'Demonstrate 3D projections on an interactive board, explain Monge epures, inspect student constructions, and manage study groups.',
      teacherSubmit: 'ENTER AS TEACHER',
      studentBadge: 'FOR STUDENTS & LEARNERS',
      studentTitle: 'I am a Student',
      studentDesc: 'Explore projections in the interactive 3D lab, build isometric constructions, complete spatial challenges, and level up your skill tree.',
      studentSubmit: 'START LEARNING IN LAB',
      nav1: 'Home',
      nav2: 'Projection Lab',
      nav3: 'Drawing Album',
      nav4: 'Isometry 3D',
      nav5: 'Training',
      nav6: 'Challenges',
      nav7: 'My Progress',
      switchRole: 'Switch Role',
      ctaStart: 'START TRAINING',
      ctaAlbum: 'OPEN DRAWING ALBUM',
      ctaProj: '3D PROJECTION LAB'
    }
  };

  function applyLanguage(lang) {
    const dict = I18N_DICT[lang] || I18N_DICT.ru;
    localStorage.setItem('grafika_lang_v2', lang);

    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    const setTxt = (sel, txt) => {
      const el = document.querySelector(sel);
      if (el && txt) el.textContent = txt;
    };

    setTxt('.auth-brand .brand-sub', dict.authSub);
    setTxt('#auth-about-btn', dict.aboutBtn);
    setTxt('#auth-help-btn', dict.helpBtn);
    setTxt('.auth-pill-tag', dict.heroPill);
    setTxt('.auth-main-subtitle', dict.heroMotto);
    setTxt('.auth-main-desc', dict.heroQuote);
    setTxt('.auth-who-question', dict.whoAreYou);
    setTxt('#role-card-teacher .role-card-badge', dict.teacherBadge);
    setTxt('#role-card-teacher .role-card-title', dict.teacherTitle);
    setTxt('#role-card-teacher .role-card-desc', dict.teacherDesc);
    setTxt('#form-teacher .role-submit-btn span', dict.teacherSubmit);
    setTxt('#role-card-student .role-card-badge', dict.studentBadge);
    setTxt('#role-card-student .role-card-title', dict.studentTitle);
    setTxt('#role-card-student .role-card-desc', dict.studentDesc);
    setTxt('#form-student .role-submit-btn span', dict.studentSubmit);

    // Main nav items
    const navMap = {
      home: ['01', dict.nav1],
      projection: ['02', dict.nav2],
      album: ['03', dict.nav3],
      builder: ['04', dict.nav4],
      training: ['05', dict.nav5],
      challenges: ['06', dict.nav6],
      progress: ['07', dict.nav7]
    };
    Object.keys(navMap).forEach(key => {
      const btn = document.querySelector(`.main-nav [data-nav="${key}"]`);
      if (btn) {
        btn.innerHTML = `<span class="nav-idx">${navMap[key][0]}</span> ${navMap[key][1]}`;
      }
    });

    setTxt('#switch-role-topbtn', dict.switchRole);
    setTxt('.hero-subtitle', dict.heroMotto);
    setTxt('.hero-cta-row [data-go="training"] span', dict.ctaStart);
    setTxt('.hero-cta-row [data-go="album"] span', dict.ctaAlbum);
    setTxt('.hero-cta-row [data-go="projection"] span', dict.ctaProj);
  }
  function openZoomModal(pageNum) {
    const pageObj = ALBUM_PAGES.find(p => p.page === pageNum);
    if (!pageObj) return;

    albumState.zoomPage = pageObj;
    albumState.zoomScale = 1.0;
    albumState.zoomPanX = 0;
    albumState.zoomPanY = 0;

    const modal = document.getElementById('album-zoom-modal');
    const titleEl = document.getElementById('zoom-sheet-title');
    const metaEl = document.getElementById('zoom-sheet-meta');
    const stageEl = document.getElementById('zoom-canvas-holder');

    if (!modal || !stageEl) return;
    if (titleEl) titleEl.textContent = `${pageObj.code} — ${pageObj.title}`;
    if (metaEl) metaEl.textContent = `${pageObj.gost} • ${pageObj.dims}`;

    stageEl.innerHTML = generateDrawingSVG(pageObj, true);
    applyZoomTransform();
    modal.style.display = 'flex';
  }

  function applyZoomTransform() {
    const holder = document.getElementById('zoom-canvas-holder');
    const pctEl = document.getElementById('zoom-scale-readout');
    if (holder) {
      holder.style.transform = `translate(${albumState.zoomPanX}px, ${albumState.zoomPanY}px) scale(${albumState.zoomScale})`;
    }
    if (pctEl) {
      pctEl.textContent = `${Math.round(albumState.zoomScale * 100)}%`;
    }
  }

  // ==========================================================================
  // 6. INITIALIZATION & EVENT BINDINGS
  // ==========================================================================
  function initAlbumAndThemes() {
    // Apply saved or default theme immediately
    applyTheme(currentThemeId, false);

    // Apply saved or default language via centralized GrafikaI18n (RU / KZ / EN)
    const savedLang = localStorage.getItem('grafika_lang_v3') || 'ru';
    if (window.GrafikaI18n) {
      window.GrafikaI18n.setLang(savedLang, false);
    }
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.GrafikaI18n) {
          window.GrafikaI18n.setLang(btn.dataset.lang, true);
        }
      });
    });

    // Step-by-step drafting controls inside Drawing Album
    const stPrev = document.getElementById('album-step-prev');
    const stNext = document.getElementById('album-step-next');
    const stAll = document.getElementById('album-step-all');
    const stDims = document.getElementById('album-dims-toggle');
    const st3d = document.getElementById('album-compare-3d');
    const stLabel = document.getElementById('album-stage-readout');

    function syncStageReadout() {
      const names = { 1: 'Этап 1/4: Оси и база', 2: 'Этап 2/4: Контуры', 3: 'Этап 3/4: Связи и штрихи', 4: 'Этап 4/4: Полный чертёж' };
      if (stLabel) stLabel.textContent = names[albumState.buildStage] || names[4];
      if (stDims) stDims.textContent = albumState.showDims ? 'Скрыть размеры' : 'Показать размеры';
    }
    syncStageReadout();

    if (stPrev) stPrev.addEventListener('click', () => {
      albumState.buildStage = Math.max(1, albumState.buildStage - 1);
      syncStageReadout();
      renderAlbumView();
    });
    if (stNext) stNext.addEventListener('click', () => {
      albumState.buildStage = Math.min(4, albumState.buildStage + 1);
      syncStageReadout();
      renderAlbumView();
    });
    if (stAll) stAll.addEventListener('click', () => {
      albumState.buildStage = 4;
      syncStageReadout();
      renderAlbumView();
    });
    if (stDims) stDims.addEventListener('click', () => {
      albumState.showDims = !albumState.showDims;
      syncStageReadout();
      renderAlbumView();
    });
    if (st3d) st3d.addEventListener('click', () => {
      if (window.GrafikaSwitchView) window.GrafikaSwitchView('projection');
    });

    // Drag-to-flip & Touch-swipe gestures on the Open Book Spread
    const spreadEl = document.getElementById('album-book-spread');
    if (spreadEl) {
      let dragStartX = null;
      spreadEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('button') || e.target.closest('.sheet-drawing-stage')) return;
        dragStartX = e.clientX;
      });
      window.addEventListener('mouseup', (e) => {
        if (dragStartX === null) return;
        const dx = e.clientX - dragStartX;
        dragStartX = null;
        if (dx < -70) flipAlbumPage('next');
        else if (dx > 70) flipAlbumPage('prev');
      });

      let touchStartX = null;
      spreadEl.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) touchStartX = e.touches[0].clientX;
      }, { passive: true });
      spreadEl.addEventListener('touchend', (e) => {
        if (touchStartX === null || !e.changedTouches) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (dx < -50) flipAlbumPage('next');
        else if (dx > 50) flipAlbumPage('prev');
      }, { passive: true });
    }

    // Keyboard ArrowLeft / ArrowRight page turning when Album view is active
    window.addEventListener('keydown', (e) => {
      const albumSec = document.getElementById('view-album');
      if (!albumSec || !albumSec.classList.contains('active')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        flipAlbumPage('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        flipAlbumPage('prev');
      }
    });

    // Theme dropdown toggle buttons
    const themeToggleBtns = document.querySelectorAll('.theme-menu-trigger');
    const themePopovers = document.querySelectorAll('.theme-dropdown-menu');

    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = btn.dataset.targetMenu;
        const menu = document.getElementById(menuId);
        if (menu) {
          const isOpen = menu.classList.contains('open');
          themePopovers.forEach(m => m.classList.remove('open'));
          if (!isOpen) {
            // Auto-flip horizontal alignment if trigger is near the left edge of the viewport
            const rect = btn.getBoundingClientRect();
            if (rect.left < 300) {
              menu.style.left = '0px';
              menu.style.right = 'auto';
            } else {
              menu.style.right = '0px';
              menu.style.left = 'auto';
            }
            menu.classList.add('open');
          }
        }
      });
    });

    document.addEventListener('click', () => {
      themePopovers.forEach(m => m.classList.remove('open'));
    });

    themePopovers.forEach(menu => {
      menu.addEventListener('click', (e) => e.stopPropagation());
    });

    document.querySelectorAll('[data-theme-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.themePick, true);
        themePopovers.forEach(m => m.classList.remove('open'));
      });
    });

    // Album flip arrows
    const prevBtn = document.getElementById('album-prev-btn');
    const nextBtn = document.getElementById('album-next-btn');
    const prevFloat = document.getElementById('album-arrow-left');
    const nextFloat = document.getElementById('album-arrow-right');

    [prevBtn, prevFloat].forEach(b => {
      if (b) b.addEventListener('click', () => flipAlbumPage('prev'));
    });
    [nextBtn, nextFloat].forEach(b => {
      if (b) b.addEventListener('click', () => flipAlbumPage('next'));
    });

    // Album view mode buttons (ALBUM / SINGLE PAGE / THUMBNAILS)
    document.querySelectorAll('[data-album-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        albumState.mode = btn.dataset.albumMode;
        albumState.onlyBookmarked = false;
        const bmFilterBtn = document.getElementById('album-filter-bookmarks');
        if (bmFilterBtn) bmFilterBtn.classList.remove('active');
        renderAlbumView();
      });
    });

    // Bookmarks filter toggle
    const bmFilterBtn = document.getElementById('album-filter-bookmarks');
    if (bmFilterBtn) {
      bmFilterBtn.addEventListener('click', () => {
        albumState.onlyBookmarked = !albumState.onlyBookmarked;
        bmFilterBtn.classList.toggle('active', albumState.onlyBookmarked);
        if (albumState.onlyBookmarked) {
          albumState.mode = 'thumbnails';
        }
        renderAlbumView();
      });
    }

    // Zoom modal controls
    const zModal = document.getElementById('album-zoom-modal');
    const zClose = document.getElementById('zoom-modal-close');
    const zIn = document.getElementById('zoom-btn-in');
    const zOut = document.getElementById('zoom-btn-out');
    const zReset = document.getElementById('zoom-btn-reset');
    const zViewport = document.getElementById('zoom-pan-viewport');

    if (zClose && zModal) zClose.addEventListener('click', () => { zModal.style.display = 'none'; });
    if (zIn) zIn.addEventListener('click', () => { albumState.zoomScale = Math.min(3.2, albumState.zoomScale + 0.25); applyZoomTransform(); });
    if (zOut) zOut.addEventListener('click', () => { albumState.zoomScale = Math.max(0.6, albumState.zoomScale - 0.25); applyZoomTransform(); });
    if (zReset) zReset.addEventListener('click', () => { albumState.zoomScale = 1.0; albumState.zoomPanX = 0; albumState.zoomPanY = 0; applyZoomTransform(); });

    if (zViewport) {
      zViewport.addEventListener('mousedown', (e) => {
        albumState.isPanning = true;
        albumState.panStartX = e.clientX - albumState.zoomPanX;
        albumState.panStartY = e.clientY - albumState.zoomPanY;
      });
      window.addEventListener('mousemove', (e) => {
        if (!albumState.isPanning) return;
        albumState.zoomPanX = e.clientX - albumState.panStartX;
        albumState.zoomPanY = e.clientY - albumState.panStartY;
        applyZoomTransform();
      });
      window.addEventListener('mouseup', () => {
        albumState.isPanning = false;
      });
      zViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        albumState.zoomScale = Math.max(0.6, Math.min(3.2, albumState.zoomScale + delta));
        applyZoomTransform();
      }, { passive: false });
    }

    renderAlbumView();
  }

  window.addEventListener('DOMContentLoaded', initAlbumAndThemes);

  return {
    THEMES,
    ALBUM_PAGES,
    getActiveTheme,
    applyTheme,
    renderAlbumView,
    flipAlbumPage
  };
})();

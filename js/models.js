/* ==========================================================================
   ГРАФИКА LAB — GEOMETRIC & CAD MODELS LIBRARY (js/models.js)
   Includes:
   - True 3D Polyhedral Mesh Builders (Vertices, Faces, Crease Edges, Normals)
   - 6 Engineering Parts for Projection Lab (GOST 2.305-2008)
   - Multi-part Hero CAD Assembly
   - Isometric Builder Primitives (Cube, Block, Cylinder, Sphere, Prism, Pyramid)
   - Skill Tree Nodes, Lessons, and Spatial Challenges
   ========================================================================== */

window.GrafikaModels = (function () {
  'use strict';

  // Vector math helpers
  function vecSub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function vecCross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function vecNorm(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function vecDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function faceNormal(verts, faceIndices) {
    const p0 = verts[faceIndices[0]];
    const p1 = verts[faceIndices[1]];
    const p2 = verts[faceIndices[2]];
    return vecNorm(vecCross(vecSub(p1, p0), vecSub(p2, p0)));
  }

  // Create a box mesh in range [x0,x1], [y0,y1], [z0,z1]
  function createBox(x0, y0, z0, x1, y1, z1, color) {
    const v = [
      [x0, y0, z0], // 0
      [x1, y0, z0], // 1
      [x1, y1, z0], // 2
      [x0, y1, z0], // 3
      [x0, y0, z1], // 4
      [x1, y0, z1], // 5
      [x1, y1, z1], // 6
      [x0, y1, z1]  // 7
    ];
    // Outward CCW faces
    const f = [
      { idx: [0, 3, 2, 1], color }, // Bottom (-Z)
      { idx: [4, 5, 6, 7], color }, // Top (+Z)
      { idx: [0, 1, 5, 4], color }, // Front (-Y)
      { idx: [2, 3, 7, 6], color }, // Back (+Y)
      { idx: [0, 4, 7, 3], color }, // Left (-X)
      { idx: [1, 2, 6, 5], color }  // Right (+X)
    ];
    return { vertices: v, faces: f };
  }

  // Create a cylinder along Z axis from z0 to z1, centered at (cx, cy), radius r
  function createCylinder(cx, cy, z0, z1, r, segments, color, axis) {
    segments = segments || 16;
    axis = axis || 'z';
    const v = [];
    const f = [];

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r;
      if (axis === 'z') {
        v.push([cx + c, cy + s, z0]);
      } else if (axis === 'x') {
        v.push([z0, cx + c, cy + s]);
      } else {
        v.push([cx + c, z0, cy + s]);
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r;
      if (axis === 'z') {
        v.push([cx + c, cy + s, z1]);
      } else if (axis === 'x') {
        v.push([z1, cx + c, cy + s]);
      } else {
        v.push([cx + c, z1, cy + s]);
      }
    }

    // Side quads
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      f.push({ idx: [i, next, segments + next, segments + i], color, smooth: true });
    }

    // Bottom cap
    const botCap = [];
    for (let i = segments - 1; i >= 0; i--) botCap.push(i);
    f.push({ idx: botCap, color });

    // Top cap
    const topCap = [];
    for (let i = 0; i < segments; i++) topCap.push(segments + i);
    f.push({ idx: topCap, color });

    return { vertices: v, faces: f };
  }

  // Create a triangular prism or wedge
  function createWedge(x0, y0, z0, x1, y1, z1, dir, color) {
    // dir='x' slopes down along +X from z1 at x0 to z0 at x1
    let v, f;
    if (dir === 'x') {
      v = [
        [x0, y0, z0], // 0
        [x1, y0, z0], // 1
        [x1, y1, z0], // 2
        [x0, y1, z0], // 3
        [x0, y0, z1], // 4
        [x0, y1, z1]  // 5
      ];
      f = [
        { idx: [0, 3, 2, 1], color },
        { idx: [0, 4, 5, 3], color },
        { idx: [4, 1, 2, 5], color },
        { idx: [0, 1, 4], color },
        { idx: [3, 5, 2], color }
      ];
    } else {
      // Symmetric gable prism along Y
      const xm = (x0 + x1) / 2;
      v = [
        [x0, y0, z0], // 0
        [x1, y0, z0], // 1
        [x1, y1, z0], // 2
        [x0, y1, z0], // 3
        [xm, y0, z1], // 4
        [xm, y1, z1]  // 5
      ];
      f = [
        { idx: [0, 3, 2, 1], color },
        { idx: [0, 4, 5, 3], color },
        { idx: [1, 2, 5, 4], color },
        { idx: [0, 1, 4], color },
        { idx: [3, 5, 2], color }
      ];
    }
    return { vertices: v, faces: f };
  }

  // Create a 4-sided pyramid
  function createPyramid(x0, y0, z0, x1, y1, z1, color) {
    const xm = (x0 + x1) / 2;
    const ym = (y0 + y1) / 2;
    const v = [
      [x0, y0, z0], // 0
      [x1, y0, z0], // 1
      [x1, y1, z0], // 2
      [x0, y1, z0], // 3
      [xm, ym, z1]  // 4 Apex
    ];
    const f = [
      { idx: [0, 3, 2, 1], color },
      { idx: [0, 1, 4], color },
      { idx: [1, 2, 4], color },
      { idx: [2, 3, 4], color },
      { idx: [3, 0, 4], color }
    ];
    return { vertices: v, faces: f };
  }

  // Create a low-poly sphere
  function createSphere(cx, cy, cz, r, latSeg, lonSeg, color) {
    latSeg = latSeg || 8;
    lonSeg = lonSeg || 12;
    const v = [];
    const f = [];
    for (let lat = 0; lat <= latSeg; lat++) {
      const theta = (lat * Math.PI) / latSeg;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      for (let lon = 0; lon < lonSeg; lon++) {
        const phi = (lon * 2 * Math.PI) / lonSeg;
        v.push([
          cx + r * sinT * Math.cos(phi),
          cy + r * sinT * Math.sin(phi),
          cz + r * cosT
        ]);
      }
    }
    for (let lat = 0; lat < latSeg; lat++) {
      for (let lon = 0; lon < lonSeg; lon++) {
        const nextLon = (lon + 1) % lonSeg;
        const i0 = lat * lonSeg + lon;
        const i1 = lat * lonSeg + nextLon;
        const i2 = (lat + 1) * lonSeg + nextLon;
        const i3 = (lat + 1) * lonSeg + lon;
        f.push({ idx: [i0, i3, i2, i1], color, smooth: true });
      }
    }
    return { vertices: v, faces: f };
  }

  // Create a voxel union mesh from a 3D boolean grid: gridFn(ix, iy, iz) -> boolean
  // Eliminates internal coplanar faces automatically so hidden-line ortho drawings are 100% clean!
  function createVoxelSolid(nx, ny, nz, unitSize, gridFn, color) {
    const ox = -(nx * unitSize) / 2;
    const oy = -(ny * unitSize) / 2;
    const oz = -(nz * unitSize) / 2;

    const vertMap = new Map();
    const vertices = [];
    const faces = [];

    function getVertIdx(gx, gy, gz) {
      const key = `${gx},${gy},${gz}`;
      if (vertMap.has(key)) return vertMap.get(key);
      const idx = vertices.length;
      vertices.push([ox + gx * unitSize, oy + gy * unitSize, oz + gz * unitSize]);
      vertMap.set(key, idx);
      return idx;
    }

    function isFilled(x, y, z) {
      if (x < 0 || x >= nx || y < 0 || y >= ny || z < 0 || z >= nz) return false;
      return !!gridFn(x, y, z);
    }

    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          if (!isFilled(x, y, z)) continue;

          // -Z bottom
          if (!isFilled(x, y, z - 1)) {
            faces.push({
              idx: [getVertIdx(x, y, z), getVertIdx(x, y + 1, z), getVertIdx(x + 1, y + 1, z), getVertIdx(x + 1, y, z)],
              color
            });
          }
          // +Z top
          if (!isFilled(x, y, z + 1)) {
            faces.push({
              idx: [getVertIdx(x, y, z + 1), getVertIdx(x + 1, y, z + 1), getVertIdx(x + 1, y + 1, z + 1), getVertIdx(x, y + 1, z + 1)],
              color
            });
          }
          // -Y front
          if (!isFilled(x, y - 1, z)) {
            faces.push({
              idx: [getVertIdx(x, y, z), getVertIdx(x + 1, y, z), getVertIdx(x + 1, y, z + 1), getVertIdx(x, y, z + 1)],
              color
            });
          }
          // +Y back
          if (!isFilled(x, y + 1, z)) {
            faces.push({
              idx: [getVertIdx(x + 1, y + 1, z), getVertIdx(x, y + 1, z), getVertIdx(x, y + 1, z + 1), getVertIdx(x + 1, y + 1, z + 1)],
              color
            });
          }
          // -X left
          if (!isFilled(x - 1, y, z)) {
            faces.push({
              idx: [getVertIdx(x, y + 1, z), getVertIdx(x, y, z), getVertIdx(x, y, z + 1), getVertIdx(x, y + 1, z + 1)],
              color
            });
          }
          // +X right
          if (!isFilled(x + 1, y, z)) {
            faces.push({
              idx: [getVertIdx(x + 1, y, z), getVertIdx(x + 1, y + 1, z), getVertIdx(x + 1, y + 1, z + 1), getVertIdx(x + 1, y, z + 1)],
              color
            });
          }
        }
      }
    }

    return compileMesh({ vertices, faces });
  }

  // Merge multiple sub-meshes into one compiled mesh with precomputed face normals and feature edges
  function mergeMeshes(meshList) {
    const vertices = [];
    const faces = [];
    for (const m of meshList) {
      const offset = vertices.length;
      const partOffset = m.partOffset || [0, 0, 0];
      for (const v of m.vertices) {
        vertices.push([v[0], v[1], v[2]]);
      }
      for (const f of m.faces) {
        faces.push({
          idx: f.idx.map(i => i + offset),
          color: f.color || '#D6BFA8',
          smooth: !!f.smooth,
          partDir: partOffset
        });
      }
    }
    return compileMesh({ vertices, faces });
  }

  // Compile mesh: compute face normals, centroids, and extract true feature/crease edges
  // (Edges shared by coplanar faces are filtered out so orthographic drawings only show real CAD edges!)
  function compileMesh(rawMesh) {
    const { vertices, faces } = rawMesh;
    const edgeMap = new Map();

    faces.forEach((f, fIdx) => {
      f.normal = faceNormal(vertices, f.idx);
      let cx = 0, cy = 0, cz = 0;
      for (const vi of f.idx) {
        cx += vertices[vi][0];
        cy += vertices[vi][1];
        cz += vertices[vi][2];
      }
      const n = f.idx.length;
      f.centroid = [cx / n, cy / n, cz / n];

      for (let i = 0; i < n; i++) {
        const a = f.idx[i];
        const b = f.idx[(i + 1) % n];
        const k1 = Math.min(a, b);
        const k2 = Math.max(a, b);
        const key = `${k1}_${k2}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { a: k1, b: k2, faces: [fIdx] });
        } else {
          edgeMap.get(key).faces.push(fIdx);
        }
      }
    });

    const edges = [];
    edgeMap.forEach((e) => {
      if (e.faces.length === 1) {
        edges.push({ a: e.a, b: e.b, faces: e.faces, isCrease: true });
      } else if (e.faces.length >= 2) {
        const n1 = faces[e.faces[0]].normal;
        const n2 = faces[e.faces[1]].normal;
        const dot = vecDot(n1, n2);
        // Feature edge if angle between normals > ~8 degrees
        if (dot < 0.99) {
          edges.push({ a: e.a, b: e.b, faces: e.faces, isCrease: dot < 0.88, normals: [n1, n2] });
        }
      }
    });

    return { vertices, faces, edges };
  }

  // ==========================================================================
  // HERO MULTI-PART CAD ASSEMBLY (SUPPORTS EXPLODE MODE)
  // ==========================================================================
  function createHeroAssembly() {
    const parts = [];

    // Central core block with slot
    const core = createVoxelSolid(4, 4, 3, 24, (x, y, z) => {
      if (z === 2 && x >= 1 && x <= 2) return false; // top channel
      if (y >= 1 && y <= 2 && x >= 1 && x <= 2 && z === 0) return false; // bottom cavity
      return true;
    }, '#D6BFA8');
    parts.push({ ...core, partOffset: [0, 0, 0] });

    // Top cylindrical turret
    const cylTop = createCylinder(0, 0, 36, 68, 22, 18, '#C8AD92', 'z');
    parts.push({ ...cylTop, partOffset: [0, 0, 34] });

    // Left flange bracket
    const leftFlange = createBox(-72, -26, -24, -48, 26, 20, '#DECAB5');
    parts.push({ ...leftFlange, partOffset: [-36, 0, 0] });

    // Right wedge rib
    const rightWedge = createWedge(48, -26, -24, 78, 26, 24, 'x', '#BD8D65');
    parts.push({ ...rightWedge, partOffset: [38, 0, 0] });

    // Front alignment pin
    const frontPin = createCylinder(0, 0, -48, -74, 14, 14, '#B58963', 'y');
    parts.push({ ...frontPin, partOffset: [0, -35, 0] });

    // Back counterweight block
    const backBlock = createBox(-26, 48, -24, 26, 70, 26, '#D6BFA8');
    parts.push({ ...backBlock, partOffset: [0, 35, 0] });

    return mergeMeshes(parts);
  }

  // ==========================================================================
  // 6 ENGINEERING PARTS FOR PROJECTION LAB (GOST 2.305-2008)
  // ==========================================================================
  const PROJECTION_MODELS = [
    {
      id: 'stepped-support',
      name: '01. Ступенчатая опора с пазом',
      code: 'ГОСТ 711142.001',
      dims: '80 × 60 × 60 мм',
      difficulty: 'УРОВЕНЬ 1',
      note: 'Базовая призматическая деталь со сквозным продольным пазом. На профильной проекции (W) дно паза изображается штриховой линией невидимого контура.',
      build: () => createVoxelSolid(4, 3, 3, 28, (x, y, z) => {
        // Base plate z=0 full
        if (z === 0) {
          // Bottom tunnel along Y in middle X
          if (x >= 1 && x <= 2 && y === 1) return true;
          return true;
        }
        // Step at z=1
        if (z === 1) {
          if (x === 3) return false; // step cut on right
          return true;
        }
        // Top level z=2: two towers at y=0 and y=2 on left side (x=0,1) creating a slot at y=1
        if (z === 2) {
          if (x <= 1 && (y === 0 || y === 2)) return true;
          return false;
        }
        return false;
      }, '#D6BFA8')
    },
    {
      id: 'slotted-bracket',
      name: '02. Кронштейн с Т-образным вырезом',
      code: 'ГОСТ 711142.002',
      dims: '100 × 60 × 80 мм',
      difficulty: 'УРОВЕНЬ 2',
      note: 'Деталь с внутренним скрытым каналом и верхним окном. Идеально демонстрирует переход видимых контуров в скрытые штриховые рёбра на виде спереди и слева.',
      build: () => createVoxelSolid(5, 3, 4, 24, (x, y, z) => {
        // Hollow internal tunnel along X at y=1, z=1
        if (y === 1 && z === 1 && x >= 1 && x <= 3) return false;
        // Top notch
        if (z === 3 && x >= 1 && x <= 3) return false;
        // Front cutout on bottom corners
        if (z === 0 && (x === 0 || x === 4) && y === 0) return false;
        // Step down on middle
        if (z >= 2 && y === 0 && x >= 1 && x <= 3) return false;
        return true;
      }, '#CFB69E')
    },
    {
      id: 'flange-bushing',
      name: '03. Цилиндрическая втулка с фланцем',
      code: 'ГОСТ 711142.003',
      dims: 'Ø90 × 75 мм',
      difficulty: 'УРОВЕНЬ 2',
      note: 'Тело вращения на прямоугольном основании с боковыми приливами. На виде сверху (H) цилиндрическая башня проецируется в концентрические окружности.',
      build: () => {
        const base = createBox(-54, -38, -40, 54, 38, -14, '#DECAB5');
        const boss = createCylinder(0, 0, -14, 38, 30, 16, '#C8AD92', 'z');
        const topNeck = createCylinder(0, 0, 38, 52, 16, 16, '#BD8D65', 'z');
        const earL = createBox(-54, -16, -14, -30, 16, 10, '#D6BFA8');
        const earR = createBox(30, -16, -14, 54, 16, 10, '#D6BFA8');
        return mergeMeshes([base, boss, topNeck, earL, earR]);
      }
    },
    {
      id: 'wedge-guide',
      name: '04. Направляющая с наклонным ребром',
      code: 'ГОСТ 711142.004',
      dims: '96 × 64 × 72 мм',
      difficulty: 'УРОВЕНЬ 3',
      note: 'Сочетание горизонтальных граней и наклонного ребра жёсткости. Наклонная грань проецируется с искажением (укорочением) на виды сверху и слева.',
      build: () => {
        const base = createBox(-56, -36, -36, 56, 36, -12, '#DECAB5');
        const wall = createBox(-56, -36, -12, -24, 36, 40, '#D6BFA8');
        const rib = createWedge(-24, -14, -12, 48, 14, 34, 'x', '#BD8D65');
        const frontStep = createBox(20, -36, -12, 56, -18, 6, '#C9AF95');
        const backStep = createBox(20, 18, -12, 56, 36, 6, '#C9AF95');
        return mergeMeshes([base, wall, rib, frontStep, backStep]);
      }
    },
    {
      id: 'hollow-frame',
      name: '05. Корпус подшипника со сквозным окном',
      code: 'ГОСТ 711142.005',
      dims: '90 × 90 × 90 мм',
      difficulty: 'УРОВЕНЬ 3',
      note: 'Пространственная деталь с взаимно перпендикулярными сквозными окнами по осям X и Y. Требует внимательного чтения штриховых линий.',
      build: () => createVoxelSolid(5, 5, 4, 21, (x, y, z) => {
        // Outer pyramid-like step at top
        if (z === 3 && (x === 0 || x === 4 || y === 0 || y === 4)) return false;
        // Through window along Y
        if (x >= 1 && x <= 3 && (z === 1 || z === 2)) {
          if (x === 2) return false;
        }
        // Through window along X
        if (y === 2 && (z === 1 || z === 2)) return false;
        // Vertical central bore
        if (x === 2 && y === 2) return false;
        return true;
      }, '#D6BFA8')
    },
    {
      id: 'complex-slider',
      name: '06. Ползун станка (Сложная конструкция)',
      code: 'ГОСТ 711142.006',
      dims: '110 × 75 × 85 мм',
      difficulty: 'УРОВЕНЬ 4',
      note: 'Комплексная машиностроительная деталь типа «Ползун» с ласточкиным пазом, призматической надстройкой и цилиндрической цапфой.',
      build: () => {
        const leftLeg = createBox(-55, -38, -42, -22, 38, -12, '#DECAB5');
        const rightLeg = createBox(22, -38, -42, 55, 38, -12, '#DECAB5');
        const bridge = createBox(-55, -38, -12, 55, 38, 12, '#D6BFA8');
        const gable = createWedge(-36, -26, 12, 36, 26, 42, 'y', '#C8AD92');
        const pin = createCylinder(0, 14, 38, 56, 12, 14, '#BD8D65', 'y');
        return mergeMeshes([leftLeg, rightLeg, bridge, gable, pin]);
      }
    }
  ];

  // ==========================================================================
  // ISOMETRIC BUILDER PRIMITIVE GENERATOR (1 GRID UNIT = 28 PX)
  // ==========================================================================
  function createBuilderPrimitive(type, gx, gy, gz, rot, id, isSelected) {
    const U = 28; // 1 grid unit
    const cx = gx * U;
    const cy = gy * U;
    const cz = gz * U;
    const baseColor = isSelected ? '#BD8D65' : '#D6BFA8';

    let raw;
    if (type === 'cube') {
      raw = createBox(cx - U / 2, cy - U / 2, cz, cx + U / 2, cy + U / 2, cz + U, baseColor);
    } else if (type === 'block') {
      const dx = (rot % 2 === 0) ? U : U / 2;
      const dy = (rot % 2 === 0) ? U / 2 : U;
      raw = createBox(cx - dx, cy - dy, cz, cx + dx, cy + dy, cz + U, baseColor);
    } else if (type === 'cylinder') {
      raw = createCylinder(cx, cy, cz, cz + U, U * 0.45, 14, baseColor, 'z');
    } else if (type === 'sphere') {
      raw = createSphere(cx, cy, cz + U / 2, U * 0.48, 7, 10, baseColor);
    } else if (type === 'prism') {
      const dir = (rot % 2 === 0) ? 'x' : 'y';
      raw = createWedge(cx - U / 2, cy - U / 2, cz, cx + U / 2, cy + U / 2, cz + U, dir, baseColor);
    } else if (type === 'pyramid') {
      raw = createPyramid(cx - U / 2, cy - U / 2, cz, cx + U / 2, cy + U / 2, cz + U, baseColor);
    } else {
      raw = createBox(cx - U / 2, cy - U / 2, cz, cx + U / 2, cy + U / 2, cz + U, baseColor);
    }

    const compiled = compileMesh(raw);
    compiled.meta = { id, type, gx, gy, gz, rot, isSelected };
    return compiled;
  }

  // ==========================================================================
  // SKILL TREE DATA (6 BRANCHES)
  // ==========================================================================
  const SKILL_NODES = [
    {
      id: 'geom-1',
      branch: 'ГЕОМЕТРИЯ',
      shortBranch: 'ГЕОМЕТРИЯ',
      title: 'Геометрические построения и сопряжения',
      desc: 'Деление отрезков и углов, построение правильных многоугольников и плавных сопряжений дуг окружностей.',
      status: 'passed',
      xp: '+150 XP',
      mod: 'TRAIN-01',
      targetView: 'training',
      x: 95,
      y: 85,
      links: ['proj-1', 'dim-1']
    },
    {
      id: 'proj-1',
      branch: 'ПРОЕКЦИИ',
      shortBranch: 'ПРОЕКЦИИ',
      title: 'Ортогональные проекции (Метод Монжа)',
      desc: 'Проецирование точки, прямой и геометрического тела на три плоскости проекций: фронтальную V, горизонтальную H и профильную W.',
      status: 'passed',
      xp: '+200 XP',
      mod: 'LAB-02',
      targetView: 'projection',
      x: 265,
      y: 85,
      links: ['iso-1', 'spatial-1']
    },
    {
      id: 'dim-1',
      branch: 'РАЗМЕРЫ',
      shortBranch: 'РАЗМЕРЫ ГОСТ',
      title: 'Нанесение размеров по ЕСКД (ГОСТ 2.307)',
      desc: 'Выносные и размерные линии, знаки диаметра Ø, радиуса R, квадрата и конусности. Габаритные и координирующие размеры.',
      status: 'passed',
      xp: '+150 XP',
      mod: 'TRAIN-03',
      targetView: 'training',
      x: 265,
      y: 250,
      links: ['spatial-1']
    },
    {
      id: 'iso-1',
      branch: 'ИЗОМЕТРИЯ',
      shortBranch: 'ИЗОМЕТРИЯ 3D',
      title: 'Аксонометрия и изометрические оси (120°)',
      desc: 'Построение наглядных объёмных изображений деталей в прямоугольной изометрии без искажения вдоль осей X, Y, Z.',
      status: 'current',
      xp: '+250 XP',
      mod: 'BUILD-03',
      targetView: 'builder',
      x: 455,
      y: 85,
      links: ['complex-1']
    },
    {
      id: 'spatial-1',
      branch: 'ПРОСТРАНСТВЕННОЕ МЫШЛЕНИЕ',
      shortBranch: 'ПРОСТР. МЫШЛЕНИЕ',
      title: 'Чтение чертежа и скрытые контуры',
      desc: 'Воссоздание мысленного 3D-образа детали по двум или трём плоским видам. Анализ сквозных отверстий и пазов.',
      status: 'available',
      xp: '+300 XP',
      mod: 'CHAL-05',
      targetView: 'challenges',
      x: 455,
      y: 250,
      links: ['complex-1']
    },
    {
      id: 'complex-1',
      branch: 'СЛОЖНЫЕ КОНСТРУКЦИИ',
      shortBranch: 'СЛОЖНЫЕ УЗЛЫ',
      title: 'Сборочные узлы, разрезы и сечения',
      desc: 'Проектирование многокомпонентных машиностроительных узлов, соединение половины вида и половины разреза.',
      status: 'locked',
      xp: '+500 XP',
      mod: 'LAB-06',
      targetView: 'projection',
      x: 655,
      y: 168,
      links: []
    }
  ];

  // ==========================================================================
  // INTERACTIVE TRAINING LESSONS (STEP-BY-STEP CAD CONSTRUCTIONS)
  // ==========================================================================
  const TRAINING_LESSONS = [
    {
      id: 'fillet',
      tag: 'УРОК 01 // ГЕОМЕТРИЧЕСКИЕ ПОСТРОЕНИЯ',
      title: 'Построение внешнего сопряжения двух окружностей дугой радиуса R',
      paramLabel: 'Радиус сопряжения R (мм):',
      paramMin: 75,
      paramMax: 135,
      paramDefault: 95,
      steps: [
        {
          heading: 'Шаг 1: Заданы две базовые окружности R₁ и R₂',
          body: 'Измените ползунок параметра R, чтобы выбрать радиус сопрягающей дуги. Центры O₁ и O₂ фиксированы на координатной сетке.'
        },
        {
          heading: 'Шаг 2: Проведение вспомогательных дуг (R₁ + R) и (R₂ + R)',
          body: 'Из центра O₁ проводим вспомогательную дугу радиусом R₁ + R, а из центра O₂ — дугу радиусом R₂ + R до их взаимного пересечения в точке O₃.'
        },
        {
          heading: 'Шаг 3: Нахождение точек сопряжения K₁ и K₂',
          body: 'Соединяем найденный центр сопряжения O₃ прямыми линиями с центрами O₁ и O₂. На пересечении с исходными окружностями получаем точные точки касания K₁ и K₂.'
        },
        {
          heading: 'Шаг 4: Обводка сопрягающей дуги по ГОСТ 2.303',
          body: 'Устанавливаем опорную ножку циркуля в центр O₃ и проводим основную сплошную толстую линию от точки K₁ до K₂. Сопряжение завершено!'
        }
      ]
    },
    {
      id: 'monge',
      tag: 'УРОК 02 // ОРТОГОНАЛЬНЫЕ ПРОЕКЦИИ',
      title: 'Аппарат ортогонального проецирования и линии связи под 45°',
      paramLabel: 'Глубина паза детали Y (мм):',
      paramMin: 20,
      paramMax: 75,
      paramDefault: 45,
      steps: [
        {
          heading: 'Шаг 1: Построение главного вида (Фронтальная плоскость V)',
          body: 'Главный вид даёт наиболее полное представление о форме и размерах детали по осям X (длина) и Z (высота).'
        },
        {
          heading: 'Шаг 2: Проекционная связь с видом сверху (Плоскость H)',
          body: 'Опускаем вертикальные линии проекционной связи вниз от каждой характерной вершины главного вида. Ширина по оси X остаётся неизменной.'
        },
        {
          heading: 'Шаг 3: Постоянная прямая чертежа (Биссектриса 45°)',
          body: 'Проводим горизонтальные линии связи от вида сверху до прямой под углом 45° и поднимаем их вертикально вверх на профильную плоскость W.'
        },
        {
          heading: 'Шаг 4: Завершение вида слева (W) и проверка скрытых рёбер',
          body: 'На пересечении горизонтальных линий с главного вида и вертикальных линий от биссектрисы 45° строим точный профильный вид детали.'
        }
      ]
    },
    {
      id: 'isometric-axes',
      tag: 'УРОК 03 // АКСОНОМЕТРИЯ И ИЗОМЕТРИЯ',
      title: 'Построение изометрических осей (120°) и овала (эллипса) цилиндра',
      paramLabel: 'Диаметр цилиндрического отверстия D:',
      paramMin: 30,
      paramMax: 85,
      paramDefault: 56,
      steps: [
        {
          heading: 'Шаг 1: Изометрические оси X, Y, Z под углом 120°',
          body: 'Ось Z направлена вертикально вверх, а оси X и Y наклонены под углом 30° к горизонтали (между осями X, Y, Z ровно 120°).'
        },
        {
          heading: 'Шаг 2: Построение изометрического ромба со стороной D',
          body: 'Откладываем от центра вдоль изометрических осей X и Y отрезки, равные радиусу окружности, и строим описанный ромб.'
        },
        {
          heading: 'Шаг 3: Нахождение центров четырёх дуг овала',
          body: 'Из тупых углов ромба B и D проводим лучи к серединам противоположных сторон. Их пересечения на большой диагонали дают центры малых дуг O₁ и O₂.'
        },
        {
          heading: 'Шаг 4: Вычерчивание изометрического овала и образующих',
          body: 'Стягиваем четыре дуги окружностей в плавный изометрический овал и опускаем вертикальные образующие цилиндра вдоль оси Z.'
        }
      ]
    }
  ];

  // ==========================================================================
  // SPATIAL REASONING CHALLENGES (MODULE 05)
  // ==========================================================================
  const CHALLENGES = [
    {
      id: 1,
      category: 'ЗАДАНИЕ #1 // ЧТЕНИЕ ВИДА СВЕРХУ (H)',
      question: 'Изучите 3D-модель «Ступенчатая опора с пазом». Какой из четырёх чертежей является верным ВИДОМ СВЕРХУ (H)?',
      modelIdx: 0,
      targetView: 'top',
      correctOption: 0,
      xp: 120,
      explanation: 'На виде сверху (H) отчётливо видны три продольные ступени и П-образный вырез слева.'
    },
    {
      id: 2,
      category: 'ЗАДАНИЕ #2 // СКРЫТЫЕ РЁБРА НА ВИДЕ СЛЕВА (W)',
      question: 'Вращайте «Кронштейн с Т-образным вырезом». Выберите правильный ВИД СЛЕВА (профильная проекция W) со штриховыми линиями канала:',
      modelIdx: 1,
      targetView: 'left',
      correctOption: 2,
      xp: 150,
      explanation: 'Внутренний сквозной канал отображается горизонтальными штриховыми линиями на профильной проекции W.'
    },
    {
      id: 3,
      category: 'ЗАДАНИЕ #3 // ТЕЛА ВРАЩЕНИЯ (ВИД СПЕРЕДИ V)',
      question: 'Перед вами «Цилиндрическая втулка с фланцем». Какой чертёж соответствует ГЛАВНОМУ ВИДУ (спереди V)?',
      modelIdx: 2,
      targetView: 'front',
      correctOption: 1,
      xp: 140,
      explanation: 'На фронтальной проекции V цилиндрические ступени втулки проецируются в прямоугольники симметрично оси Z.'
    },
    {
      id: 4,
      category: 'ЗАДАНИЕ #4 // НАКЛОННЫЕ ЭЛЕМЕНТЫ (ВИД СПЕРЕДИ V)',
      question: 'Проанализируйте деталь «Направляющая с наклонным ребром». Укажите безошибочный ВИД СПЕРЕДИ (V):',
      modelIdx: 3,
      targetView: 'front',
      correctOption: 3,
      xp: 180,
      explanation: 'Наклонное ребро жёсткости на главном виде V образует прямоугольный треугольник между стенкой и базовой плитой.'
    }
  ];

  // ==========================================================================
  // ACHIEVEMENTS CATALOG
  // ==========================================================================
  const ACHIEVEMENTS = [
    { id: 'first-scan', icon: '⌖', name: 'Инженерный сканер', sub: 'Выполнен лазерный расчёт 3 ортогональных проекций', unlocked: true },
    { id: 'monge-master', icon: '📐', name: 'Адепт Гаспара Монжа', sub: 'Изучена проекционная связь плоскостей V, H, W', unlocked: true },
    { id: 'iso-architect', icon: '⬡', name: 'Изометрический архитектор', sub: 'Собрана 3D-конструкция в конструкторе', unlocked: true },
    { id: 'xray-vision', icon: '⌭', name: 'Рентгеновское зрение', sub: 'Пройдены испытания на чтение скрытых штриховых рёбер', unlocked: false },
    { id: 'cad-saved', icon: '💾', name: 'Главный конструктор', sub: 'Сохранена собственная 3D-сборка в архив чертежей', unlocked: false },
    { id: 'gost-expert', icon: '★', name: 'Эксперт ЕСКД ГОСТ 2.305', sub: 'Набрано более 1,800 XP в лаборатории', unlocked: false }
  ];

  return {
    vecSub,
    vecCross,
    vecNorm,
    vecDot,
    createBox,
    createCylinder,
    createWedge,
    createPyramid,
    createSphere,
    createVoxelSolid,
    mergeMeshes,
    compileMesh,
    createHeroAssembly,
    createBuilderPrimitive,
    PROJECTION_MODELS,
    SKILL_NODES,
    TRAINING_LESSONS,
    CHALLENGES,
    ACHIEVEMENTS
  };
})();

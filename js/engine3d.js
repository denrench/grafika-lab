/* ==========================================================================
   ГРАФИКА LAB — 3D CAD RENDERING & ORTHOGRAPHIC PROJECTION ENGINE (js/engine3d.js)
   Features:
   - True 3D Euler & Orbit Camera transformation (Z-up engineering coordinate system)
   - Painter's Algorithm with Back-Face Culling & Hidden Edge Detection
   - GOST 2.303-68 Line Types:
     * Solid thick lines (Visible contour edges)
     * Dashed lines (Hidden edges behind faces)
     * Dash-dot lines (Axes of symmetry & projection connection rays)
   - Exact Orthographic Ray-Polygon Occlusion Tester for Front (V), Top (H), Left (W)
   - Laser Scan 3D Slice Effect & Progressive Blueprint Drawing
   ========================================================================== */

window.GrafikaEngine3D = (function () {
  'use strict';

  const Models = window.GrafikaModels;

  // Transform a 3D point [x, y, z] (Z-up) using camera yaw (around Z) and pitch (around X)
  function transformPoint(pt, yaw, pitch, scale, explodeFactor, partDir) {
    let x = pt[0];
    let y = pt[1];
    let z = pt[2];

    if (explodeFactor && partDir) {
      x += partDir[0] * explodeFactor;
      y += partDir[1] * explodeFactor;
      z += partDir[2] * explodeFactor;
    }

    // Rotate around Z axis by yaw
    const cosZ = Math.cos(yaw);
    const sinZ = Math.sin(yaw);
    const x1 = x * cosZ - y * sinZ;
    const y1 = x * sinZ + y * cosZ;
    const z1 = z;

    // Rotate around X axis by pitch
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    // Screen X is x1, Screen Y is inverted z/y mix, depth is along view ray
    const sx = x1 * scale;
    const sy = (-z1 * cosX + y1 * sinX) * scale;
    const depth = y1 * cosX + z1 * sinX; // smaller depth = closer to viewer when looking from -Y

    return { sx, sy, depth, raw: [x, y, z] };
  }

  // Transform normal vector
  function transformNormal(n, yaw, pitch) {
    const cosZ = Math.cos(yaw);
    const sinZ = Math.sin(yaw);
    const x1 = n[0] * cosZ - n[1] * sinZ;
    const y1 = n[0] * sinZ + n[1] * cosZ;
    const z1 = n[2];

    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const nx = x1;
    const ny = -z1 * cosX + y1 * sinX;
    const nz = y1 * cosX + z1 * sinX; // nz < 0 faces camera
    return [nx, ny, nz];
  }

  function getThemeCanvas() {
    if (window.GrafikaAlbumAndTheme && window.GrafikaAlbumAndTheme.getActiveTheme) {
      return window.GrafikaAlbumAndTheme.getActiveTheme().canvas;
    }
    return {
      meshPrimary: '#D6BFA8',
      meshSecondary: '#C8AD92',
      meshAccent: '#BD8D65',
      meshSelected: '#BD8D65',
      edgeVisible: '#40352D',
      edgeHidden: '#BD8D65',
      gridLine: 'rgba(138, 98, 70, 0.14)',
      orthoGrid: 'rgba(138, 98, 70, 0.08)',
      axisX: '#B8564B',
      axisY: '#5B7F58',
      axisZ: '#8A6246',
      dimColor: '#8A6246',
      paperBg: '#FFF9F1',
      inkMain: '#40352D',
      inkAccent: '#8A6246',
      inkHidden: '#BD8D65',
      inkMuted: '#887A6E'
    };
  }

  // Shade hex color by brightness factor [0.72 .. 1.08]
  function shadeColor(hex, factor, alpha) {
    const tc = getThemeCanvas();
    const clean = (hex || tc.meshPrimary).replace('#', '');
    const r = Math.min(255, Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * factor)));
    if (alpha !== undefined && alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Draw 3D coordinate grid on XY plane (z = gridZ)
  function draw3DFloorGrid(ctx, cx, cy, yaw, pitch, scale, gridZ, radiusUnits, stepPx) {
    const tc = getThemeCanvas();
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = tc.gridLine;

    const maxCoord = radiusUnits * stepPx;
    for (let i = -radiusUnits; i <= radiusUnits; i++) {
      const c = i * stepPx;
      const p1 = transformPoint([-maxCoord, c, gridZ], yaw, pitch, scale);
      const p2 = transformPoint([maxCoord, c, gridZ], yaw, pitch, scale);
      ctx.beginPath();
      ctx.moveTo(cx + p1.sx, cy + p1.sy);
      ctx.lineTo(cx + p2.sx, cy + p2.sy);
      ctx.stroke();

      const q1 = transformPoint([c, -maxCoord, gridZ], yaw, pitch, scale);
      const q2 = transformPoint([c, maxCoord, gridZ], yaw, pitch, scale);
      ctx.beginPath();
      ctx.moveTo(cx + q1.sx, cy + q1.sy);
      ctx.lineTo(cx + q2.sx, cy + q2.sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw X, Y, Z coordinate axes with technical labels
  function draw3DAxes(ctx, cx, cy, yaw, pitch, scale, length) {
    const tc = getThemeCanvas();
    const origin = transformPoint([0, 0, 0], yaw, pitch, scale);
    const axes = [
      { label: 'X', end: [length, 0, 0], color: tc.axisX },
      { label: 'Y', end: [0, length, 0], color: tc.axisY },
      { label: 'Z', end: [0, 0, length], color: tc.axisZ }
    ];

    ctx.save();
    ctx.font = '700 11px "JetBrains Mono", monospace';
    for (const ax of axes) {
      const pEnd = transformPoint(ax.end, yaw, pitch, scale);
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + origin.sx, cy + origin.sy);
      ctx.lineTo(cx + pEnd.sx, cy + pEnd.sy);
      ctx.stroke();

      // Axis endpoint dot & label
      ctx.fillStyle = ax.color;
      ctx.beginPath();
      ctx.arc(cx + pEnd.sx, cy + pEnd.sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(ax.label, cx + pEnd.sx + 6, cy + pEnd.sy + 4);
    }
    ctx.restore();
  }

  // Draw transparent V, H, W projection planes in 3D space
  function drawProjectionPlanes3D(ctx, cx, cy, yaw, pitch, scale) {
    const S = 85;
    const planes = [
      { name: 'V', corners: [[-S, S, -S], [S, S, -S], [S, S, S], [-S, S, S]], color: 'rgba(138, 98, 70, 0.08)', border: 'rgba(138, 98, 70, 0.35)' },
      { name: 'H', corners: [[-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S]], color: 'rgba(189, 141, 101, 0.08)', border: 'rgba(189, 141, 101, 0.35)' },
      { name: 'W', corners: [[S, -S, -S], [S, S, -S], [S, S, S], [S, -S, S]], color: 'rgba(214, 191, 168, 0.14)', border: 'rgba(138, 98, 70, 0.3)' }
    ];

    ctx.save();
    ctx.font = '700 11px "JetBrains Mono", monospace';
    for (const pl of planes) {
      const pts = pl.corners.map(c => transformPoint(c, yaw, pitch, scale));
      ctx.fillStyle = pl.color;
      ctx.strokeStyle = pl.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(cx + p.sx, cy + p.sy);
        else ctx.lineTo(cx + p.sx, cy + p.sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8A6246';
      ctx.fillText(pl.name, cx + pts[2].sx - 14, cy + pts[2].sy + 14);
    }
    ctx.restore();
  }

  // Draw 3D CAD Dimension Line between two 3D points
  function draw3DDimension(ctx, cx, cy, pA, pB, offsetVec, label, yaw, pitch, scale) {
    const a0 = transformPoint(pA, yaw, pitch, scale);
    const b0 = transformPoint(pB, yaw, pitch, scale);
    const a1 = transformPoint([pA[0] + offsetVec[0], pA[1] + offsetVec[1], pA[2] + offsetVec[2]], yaw, pitch, scale);
    const b1 = transformPoint([pB[0] + offsetVec[0], pB[1] + offsetVec[1], pB[2] + offsetVec[2]], yaw, pitch, scale);

    ctx.save();
    ctx.strokeStyle = '#8A6246';
    ctx.fillStyle = '#8A6246';
    ctx.lineWidth = 1.1;

    // Extension lines
    ctx.beginPath();
    ctx.moveTo(cx + a0.sx, cy + a0.sy);
    ctx.lineTo(cx + a1.sx, cy + a1.sy);
    ctx.moveTo(cx + b0.sx, cy + b0.sy);
    ctx.lineTo(cx + b1.sx, cy + b1.sy);
    ctx.stroke();

    // Dimension line
    ctx.beginPath();
    ctx.moveTo(cx + a1.sx, cy + a1.sy);
    ctx.lineTo(cx + b1.sx, cy + b1.sy);
    ctx.stroke();

    // Midpoint label
    const mx = cx + (a1.sx + b1.sx) / 2;
    const my = cy + (a1.sy + b1.sy) / 2;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFF9F1';
    const tw = ctx.measureText(label).width + 10;
    ctx.fillRect(mx - tw / 2, my - 7, tw, 14);
    ctx.strokeRect(mx - tw / 2, my - 7, tw, 14);
    ctx.fillStyle = '#40352D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  // Main 3D Mesh Renderer on a 2D Canvas Context
  function renderMesh3D(ctx, mesh, options) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const cx = options.cx !== undefined ? options.cx : width / 2;
    const cy = options.cy !== undefined ? options.cy : height / 2;
    const yaw = options.yaw || -0.68;
    const pitch = options.pitch || 0.48;
    const scale = options.scale || 1.8;
    const mode = options.mode || 'solid'; // 'solid' | 'wireframe' | 'hidden' | 'ortho'
    const showAxes = options.showAxes !== false;
    const showGrid = options.showGrid !== false;
    const showHiddenEdges = !!options.showHiddenEdges || mode === 'hidden';
    const showDimensions = !!options.showDimensions;
    const showPlanes = !!options.showPlanes;
    const explodeFactor = options.explodeFactor || 0;
    const scanProgress = options.scanProgress; // null or [0..1]

    if (options.clear !== false) {
      ctx.clearRect(0, 0, width, height);
    }

    if (showGrid) {
      draw3DFloorGrid(ctx, cx, cy, yaw, pitch, scale, options.gridZ !== undefined ? options.gridZ : -42, 5, 28);
    }

    if (showPlanes) {
      drawProjectionPlanes3D(ctx, cx, cy, yaw, pitch, scale);
    }

    // Transform all vertices per face (to support per-part explode offsets)
    const lightDir = Models.vecNorm([-0.45, -0.65, 0.62]);

    const preparedFaces = mesh.faces.map((f, fIdx) => {
      const partDir = f.partDir || [0, 0, 0];
      const tPts = f.idx.map(vi => transformPoint(mesh.vertices[vi], yaw, pitch, scale, explodeFactor, partDir));
      const tNorm = transformNormal(f.normal, yaw, pitch);
      let avgDepth = 0;
      for (const p of tPts) avgDepth += p.depth;
      avgDepth /= tPts.length;

      // Facing camera if tNorm[2] < 0
      const isFront = tNorm[2] < 0.02;
      const diffuse = Math.max(0, Models.vecDot(f.normal, lightDir));
      const brightness = 0.78 + diffuse * 0.34;

      return {
        fIdx,
        face: f,
        tPts,
        tNorm,
        avgDepth,
        isFront,
        brightness
      };
    });

    // Sort faces back-to-front (largest depth to smallest depth)
    const sortedFaces = preparedFaces.slice().sort((a, b) => b.avgDepth - a.avgDepth);

    const tc = getThemeCanvas();

    // 1. If hidden edges are enabled, draw back-facing / occluded crease edges first as dashed lines
    if (showHiddenEdges && mode !== 'wireframe') {
      ctx.save();
      ctx.strokeStyle = tc.edgeHidden;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);

      for (const edge of mesh.edges) {
        if (!edge.isCrease) continue;
        // Check if edge belongs solely to back faces or mixed
        const f0 = preparedFaces[edge.faces[0]];
        const f1 = edge.faces[1] !== undefined ? preparedFaces[edge.faces[1]] : null;
        const isHidden = (!f0.isFront) && (!f1 || !f1.isFront);
        if (isHidden) {
          const partDir = f0.face.partDir || [0, 0, 0];
          const pA = transformPoint(mesh.vertices[edge.a], yaw, pitch, scale, explodeFactor, partDir);
          const pB = transformPoint(mesh.vertices[edge.b], yaw, pitch, scale, explodeFactor, partDir);
          ctx.beginPath();
          ctx.moveTo(cx + pA.sx, cy + pA.sy);
          ctx.lineTo(cx + pB.sx, cy + pB.sy);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2. Draw solid faces (Painter's algorithm)
    for (const pf of sortedFaces) {
      ctx.beginPath();
      pf.tPts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(cx + p.sx, cy + p.sy);
        else ctx.lineTo(cx + p.sx, cy + p.sy);
      });
      ctx.closePath();

      if (mode !== 'wireframe') {
        const fillAlpha = showHiddenEdges ? 0.82 : 0.97;
        // Map warm default hexes to active theme mesh colors
        let baseCol = tc.meshPrimary;
        if (pf.face.color === '#BD8D65' || pf.face.color === '#B58963') baseCol = tc.meshAccent;
        else if (pf.face.color === '#C8AD92' || pf.face.color === '#CFB69E') baseCol = tc.meshSecondary;
        ctx.fillStyle = shadeColor(baseCol, pf.brightness, fillAlpha);
        ctx.fill();

        // Subtle polygon edge seal
        ctx.strokeStyle = pf.face.smooth ? shadeColor(baseCol, pf.brightness * 0.98, fillAlpha) : tc.gridLine;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      } else {
        // Wireframe mode
        ctx.strokeStyle = pf.isFront ? tc.edgeVisible : tc.gridLine;
        ctx.lineWidth = pf.isFront ? 1.3 : 0.8;
        ctx.stroke();
      }
    }

    // 3. Draw sharp visible CAD feature edges on front-facing geometry
    if (mode !== 'wireframe') {
      ctx.save();
      ctx.strokeStyle = options.highlightOutline ? tc.meshAccent : tc.edgeVisible;
      ctx.lineWidth = options.highlightOutline ? 2.0 : 1.45;

      for (const edge of mesh.edges) {
        if (!edge.isCrease) continue;
        const f0 = preparedFaces[edge.faces[0]];
        const f1 = edge.faces[1] !== undefined ? preparedFaces[edge.faces[1]] : null;
        const isVisible = f0.isFront || (f1 && f1.isFront);
        if (isVisible) {
          const partDir = f0.face.partDir || [0, 0, 0];
          const pA = transformPoint(mesh.vertices[edge.a], yaw, pitch, scale, explodeFactor, partDir);
          const pB = transformPoint(mesh.vertices[edge.b], yaw, pitch, scale, explodeFactor, partDir);
          ctx.beginPath();
          ctx.moveTo(cx + pA.sx, cy + pA.sy);
          ctx.lineTo(cx + pB.sx, cy + pB.sy);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 4. Axes overlay
    if (showAxes) {
      draw3DAxes(ctx, cx, cy, yaw, pitch, scale, options.axisLength || 82);
    }

    // 5. Optional 3D Dimensions
    if (showDimensions) {
      // Compute bounding box
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const v of mesh.vertices) {
        if (v[0] < minX) minX = v[0];
        if (v[0] > maxX) maxX = v[0];
        if (v[1] < minY) minY = v[1];
        if (v[1] > maxY) maxY = v[1];
        if (v[2] < minZ) minZ = v[2];
        if (v[2] > maxZ) maxZ = v[2];
      }
      draw3DDimension(ctx, cx, cy, [minX, minY, minZ], [maxX, minY, minZ], [0, -18, 0], `${Math.round(maxX - minX)}`, yaw, pitch, scale);
      draw3DDimension(ctx, cx, cy, [maxX, minY, minZ], [maxX, maxY, minZ], [18, 0, 0], `${Math.round(maxY - minY)}`, yaw, pitch, scale);
      draw3DDimension(ctx, cx, cy, [minX, maxY, minZ], [minX, maxY, maxZ], [-18, 0, 0], `${Math.round(maxZ - minZ)}`, yaw, pitch, scale);
    }

    // 6. Laser Scan Plane Animation Effect (if scanProgress is active in [0..1])
    if (typeof scanProgress === 'number' && scanProgress >= 0 && scanProgress <= 1) {
      const scanZ = 65 - scanProgress * 130;
      const S = 78;
      const corners = [
        [-S, -S, scanZ],
        [S, -S, scanZ],
        [S, S, scanZ],
        [-S, S, scanZ]
      ].map(c => transformPoint(c, yaw, pitch, scale));

      ctx.save();
      ctx.fillStyle = 'rgba(189, 141, 101, 0.22)';
      ctx.strokeStyle = '#8A6246';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#BD8D65';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      corners.forEach((p, i) => {
        if (i === 0) ctx.moveTo(cx + p.sx, cy + p.sy);
        else ctx.lineTo(cx + p.sx, cy + p.sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    return sortedFaces;
  }

  // ==========================================================================
  // TRUE ORTHOGRAPHIC PROJECTION & HIDDEN-LINE OCCLUSION ENGINE
  // Views:
  // - 'front' (V): projects along +Y. 2D coords: u = +X, v = -Z, depth = +Y (smaller Y is closer)
  // - 'top'   (H): projects along -Z. 2D coords: u = +X, v = +Y, depth = -Z (larger Z is closer)
  // - 'left'  (W): projects along +X. 2D coords: u = +Y, v = -Z, depth = +X (smaller X is closer)
  // ==========================================================================

  function projectVertexOrtho(pt, viewType) {
    const x = pt[0], y = pt[1], z = pt[2];
    if (viewType === 'front') {
      return { u: x, v: -z, depth: y };
    } else if (viewType === 'top') {
      return { u: x, v: y, depth: -z };
    } else if (viewType === 'left') {
      return { u: y, v: -z, depth: x };
    }
    return { u: x, v: -z, depth: y };
  }

  // Point-in-2D-polygon test (even-odd / winding) with strict interior margin
  function pointStrictlyInPoly2D(pu, pv, polyPts) {
    // Bounding box check
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const p of polyPts) {
      if (p.u < minU) minU = p.u;
      if (p.u > maxU) maxU = p.u;
      if (p.v < minV) minV = p.v;
      if (p.v > maxV) maxV = p.v;
    }
    const eps = 0.35;
    if (pu <= minU + eps || pu >= maxU - eps || pv <= minV + eps || pv >= maxV - eps) {
      return false;
    }

    // Distance to polygon edges check (don't occlude points lying on the boundary of the polygon)
    for (let i = 0; i < polyPts.length; i++) {
      const a = polyPts[i];
      const b = polyPts[(i + 1) % polyPts.length];
      const du = b.u - a.u;
      const dv = b.v - a.v;
      const lenSq = du * du + dv * dv;
      if (lenSq > 0.0001) {
        const t = Math.max(0, Math.min(1, ((pu - a.u) * du + (pv - a.v) * dv) / lenSq));
        const dist = Math.hypot(pu - (a.u + t * du), pv - (a.v + t * dv));
        if (dist < 0.45) return false;
      }
    }

    let inside = false;
    for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
      const xi = polyPts[i].u, yi = polyPts[i].v;
      const xj = polyPts[j].u, yj = polyPts[j].v;
      const intersect = ((yi > pv) !== (yj > pv)) &&
        (pu < (xj - xi) * (pv - yi) / (yj - yi + 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Compute exact 2D orthographic visible & hidden segments for a 3D mesh
  function computeOrthoDrawing(mesh, viewType, variantMutation) {
    const projVerts = mesh.vertices.map(v => projectVertexOrtho(v, viewType));

    // Prepare projected polygons for occlusion testing
    const projFaces = mesh.faces.map((f) => {
      const pts = f.idx.map(vi => projVerts[vi]);
      let minDepth = Infinity;
      let avgDepth = 0;
      for (const p of pts) {
        if (p.depth < minDepth) minDepth = p.depth;
        avgDepth += p.depth;
      }
      avgDepth /= pts.length;
      return { pts, minDepth, avgDepth };
    });

    const visibleSegments = [];
    const hiddenSegments = [];
    const seenVisible = new Set();
    const seenHidden = new Set();

    function segKey(u1, v1, u2, v2) {
      const a = `${Math.round(u1 * 2)},${Math.round(v1 * 2)}`;
      const b = `${Math.round(u2 * 2)},${Math.round(v2 * 2)}`;
      return a < b ? `${a}_${b}` : `${b}_${a}`;
    }

    for (const edge of mesh.edges) {
      if (!edge.isCrease) continue;
      const pA = projVerts[edge.a];
      const pB = projVerts[edge.b];
      const len2D = Math.hypot(pB.u - pA.u, pB.v - pA.v);
      if (len2D < 0.8) continue; // Foreshortened perpendicular edge

      // Test midpoint of edge against all faces
      const midU = (pA.u + pB.u) / 2;
      const midV = (pA.v + pB.v) / 2;
      const midDepth = (pA.depth + pB.depth) / 2;

      let occluded = false;
      for (let fIdx = 0; fIdx < projFaces.length; fIdx++) {
        if (edge.faces.includes(fIdx)) continue;
        const pf = projFaces[fIdx];
        // If face is closer to camera than edge midpoint
        if (pf.avgDepth < midDepth - 0.8) {
          if (pointStrictlyInPoly2D(midU, midV, pf.pts)) {
            occluded = true;
            break;
          }
        }
      }

      const key = segKey(pA.u, pA.v, pB.u, pB.v);
      if (!occluded) {
        if (!seenVisible.has(key)) {
          seenVisible.add(key);
          visibleSegments.push({ u1: pA.u, v1: pA.v, u2: pB.u, v2: pB.v });
        }
      } else {
        if (!seenHidden.has(key) && !seenVisible.has(key)) {
          seenHidden.add(key);
          hiddenSegments.push({ u1: pA.u, v1: pA.v, u2: pB.u, v2: pB.v });
        }
      }
    }

    // Filter out hidden segments that lie directly under a visible segment
    const cleanHidden = hiddenSegments.filter(h => {
      const k = segKey(h.u1, h.v1, h.u2, h.v2);
      return !seenVisible.has(k);
    });

    // Optional challenge distractor mutations (for incorrect quiz choices)
    if (variantMutation === 'swap-hidden') {
      // Remove hidden lines or turn them solid
      return { visibleSegments: visibleSegments.concat(cleanHidden), hiddenSegments: [] };
    } else if (variantMutation === 'mirror-u') {
      return {
        visibleSegments: visibleSegments.map(s => ({ u1: -s.u1, v1: s.v1, u2: -s.u2, v2: s.v2 })),
        hiddenSegments: cleanHidden.map(s => ({ u1: -s.u1, v1: s.v1, u2: -s.u2, v2: s.v2 }))
      };
    } else if (variantMutation === 'drop-inner') {
      return {
        visibleSegments: visibleSegments.filter((_, idx) => idx % 3 !== 1),
        hiddenSegments: []
      };
    }

    return { visibleSegments, hiddenSegments: cleanHidden };
  }

  // Render an orthographic engineering drawing onto a 2D canvas
  function renderOrthoView(ctx, mesh, viewType, options) {
    options = options || {};
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = options.scale || 1.45;
    const showHidden = options.showHidden !== false;
    const showAxes = options.showAxes !== false;
    const showDims = options.showDims !== false;
    const drawProgress = options.drawProgress !== undefined ? options.drawProgress : 1;

    ctx.clearRect(0, 0, w, h);

    const tc = getThemeCanvas();

    // Subtle millimeter grid
    ctx.save();
    ctx.strokeStyle = tc.orthoGrid;
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = (cx % step); x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = (cy % step); y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    // Symmetry centerlines (dash-dot GOST line)
    if (showAxes) {
      ctx.save();
      ctx.strokeStyle = tc.inkMuted;
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 4, 2, 4]);
      ctx.beginPath();
      ctx.moveTo(14, cy); ctx.lineTo(w - 14, cy);
      ctx.moveTo(cx, 14); ctx.lineTo(cx, h - 14);
      ctx.stroke();
      ctx.restore();
    }

    const { visibleSegments, hiddenSegments } = computeOrthoDrawing(mesh, viewType, options.variantMutation);

    // Draw hidden edges (dashed caramel/brown)
    if (showHidden && hiddenSegments.length > 0) {
      ctx.save();
      ctx.strokeStyle = tc.inkHidden;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 4]);
      const maxH = Math.ceil(hiddenSegments.length * drawProgress);
      for (let i = 0; i < maxH; i++) {
        const s = hiddenSegments[i];
        ctx.beginPath();
        ctx.moveTo(cx + s.u1 * scale, cy + s.v1 * scale);
        ctx.lineTo(cx + s.u2 * scale, cy + s.v2 * scale);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw visible edges (solid thick technical ink)
    ctx.save();
    ctx.strokeStyle = tc.inkMain;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    const maxV = Math.ceil(visibleSegments.length * drawProgress);
    for (let i = 0; i < maxV; i++) {
      const s = visibleSegments[i];
      ctx.beginPath();
      ctx.moveTo(cx + s.u1 * scale, cy + s.v1 * scale);
      ctx.lineTo(cx + s.u2 * scale, cy + s.v2 * scale);
      ctx.stroke();
    }
    ctx.restore();

    // Draw overall dimension annotation if requested
    if (showDims && visibleSegments.length > 0 && drawProgress >= 0.95) {
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (const s of visibleSegments) {
        minU = Math.min(minU, s.u1, s.u2);
        maxU = Math.max(maxU, s.u1, s.u2);
        minV = Math.min(minV, s.v1, s.v2);
        maxV = Math.max(maxV, s.v1, s.v2);
      }
      ctx.save();
      ctx.strokeStyle = tc.inkAccent;
      ctx.fillStyle = tc.inkAccent;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      const dimY = cy + maxV * scale + 18;
      if (dimY < h - 8) {
        ctx.beginPath();
        ctx.moveTo(cx + minU * scale, cy + maxV * scale + 3);
        ctx.lineTo(cx + minU * scale, dimY + 3);
        ctx.moveTo(cx + maxU * scale, cy + maxV * scale + 3);
        ctx.lineTo(cx + maxU * scale, dimY + 3);
        ctx.moveTo(cx + minU * scale, dimY);
        ctx.lineTo(cx + maxU * scale, dimY);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(maxU - minU)}`, cx + ((minU + maxU) / 2) * scale, dimY - 3);
      }
      ctx.restore();
    }
  }

  // Render Complete Monge Epure (All 3 Views + 45-degree Projection Connection Lines)
  function renderMongeEpure(ctx, mesh, options) {
    const tc = getThemeCanvas();
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = Math.round(w * 0.48);
    const oy = Math.round(h * 0.48);
    const sc = options.scale || 0.52;
    const showHelpers = options.showHelpers !== false;
    const showHidden = options.showHidden !== false;

    // Coordinate axes X, Y, Z and 45 deg bisector
    ctx.save();
    ctx.strokeStyle = tc.inkAccent;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(10, oy); ctx.lineTo(w - 10, oy); // X / Y1 axis
    ctx.moveTo(ox, 10); ctx.lineTo(ox, h - 10); // Z / Y axis
    ctx.stroke();

    // 45-degree constant line in bottom-right quadrant
    const bisLen = Math.min(w - ox, h - oy) - 10;
    ctx.strokeStyle = tc.inkHidden;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + bisLen, oy + bisLen);
    ctx.stroke();

    ctx.fillStyle = tc.inkMuted;
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText('V', 14, 20);
    ctx.fillText('W', w - 22, 20);
    ctx.fillText('H', 14, h - 10);
    ctx.fillStyle = tc.inkAccent;
    ctx.fillText('45°', ox + bisLen - 22, oy + bisLen - 6);
    ctx.restore();

    // Quadrant centers
    const vCx = ox - 56, vCy = oy - 50; // Front (top-left)
    const hCx = ox - 56, hCy = oy + 52; // Top (bottom-left)
    const wCx = ox + 56, wCy = oy - 50; // Left (top-right)

    // Compute bounding extremes for helper projection rays
    if (showHelpers && mesh.vertices.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const v of mesh.vertices) {
        minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
        minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
        minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
      }

      ctx.save();
      ctx.strokeStyle = tc.inkHidden;
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 3]);

      // Vertical projection rays between V and H (X coordinates)
      for (const xVal of [minX, maxX]) {
        ctx.beginPath();
        ctx.moveTo(vCx + xVal * sc, vCy - minZ * sc);
        ctx.lineTo(hCx + xVal * sc, hCy + maxY * sc);
        ctx.stroke();
      }

      // Horizontal projection rays between V and W (Z coordinates)
      for (const zVal of [minZ, maxZ]) {
        ctx.beginPath();
        ctx.moveTo(vCx + maxX * sc, vCy - zVal * sc);
        ctx.lineTo(wCx + maxY * sc, wCy - zVal * sc);
        ctx.stroke();
      }

      // H -> 45 deg line -> W rays (Y coordinates)
      for (const yVal of [minY, maxY]) {
        const rayY = hCy + yVal * sc;
        const distFromOy = rayY - oy;
        const turnX = ox + distFromOy;
        ctx.beginPath();
        ctx.moveTo(hCx + maxX * sc, rayY);
        ctx.lineTo(turnX, rayY);
        ctx.lineTo(turnX, wCy - maxZ * sc);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Helper to draw mini view at offset (cx, cy)
    function drawSubView(viewType, subCx, subCy) {
      const { visibleSegments, hiddenSegments } = computeOrthoDrawing(mesh, viewType);
      if (showHidden) {
        ctx.save();
        ctx.strokeStyle = tc.inkHidden;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        for (const s of hiddenSegments) {
          ctx.beginPath();
          ctx.moveTo(subCx + s.u1 * sc, subCy + s.v1 * sc);
          ctx.lineTo(subCx + s.u2 * sc, subCy + s.v2 * sc);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = tc.inkMain;
      ctx.lineWidth = 1.45;
      for (const s of visibleSegments) {
        ctx.beginPath();
        ctx.moveTo(subCx + s.u1 * sc, subCy + s.v1 * sc);
        ctx.lineTo(subCx + s.u2 * sc, subCy + s.v2 * sc);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSubView('front', vCx, vCy);
    drawSubView('top', hCx, hCy);
    drawSubView('left', ox + (hCy - oy), wCy);
  }

  return {
    transformPoint,
    renderMesh3D,
    computeOrthoDrawing,
    renderOrthoView,
    renderMongeEpure
  };
})();

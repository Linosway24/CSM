# Cursor Mega-Refactor Prompt — COMPLETE
**Project:** OEHSA Interactive Hazard Map (CesiumJS)  
**Goal:** Unify hazard schema, externalize config, add offline fallback, centralize colors/icons, and improve hover & filter logic.  
**Environment:** You are running in Cursor with Git + Webpack.  

---

## 🧭 HOW TO USE
1) **You already created a branch** (good).  
2) Add this file to your repo as `refactor-oehsa-map.md`.  
3) Open it in **Cursor** and click **Run**.  
4) Review the diffs it opens and click **Apply** to write files.  
5) Build & test: `npm run build` then serve your `public/` folder.

---

## 📦 FILE PLAN
Create / overwrite the following **exact** files:

**New files**
- `public/config.json`
- `src/core/schema.js`
- `src/core/colors.js`
- `src/core/icons.js`

**Replace (full overwrite)**
- `src/hazardManager.js`
- `src/filterManager.js`
- `src/uiManager.js`
- `src/main.js`

> Note: This assumes you keep your app code in `/src` and static assets (index.html, cesium assets, css) in `/public` or root. If your current code files live in the project root, you can move them into `/src` or adjust imports accordingly.

---

## ⚙️ IMPLEMENTATION (write these files exactly as shown)

### `public/config.json`
```json
{
  "cesiumToken": "PUT-YOUR-CESIUM-ION-TOKEN-HERE",
  "dataFile": "./data/Hill Air Force Vectors.geojson",
  "offlineFallback": true
}
```

---

### `src/core/schema.js`
```js
export const HazardSchema = {
  id: 'hazardId',
  type: 'hazardType',
  medium: 'environmentalMedium',
  severity: 'severity',
  location: 'location',
  probability: 'probability'
};

// Normalizes any incoming GeoJSON feature to our canonical property names
export function normalizeFeature(feature) {
  const p = feature?.properties ?? {};
  const hazardType = (p.hazard_type ?? p.hazardType ?? 'environmental').toString().toLowerCase();
  const medium = (p.environmental_medium ?? p.environmentalMedium ?? 'soil').toString().toLowerCase();
  const severity = Number(p.severity_level ?? p.severity ?? 1);

  return {
    ...feature,
    properties: {
      hazardId: p.hazard_id ?? p.hazardId ?? p.id ?? null,
      hazardType,
      environmentalMedium: medium,
      severity,
      location: p.location_description ?? p.location ?? p.display_name ?? 'Unknown location',
      probability: p.probability ? Number(p.probability) : undefined,
      // keep originals for reference (non-destructive)
      ...p
    }
  };
}
```

---

### `src/core/colors.js`
```js
import * as Cesium from 'cesium';

export const HAZARD_COLORS = {
  chemical: '#FFD700',
  biological: '#32CD32',
  radiological: '#FF8C00',
  nuclear: '#FF0000',
  environmental: '#4169E1',
  physical: '#8A2BE2'
};

export function colorFor(type = 'environmental', alpha = 0.5) {
  const css = HAZARD_COLORS[type] || '#95a5a6';
  return Cesium.Color.fromCssColorString(css).withAlpha(alpha);
}
```

---

### `src/core/icons.js`
```js
export function svgDot(color = '#95a5a6') {
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
       <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
     </svg>`
  );
}
```

---

### `src/hazardManager.js`
```js
// Hazard Manager - Handles hazard data loading, display, and interaction
import { normalizeFeature } from './core/schema.js';
import { colorFor, HAZARD_COLORS } from './core/colors.js';
import { svgDot } from './core/icons.js';
import * as Cesium from 'cesium';

export class HazardManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.hazardData = [];
    this.hazardEntities = [];
  }

  async loadHazardData(dataFile) {
    const res = await fetch(dataFile);
    if (!res.ok) throw new Error(\`Failed to load data: \${res.statusText}\`);
    const geojson = await res.json();

    const normalized = {
      type: 'FeatureCollection',
      features: (geojson.features || []).map(normalizeFeature)
    };

    this.processHazardData(normalized);
    console.log(\`Loaded \${this.hazardData.length} hazard features\`);
  }

  processHazardData(geojson) {
    this.hazardData = geojson.features || [];
    this.hazardData.forEach((feature, index) => {
      if (feature.geometry?.type === 'Polygon') this.createHazardEntity(feature, index);
    });
  }

  createHazardEntity(feature, index) {
    const p = feature.properties || {};
    const type = p.hazardType || 'environmental';
    const severity = Number(p.severity) || 1;

    // flatten coordinates: [ [ [lon,lat], ... ] ] -> [lon,lat,lon,lat,...]
    const flat = feature.geometry.coordinates[0].flat();
    const entity = this.viewer.entities.add({
      id: \`hazard-\${index}\`,
      name: \`\${type} Hazard\`,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(flat),
        material: colorFor(type, 0.35 + Math.min(severity, 5) * 0.1),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: Math.min(2 + severity, 6),
        height: 0,
        extrudedHeight: 10
      },
      properties: {
        hazardType: type,
        severity,
        medium: p.environmentalMedium,
        location: p.location,
        originalFeature: feature
      }
    });

    const centroid = this.calculatePolygonCentroid(feature.geometry.coordinates[0]);
    const icon = svgDot(HAZARD_COLORS[type] || '#95a5a6');

    const pin = this.viewer.entities.add({
      id: \`hazard-pin-\${index}\`,
      name: \`\${type} Hazard Pin\`,
      position: Cesium.Cartesian3.fromDegrees(centroid.longitude, centroid.latitude, 0),
      billboard: {
        image: icon,
        scale: 0.5,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      },
      properties: {
        hazardType: type,
        severity,
        medium: p.environmentalMedium,
        location: p.location,
        originalFeature: feature,
        parentEntity: entity
      }
    });

    this.hazardEntities.push({ entity, pinEntity: pin, feature });
  }

  calculatePolygonCentroid(coords) {
    let x = 0, y = 0;
    const n = coords.length;
    coords.forEach(([lon, lat]) => { x += lon; y += lat; });
    return { longitude: x / n, latitude: y / n };
  }

  getHazardEntities() { return this.hazardEntities; }
}
```

---

### `src/filterManager.js`
```js
// Filter Manager - Handles hazard filtering by type, medium, and severity
export class FilterManager {
  constructor(hazardManager) {
    this.hazardManager = hazardManager;
    this.activeFilters = {
      hazardTypes: new Set(['chemical', 'biological', 'radiological', 'nuclear', 'environmental', 'physical']),
      environmentalMediums: new Set(['air', 'water', 'soil', 'groundwater']),
      severityLevels: new Set(['1', '2', '3', '4', '5'])
    };
    this.filteredEntities = [];
  }

  initializeFilters() {
    this.applyFilters();
  }

  updateHazardTypeFilter(type, isSelected) {
    const v = (type || '').toLowerCase();
    if (isSelected) this.activeFilters.hazardTypes.add(v);
    else this.activeFilters.hazardTypes.delete(v);
    this.applyFilters();
  }

  updateEnvironmentalMediumFilter(medium, isSelected) {
    const v = (medium || '').toLowerCase();
    if (isSelected) this.activeFilters.environmentalMediums.add(v);
    else this.activeFilters.environmentalMediums.delete(v);
    this.applyFilters();
  }

  updateSeverityLevelFilter(level, isSelected) {
    const v = String(level);
    if (isSelected) this.activeFilters.severityLevels.add(v);
    else this.activeFilters.severityLevels.delete(v);
    this.applyFilters();
  }

  applyFilters() {
    const entities = this.hazardManager.getHazardEntities();
    this.filteredEntities = [];

    entities.forEach(({ entity, pinEntity }) => {
      const props = entity.properties;
      const type = props.hazardType?.getValue?.().toLowerCase?.() ?? props.hazardType?.toLowerCase?.();
      const medium = props.medium?.getValue?.().toLowerCase?.() ?? props.medium?.toLowerCase?.();
      const severity = String(props.severity?.getValue?.() ?? props.severity ?? '1');

      const isVisible =
        this.activeFilters.hazardTypes.has(type) &&
        this.activeFilters.environmentalMediums.has(medium) &&
        this.activeFilters.severityLevels.has(severity);

      entity.show = isVisible;
      pinEntity.show = isVisible;
      if (isVisible) this.filteredEntities.push({ entity, pinEntity });
    });

    this.updateHazardCount();
    console.log(\`Filtered to \${this.filteredEntities.length} visible hazards\`);
  }

  clearAllFilters() {
    this.activeFilters.hazardTypes.clear();
    this.activeFilters.environmentalMediums.clear();
    this.activeFilters.severityLevels.clear();
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));

    const entities = this.hazardManager.getHazardEntities();
    this.filteredEntities = [];
    entities.forEach(({ entity, pinEntity }) => {
      entity.show = true;
      pinEntity.show = true;
      this.filteredEntities.push({ entity, pinEntity });
    });
    this.updateHazardCount();
  }

  updateHazardCount() {
    const el = document.getElementById('hazardCount');
    if (el) el.textContent = this.filteredEntities.length;
  }

  getFilteredEntities() { return this.filteredEntities; }
  getActiveFilters() { return this.activeFilters; }
}
```

---

### `src/uiManager.js`
```js
// UI Manager - Handles user interface interactions and display
import * as Cesium from 'cesium';

export class UIManager {
  constructor(viewer, hazardManager, filterManager) {
    this.viewer = viewer;
    this.hazardManager = hazardManager;
    this.filterManager = filterManager;
    this.infoPanel = null;
    this.infoBubble = null;
    this.currentHoveredEntity = null;
    this._lastHoverId = null;
    this._lastHoverTs = 0;
  }

  initialize() {
    this.infoPanel = document.getElementById('infoPanel');
    this.infoBubble = document.getElementById('infoBubble');
    this.setupEventListeners();
    this.setupFilterListeners();
  }

  setupEventListeners() {
    const handler = this.viewer.cesiumWidget.screenSpaceEventHandler;

    // Click
    handler.setInputAction((event) => {
      const pickedObject = this.viewer.scene.pick(event.position);
      if (pickedObject?.id) this.handleHazardClick(pickedObject.id);
      else this.closeInfoPanel();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Hover (throttled)
    handler.setInputAction((event) => {
      const now = performance.now();
      if (now - this._lastHoverTs < 80) return;
      this._lastHoverTs = now;

      const pickedObject = this.viewer.scene.pick(event.endPosition);
      const id = pickedObject?.id;
      if (id && id !== this._lastHoverId) {
        this._lastHoverId = id;
        this.handleHazardHover(id, event.endPosition);
      } else if (!id && this._lastHoverId) {
        this._lastHoverId = null;
        this.hideInfoBubble();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  setupFilterListeners() {
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        const isChecked = e.target.checked;
        const title = e.target.closest('.filter-group').querySelector('h4').textContent.toLowerCase();

        if (title.includes('hazard type')) this.filterManager.updateHazardTypeFilter(value, isChecked);
        else if (title.includes('environmental medium')) this.filterManager.updateEnvironmentalMediumFilter(value, isChecked);
        else if (title.includes('severity level')) this.filterManager.updateSeverityLevelFilter(value, isChecked);
      });
    });
  }

  handleHazardClick(entity) {
    const p = entity.properties;
    const hazardType = p.hazardType?.getValue?.() ?? p.hazardType ?? 'Unknown';
    const location = p.location?.getValue?.() ?? p.location ?? 'Unknown location';
    const severity = p.severity?.getValue?.() ?? p.severity ?? 'Unknown';
    const medium = p.medium?.getValue?.() ?? p.medium ?? 'Unknown';

    this.showInfoPanel({ type: hazardType, location, severity, medium });
    this.highlightHazard(entity);
  }

  handleHazardHover(entity, position) {
    const p = entity.properties;
    const hazardType = p.hazardType?.getValue?.() ?? p.hazardType ?? 'Unknown';
    const severity = p.severity?.getValue?.() ?? p.severity ?? 'Unknown';
    this.showInfoBubble({ type: hazardType, severity }, position);
    this.currentHoveredEntity = entity;
  }

  showInfoPanel(h) {
    if (!this.infoPanel) return;
    const t = document.getElementById('infoType');
    const l = document.getElementById('infoLocation');
    const s = document.getElementById('infoSeverity');
    const m = document.getElementById('infoMedium');
    if (t) t.textContent = h.type;
    if (l) l.textContent = h.location;
    if (s) s.textContent = \`Level \${h.severity}\`;
    if (m) m.textContent = h.medium;
    this.infoPanel.classList.remove('hidden');
  }

  closeInfoPanel() {
    if (this.infoPanel) this.infoPanel.classList.add('hidden');
    this.clearHazardHighlight();
  }

  showInfoBubble(h, position) {
    if (!this.infoBubble) return;
    const bt = document.getElementById('bubbleType');
    const bs = document.getElementById('bubbleSeverity');
    if (bt) bt.textContent = h.type;
    if (bs) bs.textContent = \`Severity: \${h.severity}\`;

    const canvasRect = this.viewer.canvas.getBoundingClientRect();
    this.infoBubble.style.left = \`\${position.x + canvasRect.left}px\`;
    this.infoBubble.style.top = \`\${position.y + canvasRect.top - 40}px\`;
    this.infoBubble.classList.remove('hidden');
  }

  hideInfoBubble() {
    if (this.infoBubble) this.infoBubble.classList.add('hidden');
    this.currentHoveredEntity = null;
  }

  highlightHazard(entity) {
    this.clearHazardHighlight();
    if (entity.polygon) {
      entity.polygon.outlineColor = Cesium.Color.YELLOW;
      entity.polygon.outlineWidth = 4;
    }
  }

  clearHazardHighlight() {
    const entities = this.hazardManager.getHazardEntities();
    entities.forEach(({ entity }) => {
      if (entity.polygon) {
        const sev = Number(entity.properties.severity?.getValue?.() ?? entity.properties.severity ?? 1);
        entity.polygon.outlineColor = Cesium.Color.BLACK;
        entity.polygon.outlineWidth = Math.min(2 + sev, 6);
      }
    });
  }
}
```

---

### `src/main.js`
```js
// OEHSA Interactive Hazard Map - Main Application
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
// If your css lives at /css/styles.css at project root (sibling of /src), use ../css/...
import '../css/styles.css';

import { MapManager } from './mapManager.js';
import { HazardManager } from './hazardManager.js';
import { FilterManager } from './filterManager.js';
import { UIManager } from './uiManager.js';

async function loadConfig() {
  try {
    const res = await fetch('./config.json');
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

class OEHSAHazardMap {
  constructor() {
    this.viewer = null;
    this.mapManager = null;
    this.hazardManager = null;
    this.filterManager = null;
    this.uiManager = null;

    this.config = {
      cesiumToken: '',
      dataFile: './data/Hill Air Force Vectors.geojson',
      offlineFallback: true,
      initialPosition: { longitude: -111.9731, latitude: 41.1234, height: 1000 }
    };
  }

  async init() {
    this.showLoading(true);
    const cfg = await loadConfig();
    this.config = { ...this.config, ...cfg };

    await this.initializeCesium(this.config.cesiumToken, this.config.offlineFallback);
    this.initializeManagers();
    await this.loadHazardData(this.config.dataFile);
    this.setupEventListeners();

    this.showLoading(false);
    console.log('OEHSA Hazard Map initialized successfully');
  }

  async initializeCesium(token, offlineFallback) {
    window.CESIUM_BASE_URL = './cesium/';
    Cesium.Ion.defaultAccessToken = token || '';

    this.viewer = new Cesium.Viewer('cesiumContainer', {
      globe: true,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      selectionIndicator: false,
      scene3DOnly: true,
      shouldAnimate: true
    });

    try {
      const tileset = await Cesium.createGooglePhotorealistic3DTileset();
      this.viewer.scene.primitives.add(tileset);
      console.log('Google Photorealistic 3D Tiles loaded');
    } catch (e) {
      console.warn('Google 3D Tiles unavailable, using fallback.', e);
      if (offlineFallback) {
        // Keep default globe; optionally add local imagery provider if available.
      }
    }

    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.dynamicAtmosphereLighting = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = true;
    this.viewer.scene.skyAtmosphere.show = true;
    this.viewer.scene.fog.enabled = true;
    this.viewer.scene.fog.density = 0.0002;

    const p = this.config.initialPosition;
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.height),
      orientation: { heading: 0.0, pitch: Cesium.Math.toRadians(-45), roll: 0.0 }
    });
  }

  initializeManagers() {
    this.mapManager = new MapManager(this.viewer);
    this.hazardManager = new HazardManager(this.viewer);
    this.filterManager = new FilterManager(this.hazardManager);
    this.uiManager = new UIManager(this.viewer, this.hazardManager, this.filterManager);
    this.filterManager.initializeFilters();
    this.uiManager.initialize();
  }

  async loadHazardData(path) {
    await this.hazardManager.loadHazardData(path);
    this.filterManager.applyFilters();
  }

  setupEventListeners() {
    const zi = document.getElementById('zoomIn');
    const zo = document.getElementById('zoomOut');
    const rv = document.getElementById('resetView');
    if (zi) zi.addEventListener('click', () => this.mapManager.zoomIn());
    if (zo) zo.addEventListener('click', () => this.mapManager.zoomOut());
    if (rv) rv.addEventListener('click', () => this.mapManager.resetView());
  }

  showLoading(on) {
    const el = document.getElementById('loadingIndicator');
    if (!el) return;
    el.style.display = on ? 'block' : 'none';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new OEHSAHazardMap();
  app.init().catch((e) => {
    console.error('Failed to initialize app', e);
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.top = '10px';
    msg.style.left = '10px';
    msg.style.padding = '10px';
    msg.style.background = '#fff';
    msg.style.border = '1px solid #f00';
    msg.textContent = 'Initialization failed. See console.';
    document.body.appendChild(msg);
  });
});
```

---

## ✅ NEXT STEPS (after Cursor writes files)
```bash
npm install
npm run build
# serve your /public folder (pick one):
npx http-server public -p 8080
# or
python3 -m http.server --directory public 8080
```
Open http://localhost:8080 and verify:
- Hazards render with colored polygons and pins
- Filters on the left work
- Hover shows a small bubble; click opens the info panel
- If Google 3D Tiles are blocked, the fallback globe still shows

---

## 🧹 OPTIONAL
- If your current app code lives in project root (not /src), either move those files into `/src` or update import paths accordingly.
- Put your **Cesium Ion token** into `public/config.json` before testing.

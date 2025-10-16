+# Cursor Mega-Refactor Prompt
**Project:** OEHSA Interactive Hazard Map (CesiumJS)  
**Goal:** Unify hazard schema, externalize config, add offline fallback, centralize colors/icons, and improve hover & filter logic.  
**Environment:** You are running in Cursor with Git + Webpack.  

---

## 🧭 INSTRUCTIONS
This file tells Cursor to automatically refactor your project by creating and replacing the appropriate files.

1. Create these new files:
   - `public/config.json`
   - `src/core/schema.js`
   - `src/core/colors.js`
   - `src/core/icons.js`

2. Replace these existing files (full overwrite):
   - `src/hazardManager.js`
   - `src/filterManager.js`
   - `src/uiManager.js`
   - `src/main.js`

3. Preserve all other files and paths.

---

## ⚙️ IMPLEMENTATION

### `public/config.json`
\`\`\`json
{
  "cesiumToken": "PUT-YOUR-CESIUM-ION-TOKEN-HERE",
  "dataFile": "./data/Hill Air Force Vectors.geojson",
  "offlineFallback": true
}
\`\`\`

---

### `src/core/schema.js`
\`\`\`js
export const HazardSchema = {
  id: 'hazardId',
  type: 'hazardType',
  medium: 'environmentalMedium',
  severity: 'severity',
  location: 'location',
  probability: 'probability'
};

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
      ...p
    }
  };
}
\`\`\`

---

### `src/core/colors.js`
\`\`\`js
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
\`\`\`

---

### `src/core/icons.js`
\`\`\`js
export function svgDot(color = '#95a5a6') {
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
       <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
     </svg>`
  );
}
\`\`\`

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

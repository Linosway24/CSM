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

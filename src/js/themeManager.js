// Theme Manager - Centralized color and icon management
export class ThemeManager {
    constructor() {
        this.hazardColors = {
            chemical: '#FFD700',
            biological: '#32CD32',
            radiological: '#FF8C00',
            nuclear: '#FF0000',
            environmental: '#4169E1',
            physical: '#8A2BE2'
        };

        this.severityColors = [
            '#90EE90',  // Level 1 - Light Green
            '#FFD700',  // Level 2 - Yellow
            '#FF8C00',  // Level 3 - Orange
            '#FF0000',  // Level 4 - Red
            '#8B0000'   // Level 5 - Dark Red
        ];

        this.environmentalMediumColors = {
            air: '#87CEEB',
            water: '#4682B4',
            soil: '#8B4513',
            groundwater: '#2F4F4F'
        };
    }

    // Get hazard type color
    getHazardColor(hazardType) {
        return this.hazardColors[hazardType.toLowerCase()] || '#808080';
    }

    // Get Cesium color for hazard type
    getHazardCesiumColor(hazardType, alpha = 0.5) {
        const colorHex = this.getHazardColor(hazardType);
        return Cesium.Color.fromCssColorString(colorHex).withAlpha(alpha);
    }

    // Get severity color
    getSeverityColor(severity) {
        const index = Math.min(Math.max(severity - 1, 0), this.severityColors.length - 1);
        return Cesium.Color.fromCssColorString(this.severityColors[index]);
    }

    // Get severity outline width
    getSeverityOutlineWidth(severity) {
        return Math.min(2 + severity, 6);
    }

    // Get environmental medium color
    getEnvironmentalMediumColor(medium) {
        return this.environmentalMediumColors[medium.toLowerCase()] || '#808080';
    }

    // Generate hazard icon as SVG data URL
    getHazardIcon(hazardType) {
        const color = this.getHazardColor(hazardType);
        const svg = `
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                    ${hazardType.charAt(0).toUpperCase()}
                </text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    // Get material with alpha based on severity
    getHazardMaterial(hazardType, severity) {
        const baseColor = this.getHazardCesiumColor(hazardType);
        const alpha = 0.3 + (severity * 0.1); // 0.4 to 0.8 based on severity
        return baseColor.withAlpha(alpha);
    }

    // Get all available hazard types
    getAvailableHazardTypes() {
        return Object.keys(this.hazardColors);
    }

    // Get all available environmental mediums
    getAvailableEnvironmentalMediums() {
        return Object.keys(this.environmentalMediumColors);
    }

    // Get severity levels
    getSeverityLevels() {
        return [1, 2, 3, 4, 5];
    }

    // Generate legend data
    getLegendData() {
        return {
            hazardTypes: this.getAvailableHazardTypes().map(type => ({
                type,
                color: this.getHazardColor(type),
                label: type.charAt(0).toUpperCase() + type.slice(1)
            })),
            severityLevels: this.getSeverityLevels().map(level => ({
                level,
                color: this.severityColors[level - 1],
                label: `Level ${level}`
            })),
            environmentalMediums: this.getAvailableEnvironmentalMediums().map(medium => ({
                medium,
                color: this.getEnvironmentalMediumColor(medium),
                label: medium.charAt(0).toUpperCase() + medium.slice(1)
            }))
        };
    }
}

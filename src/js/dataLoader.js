/**
 * GeoJSON Data Loader for OEHSA Hazard Map
 * Handles loading, validation, and processing of hazard data
 */

export class DataLoader {
    constructor() {
        this.hazardData = null;
        this.loading = false;
        this.error = null;
    }

    /**
     * Load GeoJSON data from file
     * @param {string} filePath - Path to GeoJSON file
     * @returns {Promise<Object>} Parsed GeoJSON data
     */
    async loadGeoJSON(filePath) {
        this.loading = true;
        this.error = null;

        try {
            console.log(`Loading GeoJSON data from: ${filePath}`);
            
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate GeoJSON structure
            this.validateGeoJSON(data);
            
            // Process and store the data
            this.hazardData = this.processHazardData(data);
            
            console.log(`Successfully loaded ${this.hazardData.features.length} hazard features`);
            
            this.loading = false;
            return this.hazardData;

        } catch (error) {
            this.error = error.message;
            this.loading = false;
            console.error('Failed to load GeoJSON data:', error);
            throw error;
        }
    }

    /**
     * Validate GeoJSON structure and required properties
     * @param {Object} data - GeoJSON data to validate
     */
    validateGeoJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid GeoJSON: Data is not an object');
        }

        if (data.type !== 'FeatureCollection') {
            throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
        }

        if (!Array.isArray(data.features)) {
            throw new Error('Invalid GeoJSON: Features must be an array');
        }

        // Validate each feature
        data.features.forEach((feature, index) => {
            this.validateFeature(feature, index);
        });
    }

    /**
     * Validate individual GeoJSON feature
     * @param {Object} feature - Feature to validate
     * @param {number} index - Feature index for error reporting
     */
    validateFeature(feature, index) {
        if (!feature || typeof feature !== 'object') {
            throw new Error(`Invalid feature at index ${index}: Not an object`);
        }

        if (feature.type !== 'Feature') {
            throw new Error(`Invalid feature at index ${index}: Type must be 'Feature'`);
        }

        if (!feature.geometry) {
            throw new Error(`Invalid feature at index ${index}: Missing geometry`);
        }

        if (!feature.properties) {
            throw new Error(`Invalid feature at index ${index}: Missing properties`);
        }

        // Validate required hazard properties
        const requiredProps = ['hazard_id', 'hazard_type', 'environmental_medium', 'severity_level'];
        requiredProps.forEach(prop => {
            if (!feature.properties[prop]) {
                throw new Error(`Invalid feature at index ${index}: Missing required property '${prop}'`);
            }
        });

        // Validate geometry type
        if (feature.geometry.type !== 'Polygon') {
            throw new Error(`Invalid feature at index ${index}: Geometry type must be 'Polygon'`);
        }

        // Validate coordinates
        if (!Array.isArray(feature.geometry.coordinates)) {
            throw new Error(`Invalid feature at index ${index}: Coordinates must be an array`);
        }
    }

    /**
     * Process and enhance hazard data
     * @param {Object} geoJSONData - Raw GeoJSON data
     * @returns {Object} Processed hazard data
     */
    processHazardData(geoJSONData) {
        const processedData = {
            type: geoJSONData.type,
            features: geoJSONData.features.map(feature => {
                const processedFeature = {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        // Ensure severity is a number
                        severity_level: parseInt(feature.properties.severity_level) || 1,
                        // Add computed properties
                        centroid: this.calculateCentroid(feature.geometry),
                        area_estimate: this.calculateArea(feature.geometry),
                        // Add display properties
                        display_name: this.generateDisplayName(feature.properties),
                        color: this.getHazardColor(feature.properties.hazard_type),
                        icon: this.getHazardIcon(feature.properties.hazard_type)
                    }
                };
                return processedFeature;
            })
        };

        return processedData;
    }

    /**
     * Calculate polygon centroid for pin marker placement
     * @param {Object} geometry - Polygon geometry
     * @returns {Array} [longitude, latitude] centroid coordinates
     */
    calculateCentroid(geometry) {
        if (geometry.type !== 'Polygon' || !geometry.coordinates[0]) {
            return [0, 0];
        }

        const coords = geometry.coordinates[0];
        let x = 0, y = 0;
        
        coords.forEach(coord => {
            x += coord[0];
            y += coord[1];
        });

        return [x / coords.length, y / coords.length];
    }

    /**
     * Calculate approximate polygon area
     * @param {Object} geometry - Polygon geometry
     * @returns {number} Approximate area in square meters
     */
    calculateArea(geometry) {
        // Simple approximation - not precise but good enough for display
        if (geometry.type !== 'Polygon' || !geometry.coordinates[0]) {
            return 0;
        }

        const coords = geometry.coordinates[0];
        let area = 0;
        
        for (let i = 0; i < coords.length - 1; i++) {
            area += coords[i][0] * coords[i + 1][1];
            area -= coords[i + 1][0] * coords[i][1];
        }
        
        return Math.abs(area) * 111000 * 111000; // Rough conversion to square meters
    }

    /**
     * Generate display name for hazard
     * @param {Object} properties - Hazard properties
     * @returns {string} Display name
     */
    generateDisplayName(properties) {
        return `${properties.hazard_type} Hazard - ${properties.location_description}`;
    }

    /**
     * Get color for hazard type
     * @param {string} hazardType - Type of hazard
     * @returns {string} Hex color code
     */
    getHazardColor(hazardType) {
        const colors = {
            'Chemical': '#3498db',      // Blue
            'Biological': '#2ecc71',    // Green
            'Radiological': '#f1c40f',  // Yellow
            'Nuclear': '#e74c3c',       // Red
            'Environmental': '#e67e22', // Orange
            'Physical': '#9b59b6'       // Purple
        };
        return colors[hazardType] || '#95a5a6'; // Default gray
    }

    /**
     * Get icon for hazard type
     * @param {string} hazardType - Type of hazard
     * @returns {string} Icon identifier
     */
    getHazardIcon(hazardType) {
        const icons = {
            'Chemical': '⚠️',
            'Biological': '🦠',
            'Radiological': '☢️',
            'Nuclear': '☢️',
            'Environmental': '🌍',
            'Physical': '⚠️'
        };
        return icons[hazardType] || '⚠️';
    }

    /**
     * Get filtered hazard data
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered features
     */
    getFilteredHazards(filters = {}) {
        if (!this.hazardData || !this.hazardData.features) {
            return [];
        }

        return this.hazardData.features.filter(feature => {
            const props = feature.properties;

            // Filter by hazard type
            if (filters.hazardTypes && filters.hazardTypes.length > 0) {
                if (!filters.hazardTypes.includes(props.hazard_type)) {
                    return false;
                }
            }

            // Filter by environmental medium
            if (filters.environmentalMediums && filters.environmentalMediums.length > 0) {
                if (!filters.environmentalMediums.includes(props.environmental_medium)) {
                    return false;
                }
            }

            // Filter by severity level
            if (filters.severityLevels && filters.severityLevels.length > 0) {
                if (!filters.severityLevels.includes(props.severity_level)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Get hazard statistics
     * @returns {Object} Statistics about loaded hazards
     */
    getStatistics() {
        if (!this.hazardData || !this.hazardData.features) {
            return {
                totalHazards: 0,
                byType: {},
                byMedium: {},
                bySeverity: {}
            };
        }

        const stats = {
            totalHazards: this.hazardData.features.length,
            byType: {},
            byMedium: {},
            bySeverity: {}
        };

        this.hazardData.features.forEach(feature => {
            const props = feature.properties;

            // Count by type
            stats.byType[props.hazard_type] = (stats.byType[props.hazard_type] || 0) + 1;

            // Count by medium
            stats.byMedium[props.environmental_medium] = (stats.byMedium[props.environmental_medium] || 0) + 1;

            // Count by severity
            stats.bySeverity[props.severity_level] = (stats.bySeverity[props.severity_level] || 0) + 1;
        });

        return stats;
    }

    /**
     * Get loading state
     * @returns {boolean} True if currently loading
     */
    isLoading() {
        return this.loading;
    }

    /**
     * Get error state
     * @returns {string|null} Error message if any
     */
    getError() {
        return this.error;
    }

    /**
     * Get loaded hazard data
     * @returns {Object|null} Loaded hazard data
     */
    getData() {
        return this.hazardData;
    }
}

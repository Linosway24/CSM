// Hazard Manager - Handles hazard data loading, display, and interaction
export class HazardManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.hazardData = [];
        this.hazardEntities = [];
        this.selectedHazard = null;
    }

    // Load hazard data from GeoJSON file
    async loadHazardData(dataFile) {
        try {
            const response = await fetch(dataFile);
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.statusText}`);
            }
            
            const geojson = await response.json();
            this.processHazardData(geojson);
            console.log(`Loaded ${this.hazardData.length} hazard features`);
        } catch (error) {
            console.error('Error loading hazard data:', error);
            throw error;
        }
    }

    // Process GeoJSON data and create hazard entities
    processHazardData(geojson) {
        this.hazardData = geojson.features || [];
        
        this.hazardData.forEach((feature, index) => {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
                this.createHazardEntity(feature, index);
            }
        });
    }

    // Create Cesium entity for hazard polygon
    createHazardEntity(feature, index) {
        const properties = feature.properties || {};
        
        // Extract hazard properties
        const hazardType = properties.hazardType || 'unknown';
        const severity = parseInt(properties.severity) || 1;
        const medium = properties.environmentalMedium || 'unknown';
        const location = properties.locationDescription || 'Unknown location';

        // Create polygon entity
        const entity = this.viewer.entities.add({
            id: `hazard-${index}`,
            name: `${hazardType} Hazard`,
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(
                    feature.geometry.coordinates[0].flat()
                ),
                material: this.getHazardMaterial(hazardType, severity),
                outline: true,
                outlineColor: this.getSeverityColor(severity),
                outlineWidth: this.getSeverityOutlineWidth(severity),
                height: 0,
                extrudedHeight: 10
            },
            properties: {
                hazardType,
                severity,
                medium,
                location,
                originalFeature: feature
            }
        });

        // Create pin marker at polygon centroid
        const centroid = this.calculatePolygonCentroid(feature.geometry.coordinates[0]);
        const pinEntity = this.viewer.entities.add({
            id: `hazard-pin-${index}`,
            name: `${hazardType} Hazard Pin`,
            position: Cesium.Cartesian3.fromDegrees(centroid.longitude, centroid.latitude, 0),
            billboard: {
                image: this.getHazardIcon(hazardType),
                scale: 0.5,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            },
            properties: {
                hazardType,
                severity,
                medium,
                location,
                originalFeature: feature,
                parentEntity: entity
            }
        });

        this.hazardEntities.push({ entity, pinEntity, feature });
    }

    // Calculate polygon centroid
    calculatePolygonCentroid(coordinates) {
        let x = 0, y = 0;
        const points = coordinates.length;
        
        coordinates.forEach(coord => {
            x += coord[0];
            y += coord[1];
        });
        
        return {
            longitude: x / points,
            latitude: y / points
        };
    }

    // Get material color based on hazard type and severity
    getHazardMaterial(hazardType, severity) {
        const baseColors = {
            chemical: Cesium.Color.YELLOW,
            biological: Cesium.Color.GREEN,
            radiological: Cesium.Color.ORANGE,
            nuclear: Cesium.Color.RED,
            environmental: Cesium.Color.BLUE,
            physical: Cesium.Color.PURPLE
        };

        const baseColor = baseColors[hazardType.toLowerCase()] || Cesium.Color.GRAY;
        const alpha = 0.3 + (severity * 0.1); // 0.4 to 0.8 based on severity
        
        return baseColor.withAlpha(alpha);
    }

    // Get severity color for outlines
    getSeverityColor(severity) {
        const colors = [
            Cesium.Color.LIGHTGREEN,  // 1
            Cesium.Color.YELLOW,      // 2
            Cesium.Color.ORANGE,      // 3
            Cesium.Color.RED,         // 4
            Cesium.Color.DARKRED      // 5
        ];
        return colors[Math.min(severity - 1, 4)] || Cesium.Color.GRAY;
    }

    // Get outline width based on severity
    getSeverityOutlineWidth(severity) {
        return Math.min(2 + severity, 6);
    }

    // Get hazard icon (placeholder - will be implemented with actual icons)
    getHazardIcon(hazardType) {
        // For now, return a simple colored circle
        // In production, this would load actual icon images
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${this.getHazardTypeColor(hazardType)}" stroke="white" stroke-width="2"/>
            </svg>
        `);
    }

    // Get hazard type color for icons
    getHazardTypeColor(hazardType) {
        const colors = {
            chemical: '#FFD700',
            biological: '#32CD32',
            radiological: '#FF8C00',
            nuclear: '#FF0000',
            environmental: '#4169E1',
            physical: '#8A2BE2'
        };
        return colors[hazardType.toLowerCase()] || '#808080';
    }

    // Get all hazard entities
    getHazardEntities() {
        return this.hazardEntities;
    }

    // Get hazard data
    getHazardData() {
        return this.hazardData;
    }

    // Set selected hazard
    setSelectedHazard(hazard) {
        this.selectedHazard = hazard;
    }

    // Get selected hazard
    getSelectedHazard() {
        return this.selectedHazard;
    }
}

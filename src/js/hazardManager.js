import * as Cesium from 'cesium';
import { normalizeFeature } from '../core/schema.js';
import { colorFor } from '../core/colors.js';
import { svgDot } from '../core/icons.js';

export class HazardManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.hazardData = [];
        this.hazardEntities = [];
        this.selectedHazard = null;
        this.isWebMercator = false;
    }

    // Load hazard data from GeoJSON file
    async loadHazardData(dataFile) {
        try {
            const response = await fetch(dataFile);
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.statusText}`);
            }
            
            const geojson = await response.json();
            this.isWebMercator = this.detectWebMercatorCRS(geojson);
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

        let entityIndex = 0;
        this.hazardData.forEach((feature) => {
            const geometry = feature.geometry;
            if (!geometry) return;

            if (geometry.type === 'Polygon') {
                this.createHazardEntity(feature, entityIndex++);
            } else if (geometry.type === 'MultiPolygon') {
                // Create an entity for each polygon in the multipolygon
                const polygons = geometry.coordinates || [];
                polygons.forEach((polygonCoords) => {
                    const single = { ...feature, geometry: { type: 'Polygon', coordinates: polygonCoords } };
                    this.createHazardEntity(single, entityIndex++);
                });
            }
        });
    }

    // Create Cesium entity for hazard polygon
    createHazardEntity(feature, index) {
        const normalizedFeature = normalizeFeature(feature);
        const properties = normalizedFeature.properties;

        const hazardType = properties.hazardType;
        const severity = properties.severity;
        const medium = properties.environmentalMedium;
        const location = properties.location;

        // Use the outer ring only for now (holes can be added later)
        const outerRing = feature.geometry.coordinates?.[0] || [];
        const degreesFlat = this.ringToDegreesArray(outerRing, this.isWebMercator);

        const entity = this.viewer.entities.add({
            id: `hazard-${index}`,
            name: `${hazardType} Hazard`,
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(degreesFlat),
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
                originalFeature: normalizedFeature
            }
        });

        const centroid = this.calculateCentroidFromRing(outerRing, this.isWebMercator);
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
                originalFeature: normalizedFeature,
                parentEntity: entity
            }
        });

        this.hazardEntities.push({ entity, pinEntity, feature: normalizedFeature });
    }

    // Convert a ring [[x,y],...] to flat degrees array [lon,lat,...]
    ringToDegreesArray(ring, isWebMercator) {
        const result = [];
        for (let i = 0; i < ring.length; i++) {
            const pt = ring[i];
            if (!pt || pt.length < 2) continue;
            const lonlat = isWebMercator ? this.webMercatorToLonLat(pt[0], pt[1]) : { lon: pt[0], lat: pt[1] };
            result.push(lonlat.lon, lonlat.lat);
        }
        return result;
    }

    // Calculate centroid from a ring in either 3857 or 4326
    calculateCentroidFromRing(ring, isWebMercator) {
        let sx = 0;
        let sy = 0;
        let n = 0;
        for (let i = 0; i < ring.length; i++) {
            const pt = ring[i];
            if (!pt || pt.length < 2) continue;
            const lonlat = isWebMercator ? this.webMercatorToLonLat(pt[0], pt[1]) : { lon: pt[0], lat: pt[1] };
            sx += lonlat.lon;
            sy += lonlat.lat;
            n++;
        }
        if (n === 0) return { longitude: 0, latitude: 0 };
        return { longitude: sx / n, latitude: sy / n };
    }

    // Detect if FeatureCollection uses EPSG:3857
    detectWebMercatorCRS(geojson) {
        const name = geojson?.crs?.properties?.name || geojson?.crs?.properties?.code || '';
        return /3857|102100|web\s*mercator/i.test(String(name));
    }

    // Convert Web Mercator meters (EPSG:3857) to lon/lat degrees (EPSG:4326)
    webMercatorToLonLat(x, y) {
        const R = 6378137.0;
        const lon = (x / R) * 180 / Math.PI;
        const lat = (2 * Math.atan(Math.exp(y / R)) - (Math.PI / 2)) * 180 / Math.PI;
        return { lon, lat };
    }

    // Get material color based on hazard type and severity using centralized colors
    getHazardMaterial(hazardType, severity) {
        const alpha = 0.3 + (severity * 0.1); // 0.4 to 0.8 based on severity
        return colorFor(hazardType, alpha);
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

    // Get hazard icon using centralized icon generation
    getHazardIcon(hazardType) {
        const color = this.getHazardTypeColor(hazardType);
        return svgDot(color);
    }

    // Get hazard type color using centralized colors
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
// OEHSA Interactive Hazard Map - Main Application
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import '../css/styles.css';

// Import managers
import { MapManager } from './mapManager.js';
import { HazardManager } from './hazardManager.js';
import { FilterManager } from './filterManager.js';
import { UIManager } from './uiManager.js';

class OEHSAHazardMap {
    constructor() {
        this.viewer = null;
        this.mapManager = null;
        this.hazardManager = null;
        this.filterManager = null;
        this.uiManager = null;
        
        // Configuration
        this.config = {
            // Cesium token - replace with your actual token (required for Google 3D Tiles)
            cesiumToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMzg4YjBkOC0wMGUwLTRjMzMtODZjMy05NDA0NGYyMzIzZGEiLCJpZCI6MzI0MzMxLCJpYXQiOjE3NTc5NjQxMDh9.OSWvv6a8r1wlWVgCf9QvHSIhNIBTMqWukie1hvCEpJ8',
            // Bing Maps key for fallback imagery (optional)
            bingMapsKey: 'your-bing-maps-key-here',
            // Initial camera position (Hill Air Force Base area)
            initialPosition: {
                longitude: -111.9731,
                latitude: 41.1234,
                height: 1000
            },
            // Data file path
            dataFile: './data/Hill Air Force Vectors.geojson'
        };
    }

    async init() {
        try {
            console.log('Initializing OEHSA Hazard Map...');
            
            // Show loading indicator
            this.showLoading(true);
            
            // Initialize Cesium viewer
            await this.initializeCesium();
            
            // Initialize managers
            this.initializeManagers();
            
            // Load hazard data
            await this.loadHazardData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading indicator
            this.showLoading(false);
            
            console.log('OEHSA Hazard Map initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize OEHSA Hazard Map:', error);
            this.showError('Failed to initialize the hazard map. Please refresh the page.');
        }
    }

    async initializeCesium() {
        // Set Cesium base URL
        window.CESIUM_BASE_URL = './cesium/';
        
        // Configure Cesium
        Cesium.Ion.defaultAccessToken = this.config.cesiumToken;
        
        // Initialize viewer with Google Photorealistic 3D Tiles
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            // Disable default globe since Google 3D Tiles will provide the base
            globe: false,
            // Use Google geocoder for better location search
            geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
            // Disable default UI elements we don't need
            homeButton: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            // Enable selection
            selectionIndicator: false,
            // Configure scene
            scene3DOnly: true,
            shouldAnimate: true
        });

        // Set initial camera position
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
                this.config.initialPosition.longitude,
                this.config.initialPosition.latitude,
                this.config.initialPosition.height
            ),
            orientation: {
                heading: 0.0,
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });

        // Configure scene settings for photorealistic rendering
        this.viewer.scene.globe.enableLighting = true;
        this.viewer.scene.globe.dynamicAtmosphereLighting = true;
        this.viewer.scene.globe.atmosphereLightIntensity = 10.0;
        
        // Enable depth testing for proper 3D rendering
        this.viewer.scene.globe.depthTestAgainstTerrain = true;
        
        // Configure atmosphere and sky for realistic appearance
        this.viewer.scene.skyAtmosphere.show = true;
        this.viewer.scene.skyAtmosphere.brightnessShift = 0.2;
        this.viewer.scene.skyAtmosphere.saturationShift = 0.0;
        
        // Enable fog for better depth perception
        this.viewer.scene.fog.enabled = true;
        this.viewer.scene.fog.density = 0.0002;
        
        // Configure camera controls for better navigation
        this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 10.0;
        this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000.0;
        this.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
        
        // Load Google Photorealistic 3D Tiles
        await this.loadGooglePhotorealistic3DTiles();
    }

    // Load Google Photorealistic 3D Tiles
    async loadGooglePhotorealistic3DTiles() {
        try {
            console.log('Loading Google Photorealistic 3D Tiles...');
            const tileset = await Cesium.createGooglePhotorealistic3DTileset();
            this.viewer.scene.primitives.add(tileset);
            console.log('Google Photorealistic 3D Tiles loaded successfully');
        } catch (error) {
            console.warn('Failed to load Google Photorealistic 3D Tiles:', error);
            console.log('Falling back to standard imagery...');
            // Fallback to standard imagery if Google 3D Tiles fail
            this.viewer.scene.globe.show = true;
            this.viewer.scene.globe.imageryLayers.removeAll();
            this.viewer.scene.globe.imageryLayers.addImageryProvider(this.createImageryProvider());
        }
    }

    // Create imagery provider with fallback options
    createImageryProvider() {
        // Try Bing Maps first if key is available
        if (this.config.bingMapsKey && this.config.bingMapsKey !== 'your-bing-maps-key-here') {
            try {
                return new Cesium.BingMapsImageryProvider({
                    url: 'https://dev.virtualearth.net',
                    key: this.config.bingMapsKey,
                    mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS
                });
            } catch (error) {
                console.warn('Bing Maps failed, falling back to default imagery:', error);
            }
        }
        
        // Fallback to Cesium World Imagery (requires Cesium Ion token)
        if (this.config.cesiumToken && this.config.cesiumToken !== 'your-cesium-token-here') {
            return new Cesium.IonImageryProvider({ assetId: 1 }); // World Imagery
        }
        
        // Final fallback to OpenStreetMap
        return new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
        });
    }

    initializeManagers() {
        // Initialize map manager
        this.mapManager = new MapManager(this.viewer);
        
        // Initialize hazard manager
        this.hazardManager = new HazardManager(this.viewer);
        
        // Initialize filter manager
        this.filterManager = new FilterManager(this.hazardManager);
        
        // Initialize UI manager
        this.uiManager = new UIManager(this.viewer, this.hazardManager, this.filterManager);
    }

    async loadHazardData() {
        try {
            console.log('Loading hazard data...');
            await this.hazardManager.loadHazardData(this.config.dataFile);
            console.log('Hazard data loaded successfully');
        } catch (error) {
            console.error('Failed to load hazard data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Map control events
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.mapManager.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.mapManager.zoomOut();
        });

        document.getElementById('resetView').addEventListener('click', () => {
            this.mapManager.resetView();
        });

        // Filter events
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.filterManager.clearAllFilters();
        });

        // Information panel events
        document.getElementById('closeInfo').addEventListener('click', () => {
            this.uiManager.closeInfoPanel();
        });

        // Close info panel when clicking outside
        document.addEventListener('click', (event) => {
            const infoPanel = document.getElementById('infoPanel');
            const controlPanel = document.getElementById('controlPanel');
            
            if (!infoPanel.contains(event.target) && !controlPanel.contains(event.target)) {
                this.uiManager.closeInfoPanel();
            }
        });
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    }

    showError(message) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
        loadingIndicator.classList.remove('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new OEHSAHazardMap();
    app.init();
});

// Export for potential external use
window.OEHSAHazardMap = OEHSAHazardMap;

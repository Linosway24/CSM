// UI Manager - Handles user interface interactions and display
export class UIManager {
    constructor(viewer, hazardManager, filterManager) {
        this.viewer = viewer;
        this.hazardManager = hazardManager;
        this.filterManager = filterManager;
        this.infoPanel = null;
        this.infoBubble = null;
        this.currentHoveredEntity = null;
    }

    // Initialize UI components
    initialize() {
        this.infoPanel = document.getElementById('infoPanel');
        this.infoBubble = document.getElementById('infoBubble');
        this.setupEventListeners();
        this.setupFilterListeners();
    }

    // Set up event listeners for map interactions
    setupEventListeners() {
        // Click handler for hazard selection
        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
            const pickedObject = this.viewer.scene.pick(event.position);
            if (pickedObject && pickedObject.id) {
                this.handleHazardClick(pickedObject.id);
            } else {
                this.closeInfoPanel();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Hover handler for information bubbles
        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
            const pickedObject = this.viewer.scene.pick(event.endPosition);
            if (pickedObject && pickedObject.id) {
                this.handleHazardHover(pickedObject.id, event.endPosition);
            } else {
                this.hideInfoBubble();
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    // Set up filter event listeners
    setupFilterListeners() {
        // Hazard type filters
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const value = event.target.value;
                const isChecked = event.target.checked;
                
                // Determine filter type based on parent group
                const parentGroup = event.target.closest('.filter-group');
                const groupTitle = parentGroup.querySelector('h4').textContent.toLowerCase();
                
                if (groupTitle.includes('hazard type')) {
                    this.filterManager.updateHazardTypeFilter(value, isChecked);
                } else if (groupTitle.includes('environmental medium')) {
                    this.filterManager.updateEnvironmentalMediumFilter(value, isChecked);
                } else if (groupTitle.includes('severity level')) {
                    this.filterManager.updateSeverityLevelFilter(value, isChecked);
                }
            });
        });
    }

    // Handle hazard click
    handleHazardClick(entity) {
        if (entity.properties) {
            const properties = entity.properties;
            const hazardType = properties.hazardType?.getValue() || 'Unknown';
            const location = properties.location?.getValue() || 'Unknown location';
            const severity = properties.severity?.getValue() || 'Unknown';
            const medium = properties.medium?.getValue() || 'Unknown';

            this.showInfoPanel({
                type: hazardType,
                location: location,
                severity: severity,
                medium: medium
            });

            // Highlight the selected hazard
            this.highlightHazard(entity);
        }
    }

    // Handle hazard hover
    handleHazardHover(entity, position) {
        if (entity.properties && entity !== this.currentHoveredEntity) {
            const properties = entity.properties;
            const hazardType = properties.hazardType?.getValue() || 'Unknown';
            const severity = properties.severity?.getValue() || 'Unknown';

            this.showInfoBubble({
                type: hazardType,
                severity: severity
            }, position);

            this.currentHoveredEntity = entity;
        }
    }

    // Show information panel
    showInfoPanel(hazardInfo) {
        if (!this.infoPanel) return;

        // Update panel content
        document.getElementById('infoType').textContent = hazardInfo.type;
        document.getElementById('infoLocation').textContent = hazardInfo.location;
        document.getElementById('infoSeverity').textContent = `Level ${hazardInfo.severity}`;
        document.getElementById('infoMedium').textContent = hazardInfo.medium;

        // Show panel
        this.infoPanel.classList.remove('hidden');
    }

    // Close information panel
    closeInfoPanel() {
        if (this.infoPanel) {
            this.infoPanel.classList.add('hidden');
        }
        this.clearHazardHighlight();
    }

    // Show information bubble
    showInfoBubble(hazardInfo, position) {
        if (!this.infoBubble) return;

        // Update bubble content
        document.getElementById('bubbleType').textContent = hazardInfo.type;
        document.getElementById('bubbleSeverity').textContent = `Severity: ${hazardInfo.severity}`;

        // Position bubble
        const canvas = this.viewer.canvas;
        const rect = canvas.getBoundingClientRect();
        this.infoBubble.style.left = `${position.x + rect.left}px`;
        this.infoBubble.style.top = `${position.y + rect.top - 40}px`;

        // Show bubble
        this.infoBubble.classList.remove('hidden');
    }

    // Hide information bubble
    hideInfoBubble() {
        if (this.infoBubble) {
            this.infoBubble.classList.add('hidden');
        }
        this.currentHoveredEntity = null;
    }

    // Highlight selected hazard
    highlightHazard(entity) {
        this.clearHazardHighlight();
        
        if (entity.polygon) {
            entity.polygon.outlineColor = Cesium.Color.YELLOW;
            entity.polygon.outlineWidth = 4;
        }
    }

    // Clear hazard highlighting
    clearHazardHighlight() {
        const entities = this.hazardManager.getHazardEntities();
        entities.forEach(({ entity }) => {
            if (entity.polygon) {
                const severity = entity.properties.severity?.getValue() || 1;
                entity.polygon.outlineColor = this.getSeverityColor(severity);
                entity.polygon.outlineWidth = this.getSeverityOutlineWidth(severity);
            }
        });
    }

    // Get severity color (duplicated from HazardManager for UI purposes)
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

    // Get severity outline width
    getSeverityOutlineWidth(severity) {
        return Math.min(2 + severity, 6);
    }

    // Update legend
    updateLegend() {
        const legendElement = document.getElementById('legend');
        if (!legendElement) return;

        const hazardTypes = ['chemical', 'biological', 'radiological', 'nuclear', 'environmental', 'physical'];
        const legendHTML = hazardTypes.map(type => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${this.getHazardTypeColor(type)}"></div>
                <div class="legend-text">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            </div>
        `).join('');

        legendElement.innerHTML = legendHTML;
    }

    // Get hazard type color for legend
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
}

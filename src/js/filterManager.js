import { HazardSchema } from '../core/schema.js';

export class FilterManager {
    constructor(hazardManager) {
        this.hazardManager = hazardManager;
        this.activeFilters = {
            hazardTypes: new Set(),
            environmentalMediums: new Set(),
            severityLevels: new Set()
        };
        this.filteredEntities = [];
    }

    // Initialize filters with default values (all selected)
    initializeFilters() {
        // Set default filters to show all hazards
        this.activeFilters.hazardTypes = new Set(['chemical', 'biological', 'radiological', 'nuclear', 'environmental', 'physical']);
        this.activeFilters.environmentalMediums = new Set(['air', 'water', 'soil', 'groundwater']);
        this.activeFilters.severityLevels = new Set(['1', '2', '3', '4', '5']);
        
        this.applyFilters();
    }

    // Update hazard type filter
    updateHazardTypeFilter(type, isSelected) {
        if (isSelected) {
            this.activeFilters.hazardTypes.add(type);
        } else {
            this.activeFilters.hazardTypes.delete(type);
        }
        this.applyFilters();
    }

    // Update environmental medium filter
    updateEnvironmentalMediumFilter(medium, isSelected) {
        if (isSelected) {
            this.activeFilters.environmentalMediums.add(medium);
        } else {
            this.activeFilters.environmentalMediums.delete(medium);
        }
        this.applyFilters();
    }

    // Update severity level filter
    updateSeverityLevelFilter(level, isSelected) {
        if (isSelected) {
            this.activeFilters.severityLevels.add(level);
        } else {
            this.activeFilters.severityLevels.delete(level);
        }
        this.applyFilters();
    }

    // Apply all active filters using unified schema
    applyFilters() {
        const entities = this.hazardManager.getHazardEntities();
        this.filteredEntities = [];

        entities.forEach(({ entity, pinEntity }) => {
            const properties = entity.properties || {};

            const rawType = properties[HazardSchema.type];
            const rawMedium = properties[HazardSchema.medium];
            const rawSeverity = properties[HazardSchema.severity];

            const hazardType = (rawType?.getValue ? rawType.getValue() : rawType)?.toString?.().toLowerCase?.();
            const medium = (rawMedium?.getValue ? rawMedium.getValue() : rawMedium)?.toString?.().toLowerCase?.();
            const severity = (rawSeverity?.getValue ? rawSeverity.getValue() : rawSeverity)?.toString?.();

            const typeMatch = this.activeFilters.hazardTypes.has(hazardType);
            const mediumMatch = this.activeFilters.environmentalMediums.has(medium);
            const severityMatch = this.activeFilters.severityLevels.has(severity);

            const isVisible = typeMatch && mediumMatch && severityMatch;

            // Show/hide entities based on filter
            entity.show = isVisible;
            pinEntity.show = isVisible;

            if (isVisible) {
                this.filteredEntities.push({ entity, pinEntity });
            }
        });

        this.updateHazardCount();
        console.log(`Filtered to ${this.filteredEntities.length} visible hazards`);
    }

    // Clear all filters
    clearAllFilters() {
        this.activeFilters.hazardTypes.clear();
        this.activeFilters.environmentalMediums.clear();
        this.activeFilters.severityLevels.clear();
        
        // Reset UI checkboxes
        this.resetUICheckboxes();
        
        // Show all hazards
        const entities = this.hazardManager.getHazardEntities();
        entities.forEach(({ entity, pinEntity }) => {
            entity.show = true;
            pinEntity.show = true;
        });

        this.filteredEntities = [...entities];
        this.updateHazardCount();
    }

    // Reset UI checkboxes to checked state
    resetUICheckboxes() {
        // Reset hazard type checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // Update hazard count display
    updateHazardCount() {
        const countElement = document.getElementById('hazardCount');
        if (countElement) {
            countElement.textContent = this.filteredEntities.length;
        }
    }

    // Get filtered entities
    getFilteredEntities() {
        return this.filteredEntities;
    }

    // Get active filters
    getActiveFilters() {
        return this.activeFilters;
    }

    // Check if entity matches current filters using unified schema
    entityMatchesFilters(entity) {
        const properties = entity.properties;
        
        const hazardType = properties[HazardSchema.type]?.getValue()?.toLowerCase();
        const medium = properties[HazardSchema.medium]?.getValue()?.toLowerCase();
        const severity = properties[HazardSchema.severity]?.getValue()?.toString();

        const typeMatch = this.activeFilters.hazardTypes.has(hazardType);
        const mediumMatch = this.activeFilters.environmentalMediums.has(medium);
        const severityMatch = this.activeFilters.severityLevels.has(severity);

        return typeMatch && mediumMatch && severityMatch;
    }
}
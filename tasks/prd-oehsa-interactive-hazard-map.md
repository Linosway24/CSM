# Product Requirements Document: OEHSA Interactive Hazard Map

## Introduction/Overview

The OEHSA Interactive Hazard Map is a CesiumJS-powered 3D visualization tool designed to help OEHSA (Occupational and Environmental Health and Safety Assessment) trainees analyze pre-identified environmental hazards on a photorealistic 3D base map. This training module supports the construction of Conceptual Site Models (CSMs) by providing an immersive, interactive environment where trainees can explore hazard zones, understand spatial relationships, and develop critical analysis skills for environmental assessment.

The tool addresses the need for realistic, hands-on training that bridges theoretical knowledge with practical site assessment skills, preparing trainees for real-world CSM development scenarios.

## Goals

1. **Visual Analysis Training**: Enable trainees to visually analyze environmental hazards in a realistic 3D context
2. **Spatial Understanding**: Help trainees understand spatial relationships between different hazard zones
3. **Data Interpretation**: Train users to interpret hazard data including type, severity, and environmental medium
4. **CSM Preparation**: Prepare trainees for constructing Conceptual Site Models through interactive exploration
5. **Offline Capability**: Provide self-contained training that works without internet connectivity

## User Stories

1. **As an OEHSA trainee**, I want to view environmental hazards on a realistic 3D base map so that I can understand their spatial distribution and context.

2. **As an OEHSA trainee**, I want to click on hazard zones to see detailed information so that I can learn about specific hazard characteristics.

3. **As an OEHSA trainee**, I want to filter hazards by type (chemical, biological, radiological, etc.) so that I can focus on specific categories of interest.

4. **As an OEHSA trainee**, I want to filter hazards by environmental medium (air, water, soil, groundwater) so that I can understand contamination pathways.

5. **As an OEHSA trainee**, I want to filter hazards by severity level (1-5 scale) so that I can prioritize high-risk areas.

6. **As an OEHSA trainee**, I want to use this tool offline so that I can complete training exercises without internet connectivity.

## Functional Requirements

### Core Map Functionality
1. The system must display a photorealistic 3D tile-based base map using Google 3D Tiles (not Cesium globe)
2. The system must load and display hazard data from `Hill Air Force Vectors.geojson` as polygon features
3. The system must render hazard polygons as clickable zones on the 3D map
4. The system must support smooth navigation (pan, zoom, rotate) in the 3D environment

### Hazard Data Display
5. The system must display hazard polygons with distinct visual styling based on hazard type
6. The system must show hazard polygons with visual indicators for severity levels (1-5 scale)
7. The system must place pin markers at the center of each hazard polygon to help identify hazard areas
8. The system must display information bubbles that pop up when users click on hazard polygons
9. The system must provide a legend showing hazard type categories and severity level meanings
10. The system must support hover effects to preview basic hazard information
11. The system must ensure pin markers are visible and clickable even when polygons are partially obscured

### Interactive Features
12. The system must open a detailed information panel when a hazard polygon or pin marker is clicked
13. The information panel must display: hazard type, location description, severity level (1-5), and environmental medium
14. The system must allow closing the information panel via a close button or clicking outside the panel
15. The system must highlight the selected hazard polygon when the information panel is open
16. The system must display information bubbles on hover that show basic hazard information (type and severity)
17. The system must ensure information bubbles appear near the cursor and don't obstruct map navigation

### Filtering System
18. The system must provide filter controls for hazard type (Chemical, Biological, Radiological, Nuclear, Environmental, Physical)
19. The system must provide filter controls for environmental medium (Air, Water, Soil, Groundwater)
20. The system must provide filter controls for severity level (1-5 scale with individual checkboxes)
21. The system must support multiple simultaneous filters (e.g., show only Chemical hazards in Water with severity 4-5)
22. The system must update the map display immediately when filters are applied
23. The system must provide a "Clear All Filters" button to reset all filter selections
24. The system must show the count of visible hazards when filters are applied

### User Interface
25. The system must provide an intuitive control panel for all filtering options
26. The system must include navigation controls for the 3D map (zoom, pan, reset view)
27. The system must display loading indicators when data is being processed
28. The system must provide clear visual feedback for all interactive elements

## Non-Goals (Out of Scope)

1. **User Authentication**: No login system or user management required
2. **Data Persistence**: No saving of user progress or session data
3. **Analytics Tracking**: No user behavior tracking or analytics collection
4. **Real-time Data**: No dynamic data updates or live data feeds
5. **Collaborative Features**: No multi-user or sharing capabilities
6. **Data Export**: No ability to export map data or analysis results
7. **Advanced Analysis Tools**: No measurement tools, drawing capabilities, or complex spatial analysis
8. **Mobile Optimization**: Focus on desktop/laptop experience for Articulate Storyline integration
9. **Custom Base Maps**: Only Google 3D Tiles base map support
10. **Hazard Editing**: No ability to add, modify, or delete hazard data

## Design Considerations

### Visual Design
- **Hazard Styling**: Use distinct colors and patterns for different hazard types
- **Severity Indicators**: Implement visual hierarchy through color intensity, border thickness, or pattern density
- **Pin Markers**: Distinctive, easily identifiable markers that scale appropriately with zoom level
- **Information Bubbles**: Lightweight, non-intrusive tooltips that appear on hover with basic hazard info
- **Information Panel**: Clean, readable design with clear typography and logical information hierarchy
- **Filter Controls**: Intuitive checkbox/button interface with clear labeling

### User Experience
- **Performance**: Smooth 3D navigation with 60fps target for map interactions
- **Accessibility**: Keyboard navigation support and clear visual indicators
- **Responsive Layout**: Adapt to different screen sizes while maintaining functionality
- **Loading States**: Clear feedback during data loading and processing

### Integration Requirements
- **Articulate Storyline**: Designed as a Web Object that embeds seamlessly
- **Government Network**: All assets must be self-contained with relative file paths
- **Offline Operation**: No external CDN dependencies or online requirements

## Technical Considerations

### Technology Stack
- **3D Engine**: CesiumJS for 3D visualization and map rendering
- **Base Map**: Google 3D Tiles integration (not Cesium's default globe)
- **Data Format**: GeoJSON polygon features for hazard zones
- **Deployment**: Self-contained web application for Articulate Storyline integration

### Performance Requirements
- **Load Time**: Initial map load under 10 seconds on standard government hardware
- **Interaction Response**: Filter changes and polygon clicks respond within 500ms
- **Memory Usage**: Efficient handling of polygon data to prevent browser crashes
- **File Size**: Total application bundle under 50MB for easy distribution

### Data Requirements
- **GeoJSON Structure**: Expects polygon features with properties for hazard type, severity, environmental medium, and location description
- **Coordinate System**: Support for standard geographic coordinate systems (WGS84)
- **Data Validation**: Graceful handling of malformed or missing data properties

### Browser Compatibility
- **Target Browsers**: Modern browsers supporting WebGL 2.0 and ES6+
- **Fallback**: Graceful degradation for older browsers with appropriate error messages
- **Testing**: Validation on Chrome, Firefox, Edge, and Safari

## Success Metrics

**Note**: No formal success metrics are defined at this time. Evaluation will be based on client feedback and training effectiveness observations.

**Potential Future Metrics** (if tracking becomes available):
- User engagement time with the map interface
- Filter usage patterns and frequency
- Information panel interaction rates
- Training completion rates for related CSM exercises

## Open Questions

1. **Data Source**: What is the expected size and complexity of the `Hill Air Force Vectors.geojson` file? (number of polygons, file size)

2. **Visual Styling**: Are there specific color schemes or visual standards that should be followed for different hazard types?

3. **Performance Baseline**: What is the minimum hardware specification for the target government network environment?

4. **Error Handling**: How should the system behave if the GeoJSON file is missing or corrupted?

5. **View Defaults**: What should be the default map view (zoom level, camera position) when the application loads?

6. **Hazard Density**: What is the expected maximum number of hazard polygons that might need to be displayed simultaneously?

7. **Training Context**: Are there specific training scenarios or use cases that should influence the default filter settings or initial view?

8. **Future Enhancements**: Are there any planned future features that should influence the current technical architecture?

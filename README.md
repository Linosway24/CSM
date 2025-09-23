# OEHSA Interactive Hazard Map

A CesiumJS-powered interactive 3D hazard map for OEHSA (Occupational and Environmental Health and Safety Assessment) training modules. This application displays environmental hazards on Google's Photorealistic 3D Tiles base map with filtering capabilities and interactive information panels.

## Features

- **3D Visualization**: Interactive 3D map using CesiumJS with Google Photorealistic 3D Tiles
- **Photorealistic Base Map**: Google's high-quality 3D photorealistic content with buildings and terrain
- **Smooth Navigation**: Pan, zoom, rotate with collision detection and smooth animations
- **Hazard Display**: Polygon-based hazard zones with pin markers
- **Interactive Features**: Click and hover interactions with information panels
- **Filtering System**: Filter hazards by type, environmental medium, and severity level
- **Responsive Design**: Works on desktop and tablet devices
- **Offline Capable**: Self-contained for government network deployment

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Modern web browser with WebGL 2.0 support

## Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get API tokens:**
   - **Cesium Ion token**: Visit [Cesium Ion](https://cesium.com/ion/) and create a free account (required for Google Photorealistic 3D Tiles)
   - **Bing Maps key** (optional): Visit [Bing Maps Dev Center](https://www.bingmapsportal.com/) for fallback imagery
   - Replace tokens in `src/js/main.js`:
     - `cesiumToken: 'your-cesium-token-here'` (required)
     - `bingMapsKey: 'your-bing-maps-key-here'` (optional fallback)

4. **Add your hazard data:**
   - Place your `Hill Air Force Vectors.geojson` file in the `src/data/` directory
   - Ensure the GeoJSON contains polygon features with the following properties:
     - `hazardType`: Type of hazard (chemical, biological, radiological, nuclear, environmental, physical)
     - `severity`: Severity level (1-5)
     - `environmentalMedium`: Environmental medium (air, water, soil, groundwater)
     - `locationDescription`: Human-readable location description

## Development

### Start Development Server

```bash
npm run dev
```

This will:
- Start webpack dev server on `http://localhost:8080`
- Enable hot reloading for development
- Open the application in your default browser

### Build for Production

```bash
npm run build
```

This will:
- Create optimized production build in `dist/` directory
- Bundle all assets for deployment
- Generate source maps for debugging

### Serve Built Files

```bash
npm start
```

This will:
- Serve the built files using Python HTTP server on `http://localhost:8000`
- Useful for testing the production build locally

## Project Structure

```
src/
├── js/
│   ├── main.js              # Main application entry point
│   ├── mapManager.js        # 3D map operations and navigation
│   ├── hazardManager.js     # Hazard data loading and display
│   ├── filterManager.js     # Filtering system
│   └── uiManager.js         # User interface interactions
├── css/
│   └── styles.css           # Application styles
├── data/
│   └── Hill Air Force Vectors.geojson  # Hazard data file
├── assets/
│   └── icons/               # Hazard type icons
└── index.html               # Main HTML template

dist/                        # Production build output
node_modules/                # Dependencies
package.json                 # Project configuration
webpack.config.js           # Build configuration
```

## Configuration

### Cesium Token Setup

1. Get your free Cesium Ion token from [cesium.com/ion](https://cesium.com/ion/)
2. Replace the token in `src/js/main.js`:
   ```javascript
   cesiumToken: 'your-actual-token-here'
   ```

### Data Format

The application expects GeoJSON data with the following structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
      },
      "properties": {
        "hazardType": "chemical",
        "severity": 3,
        "environmentalMedium": "water",
        "locationDescription": "Contaminated groundwater area"
      }
    }
  ]
}
```

## Deployment

### Articulate Storyline Integration

1. Build the application: `npm run build`
2. Copy the entire `dist/` directory contents to your Articulate Storyline project
3. Use the `index.html` file as a Web Object in Storyline
4. Ensure all relative paths are maintained

### Government Network Deployment

- All assets use relative paths (no CDN dependencies)
- Application is self-contained and offline-capable
- Total bundle size should be under 50MB
- Test on target government network environment

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. **Cesium token error**: Ensure you have a valid Cesium Ion token
2. **Data loading error**: Check that your GeoJSON file is in the correct location and format
3. **3D tiles not loading**: Verify your Cesium token has access to 3D tiles
4. **Performance issues**: Reduce the number of hazard polygons or simplify geometry

### Development Tips

- Use browser developer tools to debug JavaScript issues
- Check the console for error messages
- Use Cesium Sandcastle for testing Cesium-specific code
- Test with different GeoJSON file sizes to ensure performance

## License

MIT License - see LICENSE file for details

## Support

For technical support or questions about this training module, contact the OEHSA development team.
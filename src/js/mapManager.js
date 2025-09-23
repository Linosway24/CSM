// Map Manager - Handles 3D map operations and navigation
export class MapManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.initialView = null;
        this.setupCameraControls();
    }

    // Setup enhanced camera controls
    setupCameraControls() {
        const camera = this.viewer.camera;
        const controller = this.viewer.scene.screenSpaceCameraController;
        
        // Configure camera movement constraints
        controller.enableRotate = true;
        controller.enableZoom = true;
        controller.enableTranslate = true;
        controller.enableTilt = true;
        controller.enableLook = true;
        
        // Set movement constraints
        controller.minimumZoomDistance = 10.0;
        controller.maximumZoomDistance = 20000000.0;
        controller.enableCollisionDetection = true;
        
        // Configure movement speeds
        controller.bounceAnimationTime = 0.0;
        controller.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
        
        // Store initial view
        this.storeInitialView();
    }

    // Store initial view for reset functionality
    storeInitialView() {
        this.initialView = {
            position: this.viewer.camera.position.clone(),
            heading: this.viewer.camera.heading,
            pitch: this.viewer.camera.pitch,
            roll: this.viewer.camera.roll
        };
    }

    // Smooth zoom in with animation
    zoomIn() {
        const currentHeight = this.viewer.camera.positionCartographic.height;
        const newHeight = Math.max(currentHeight * 0.5, 10);
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                this.viewer.camera.positionCartographic.longitude * 180 / Math.PI,
                this.viewer.camera.positionCartographic.latitude * 180 / Math.PI,
                newHeight
            ),
            duration: 1.0
        });
    }

    // Smooth zoom out with animation
    zoomOut() {
        const currentHeight = this.viewer.camera.positionCartographic.height;
        const newHeight = Math.min(currentHeight * 2, 20000000);
        
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                this.viewer.camera.positionCartographic.longitude * 180 / Math.PI,
                this.viewer.camera.positionCartographic.latitude * 180 / Math.PI,
                newHeight
            ),
            duration: 1.0
        });
    }

    // Reset to initial view with smooth animation
    resetView() {
        if (this.initialView) {
            this.viewer.camera.flyTo({
                destination: this.initialView.position,
                orientation: {
                    heading: this.initialView.heading,
                    pitch: this.initialView.pitch,
                    roll: this.initialView.roll
                },
                duration: 2.0
            });
        }
    }

    // Set camera to specific position with smooth animation
    setCameraPosition(longitude, latitude, height, heading = 0, pitch = -45, roll = 0) {
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(pitch),
                roll: Cesium.Math.toRadians(roll)
            },
            duration: 2.0
        });
    }

    // Focus on a specific area with bounds
    focusOnBounds(west, south, east, north, height = 1000) {
        this.viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
            duration: 2.0
        });
    }

    // Get current camera position
    getCurrentPosition() {
        const position = this.viewer.camera.positionCartographic;
        return {
            longitude: position.longitude * 180 / Math.PI,
            latitude: position.latitude * 180 / Math.PI,
            height: position.height
        };
    }

    // Enable/disable terrain following
    setTerrainFollowing(enabled) {
        this.viewer.scene.globe.depthTestAgainstTerrain = enabled;
    }

    // Set time of day for lighting
    setTimeOfDay(hour) {
        const now = Cesium.JulianDate.now();
        const time = Cesium.JulianDate.addHours(now, hour - new Date().getHours(), new Cesium.JulianDate());
        this.viewer.clock.currentTime = time;
    }
}

class CarViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Load model
        this.loadModel();

        // Start animation loop
        this.animate();
    }

    loadModel() {
        const loadingManager = new THREE.LoadingManager();
        const objLoader = new THREE.OBJLoader(loadingManager);

        // Add loading text
        const loadingText = document.createElement('div');
        loadingText.style.position = 'absolute';
        loadingText.style.top = '50%';
        loadingText.style.left = '50%';
        loadingText.style.transform = 'translate(-50%, -50%)';
        loadingText.style.color = '#666';
        loadingText.textContent = 'Loading 3D Model...';
        this.container.appendChild(loadingText);

        // Update loading progress
        loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total) * 100;
            loadingText.textContent = `Loading: ${Math.round(progress)}%`;
        };

        // Handle loading complete
        loadingManager.onLoad = () => {
            loadingText.remove();
            console.log('Loading complete!');
        };

        // Handle loading error
        loadingManager.onError = (url) => {
            console.error('Error loading', url);
            loadingText.textContent = 'Error loading model';
        };

        // Load the model
        objLoader.load(
            './models/canter.obj',
            (object) => {
                // Center the model
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);

                // Scale the model to a reasonable size
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDim;
                object.scale.multiplyScalar(scale);

                // Add shadows
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Add a default material if none exists
                        if (!child.material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x808080,
                                roughness: 0.7,
                                metalness: 0.3
                            });
                        }
                    }
                });

                this.scene.add(object);
            },
            (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                loadingText.textContent = `Loading: ${Math.round(progress)}%`;
            },
            (error) => {
                console.error('Error loading model:', error);
                loadingText.textContent = 'Error loading model';
            }
        );
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const viewer = new CarViewer('car-viewer');
});

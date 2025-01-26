class CarViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.car = null;

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0xf5f5f5, 1);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(5, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
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
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Start animation loop
        this.animate();

        // Load initial model
        this.loadModel('./models/canter.obj');
    }

    loadModel(modelPath) {
        // Show loading indicator
        const loadingText = this.showLoadingIndicator();

        // Determine file type from extension
        const fileExtension = modelPath.split('.').pop().toLowerCase();

        if (fileExtension === 'glb' || fileExtension === 'gltf') {
            this.loadGLTF(modelPath, loadingText);
        } else if (fileExtension === 'obj') {
            this.loadOBJ(modelPath, loadingText);
        } else {
            loadingText.textContent = 'Unsupported file format';
            console.error('Unsupported file format:', fileExtension);
        }
    }

    loadGLTF(modelPath, loadingText) {
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            modelPath,
            (gltf) => {
                this.processLoadedModel(gltf.scene, loadingText);
            },
            (xhr) => {
                const percent = (xhr.loaded / xhr.total) * 100;
                loadingText.textContent = `Loading: ${Math.round(percent)}%`;
            },
            (error) => {
                console.error('Error loading GLB/GLTF model:', error);
                loadingText.textContent = 'Error loading model';
            }
        );
    }

    loadOBJ(modelPath, loadingText) {
        const mtlPath = modelPath.replace('.obj', '.mtl');
        const mtlLoader = new THREE.MTLLoader();
        const objLoader = new THREE.OBJLoader();

        // First try to load MTL (materials)
        mtlLoader.load(
            mtlPath,
            (materials) => {
                materials.preload();
                objLoader.setMaterials(materials);
                this.loadOBJFile(objLoader, modelPath, loadingText);
            },
            undefined,
            () => {
                // If MTL fails to load, just load the OBJ without materials
                console.warn('No MTL file found, loading OBJ without materials');
                this.loadOBJFile(objLoader, modelPath, loadingText);
            }
        );
    }

    loadOBJFile(objLoader, modelPath, loadingText) {
        objLoader.load(
            modelPath,
            (obj) => {
                this.processLoadedModel(obj, loadingText);
            },
            (xhr) => {
                const percent = (xhr.loaded / xhr.total) * 100;
                loadingText.textContent = `Loading: ${Math.round(percent)}%`;
            },
            (error) => {
                console.error('Error loading OBJ model:', error);
                loadingText.textContent = 'Error loading model';
            }
        );
    }

    showLoadingIndicator() {
        this.container.style.position = 'relative';
        const loadingText = document.createElement('div');
        loadingText.style.position = 'absolute';
        loadingText.style.top = '50%';
        loadingText.style.left = '50%';
        loadingText.style.transform = 'translate(-50%, -50%)';
        loadingText.style.color = '#666';
        loadingText.textContent = 'Loading 3D Model...';
        this.container.appendChild(loadingText);
        return loadingText;
    }

    processLoadedModel(model, loadingText) {
        // Remove loading text
        loadingText.remove();

        if (this.car) {
            this.scene.remove(this.car);
        }
        this.car = model;

        // Enable shadows
        this.car.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.scene.add(this.car);

        // Center the model
        const box = new THREE.Box3().setFromObject(this.car);
        const center = box.getCenter(new THREE.Vector3());
        this.car.position.sub(center);
        
        // Scale the model appropriately
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.car.scale.multiplyScalar(scale);

        // Position slightly above ground
        this.car.position.y = 0.01;
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

// Initialize car viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const viewer = new CarViewer('car-viewer');
});

/**
 * Initializes a 360 Image Viewer in a specific container.
 */
function initImagePanoramaViewer(containerId, imagePath) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initImagePanoramaViewer: Container '${containerId}' not found.`);
    return;
  }

  // 1. Setup Scene
  const scene = new THREE.Scene();
  // Calculate aspect ratio based on the container's current dimensions
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.PerspectiveCamera(75, aspect, 1, 1100);
  camera.target = new THREE.Vector3(0, 0, 0);

  // 2. Create Sphere & Map Image
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1); // Invert so we view from inside

  const texture = new THREE.TextureLoader().load(imagePath);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // 3. Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // 4. Interaction Variables (Local scope only!)
  let isUserInteracting = false;
  let onPointerDownPointerX = 0, onPointerDownPointerY = 0;
  let lon = 180, onPointerDownLon = 0; 
  let lat = 0, onPointerDownLat = 0;
  let phi = 0, theta = 0;

  // 5. Interaction Functions
  function onPointerStart(event) {
    isUserInteracting = true;
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    onPointerDownPointerX = clientX;
    onPointerDownPointerY = clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    // Prevent default to stop scrolling on touch devices while dragging
    // But be careful not to block scrolling entirely if they touch outside
    if (event.cancelable) event.preventDefault(); 
  }

  function onPointerMove(event) {
    if (!isUserInteracting) return;
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    lon = (onPointerDownPointerX - clientX) * 0.1 + onPointerDownLon;
    lat = (clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
  }

  function onPointerUp() {
    isUserInteracting = false;
  }

  // Attach events to container
  container.addEventListener('mousedown', onPointerStart);
  container.addEventListener('mousemove', onPointerMove);
  container.addEventListener('mouseup', onPointerUp);
  container.addEventListener('mouseleave', onPointerUp);

  // Touch events
  container.addEventListener('touchstart', onPointerStart, { passive: false });
  container.addEventListener('touchmove', onPointerMove, { passive: false });
  container.addEventListener('touchend', onPointerUp);

  // 6. Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    update();
  }

  function update() {
    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(camera.target);

    renderer.render(scene, camera);
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    // Check if container still exists before resizing
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });

  animate();
}
document.addEventListener('DOMContentLoaded', () => {
  // Find all elements with the class 'pano-image'
  const viewers = document.querySelectorAll('.pano-image');

  viewers.forEach((element, index) => {
    // 1. Generate a unique ID on the fly (fixes the missing ID issue)
    const uniqueId = 'pano-viewer-' + index;
    element.id = uniqueId;

    const outputImagePath = element.getAttribute('data-image');

    if (outputImagePath) {
      // 2. Initialize the 360 viewer
      initImagePanoramaViewer(uniqueId, outputImagePath);

      // 3. Auto-fill the Input Image in the same row
      // This looks up to the parent row, then finds the input img tag
      const row = element.closest('.comparison-row');
      const inputImg = row.querySelector('.input-perspective-img');
      
      if (inputImg) {
        // Logic: change "_ours.png" to "_input.png"
        inputImg.src = outputImagePath.replace('_ours.png', '_input.png');
      }
    }
  });
});
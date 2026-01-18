/**
 * Initializes a 360 Video Viewer in a specific container.
 */
// --- Video 360 viewer ---
// We will edit this function in the next step based on your file paths!
function getCorresponding360VideoUrl(originalSrc) {
  // Input:  videos/video_qualitative_comparison/ytb_input_34.mp4
  // Output: videos/video_qualitative_comparison/ytb_ours_34.mp4
  
  // We simply replace "input" with "ours" in the filename
  return originalSrc.replace('_concat.mp4', '.mp4');
}

// --- CORE VARIABLES ---
let camera, scene, renderer, sphere, video360;
let isUserInteracting = false, lon = 180, lat = 0, phi = 0, theta = 0;
let onPointerDownPointerX = 0, onPointerDownPointerY = 0, onPointerDownLon = 0, onPointerDownLat = 0;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Attach click listeners to all "View in 360" buttons
  document.querySelectorAll('.play-360-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Find the video element next to this button
      const wrapper = e.target.closest('.video-wrapper');
      const sourceVideo = wrapper.querySelector('video source').src;

      // Get the 360 URL and open modal
      const video360Url = getCorresponding360VideoUrl(sourceVideo);
      openModal(video360Url);
    });
  });

  // Close button listener
  document.getElementById('closeModal').addEventListener('click', closeModal);
  
  // Play/Pause listener
  document.getElementById('playPauseBtn').addEventListener('click', () => {
    if(video360.paused) { video360.play(); } else { video360.pause(); }
  });
  
  // Reset View listener
  document.getElementById('resetViewBtn').addEventListener('click', () => { lon = 180; lat = 0; });

  // Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('videoModal').style.display === 'flex') {
      closeModal();
    }
  });
});

// --- 360 PLAYER LOGIC ---
function openModal(url) {
  lon = 180;
  lat = 0;

  const modal = document.getElementById('videoModal');
  const container = document.getElementById('video360Container');
  
  // CHANGED: Use 'flex' so CSS centering works
  modal.style.display = 'flex';

  // Cleanup previous scene if exists
  if (renderer) { container.innerHTML = ''; }

  // 1. Create 360 Video Element
  video360 = document.createElement('video');
  video360.src = url;
  video360.loop = true;
  video360.muted = false;
  video360.crossOrigin = "anonymous";
  video360.setAttribute('playsinline', '');
  video360.play();

  // 2. Three.js Setup
  // Note: aspect ratio is now calculated based on the container, not window
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(105, width / height, 1, 1100);
  camera.target = new THREE.Vector3(0, 0, 0);
  scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1); // Invert the sphere so we see the inside

  const texture = new THREE.VideoTexture(video360);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  // CHANGED: Set size to the container size (800x600), not full screen
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // 3. Interaction Events (Drag to rotate)
  // Note: We attach these to the CONTAINER now, not document, 
  // so you can still click outside the box to close (optional future feature)
  // but for now document is fine to ensure smooth dragging even if mouse leaves box.
  container.addEventListener('mousedown', onPointerStart);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  container.addEventListener('touchstart', onPointerStart); 
  document.addEventListener('touchmove', onPointerMove);   // Mobile
  document.addEventListener('touchend', onPointerUp);      // Mobile

  animate();
}

function closeModal() {
  document.getElementById('videoModal').style.display = 'none';
  if(video360) video360.pause();
  // Remove listeners to clean up
  document.removeEventListener('mousedown', onPointerStart);
  document.removeEventListener('mousemove', onPointerMove);
  document.removeEventListener('mouseup', onPointerUp);
}

// --- ANIMATION LOOP ---
function animate() {
  if (document.getElementById('videoModal').style.display === 'none') return;
  requestAnimationFrame(animate);
  
  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(camera.target);
  renderer.render(scene, camera);
}

// --- INTERACTION HELPER FUNCTIONS ---
function onPointerStart(event) {
  isUserInteracting = true;
  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;
  onPointerDownPointerX = clientX;
  onPointerDownPointerY = clientY;
  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onPointerMove(event) {
  if (!isUserInteracting) return;
  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;
  lon = (onPointerDownPointerX - clientX) * 0.1 + onPointerDownLon;
  lat = (clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
}

function onPointerUp() { isUserInteracting = false; }
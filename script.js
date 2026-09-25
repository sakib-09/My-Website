/* Asad's portfolio — interactions */
(function () {
  'use strict';

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Typing effect ----
  var words = ['running.', 'secure.', 'tested.', 'documented.'];
  var typedEl = document.getElementById('typed');
  if (typedEl) {
    var wi = 0, ci = 0, deleting = false;
    (function tick() {
      var word = words[wi];
      if (!deleting) {
        ci++;
        typedEl.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; return setTimeout(tick, 1600); }
        return setTimeout(tick, 70);
      }
      ci--;
      typedEl.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; return setTimeout(tick, 350); }
      setTimeout(tick, 38);
    })();
  }

  // ---- Reveal on scroll ----
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // ---- Three.js 3D network background ----
  var canvas = document.getElementById('net-canvas');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b16, 0.0016);
  var camera = new THREE.PerspectiveCamera(60, 1, 1, 4000);
  camera.position.z = 700;

  var isMobile = window.innerWidth < 760;
  var COUNT = isMobile ? 90 : 170;
  var LINK_DIST = isMobile ? 170 : 200;
  var SPREAD = 1600;

  var positions = new Float32Array(COUNT * 3);
  var velocities = [];
  for (var i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
    velocities.push({
      x: (Math.random() - 0.5) * 0.9,
      y: (Math.random() - 0.5) * 0.9,
      z: (Math.random() - 0.5) * 0.9
    });
  }
  var pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pointsMat = new THREE.PointsMaterial({ color: 0x22d3ee, size: 5, transparent: true, opacity: 0.85, sizeAttenuation: true });
  var points = new THREE.Points(pointsGeo, pointsMat);
  var network = new THREE.Group();
  network.add(points);
  scene.add(network);

  var lineGeo = new THREE.BufferGeometry();
  var linePos = new Float32Array(COUNT * COUNT * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  var lineMat = new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.16 });
  var lines = new THREE.LineSegments(lineGeo, lineMat);
  network.add(lines);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // Mouse parallax
  var mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Pause when tab hidden or hero off-screen (perf)
  var running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!running || reduceMotion) { renderer.render(scene, camera); return; }

    var pos = pointsGeo.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;
      var half = SPREAD / 2;
      if (pos[i * 3] > half || pos[i * 3] < -half) velocities[i].x *= -1;
      if (pos[i * 3 + 1] > half || pos[i * 3 + 1] < -half) velocities[i].y *= -1;
      if (pos[i * 3 + 2] > half || pos[i * 3 + 2] < -half) velocities[i].z *= -1;
    }
    pointsGeo.attributes.position.needsUpdate = true;

    // rebuild links
    var li = 0;
    var d2max = LINK_DIST * LINK_DIST;
    for (var a = 0; a < COUNT; a++) {
      for (var b = a + 1; b < COUNT; b++) {
        var dx = pos[a * 3] - pos[b * 3];
        var dy = pos[a * 3 + 1] - pos[b * 3 + 1];
        var dz = pos[a * 3 + 2] - pos[b * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < d2max) {
          linePos[li++] = pos[a * 3]; linePos[li++] = pos[a * 3 + 1]; linePos[li++] = pos[a * 3 + 2];
          linePos[li++] = pos[b * 3]; linePos[li++] = pos[b * 3 + 1]; linePos[li++] = pos[b * 3 + 2];
        }
      }
    }
    lineGeo.setDrawRange(0, li / 3);
    lineGeo.attributes.position.needsUpdate = true;

    network.rotation.y += 0.0009;
    network.rotation.x += 0.00025;
    camera.position.x += (mouseX * 90 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 60 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  frame();
})();

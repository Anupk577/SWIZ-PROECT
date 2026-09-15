import React, { useEffect, useRef, useState } from "react";
import { SwizLogo } from "./SwizLogo";
import * as THREE from "three";

export const Hero3DCanvas: React.FC = () => {
  const [fallback, setFallback] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    // 3. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFallback(true);
      return;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Create 3D Shield / Emblem Geometry
    const shieldGroup = new THREE.Group();

    // Outer Crimson Shield Geometry
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.8);
    shieldShape.quadraticCurveTo(1.5, 1.4, 1.5, 0.2);
    shieldShape.quadraticCurveTo(1.5, -1.2, 0, -1.8);
    shieldShape.quadraticCurveTo(-1.5, -1.2, -1.5, 0.2);
    shieldShape.quadraticCurveTo(-1.5, 1.4, 0, 1.8);

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const geometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    geometry.center();

    // Crimson Red Metallic Material matching Swiz brand (#E3262E)
    const material = new THREE.MeshStandardMaterial({
      color: 0xe3262e,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });

    const shieldMesh = new THREE.Mesh(geometry, material);
    shieldGroup.add(shieldMesh);

    // Inner Glowing Wireframe Core
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMat);
    wireframeMesh.scale.set(1.04, 1.04, 1.04);
    shieldGroup.add(wireframeMesh);

    // Orbiting Ring Mesh
    const ringGeo = new THREE.TorusGeometry(2.4, 0.03, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xe3262e,
      emissiveIntensity: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    shieldGroup.add(ringMesh);

    scene.add(shieldGroup);

    // 5. 3D Particle Starfield (1,200 Particles)
    const particlesCount = 1200;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 18;
      posArray[i + 1] = (Math.random() - 0.5) * 18;
      posArray[i + 2] = (Math.random() - 0.5) * 18;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xe3262e,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // 6. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xe3262e, 8, 50);
    pointLight.position.set(3, 4, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0xffffff, 3, 50);
    backLight.position.set(-4, -4, -3);
    scene.add(backLight);

    // 7. Mouse Parallax Motion
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX = (e.clientX / innerWidth - 0.5) * 0.8;
      mouseY = (e.clientY / innerHeight - 0.5) * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Animation Loop
    let animationFrameId = 0;

    const animate = () => {
      if (!reducedMotion) animationFrameId = requestAnimationFrame(animate);

      // Rotate Shield
      shieldGroup.rotation.y += 0.008;
      shieldGroup.rotation.x =
        Math.sin(Date.now() * 0.001) * 0.1 + mouseY * 0.5;
      shieldGroup.rotation.z = mouseX * 0.3;

      // Rotate Ring
      ringMesh.rotation.z += 0.015;

      // Rotate Particles
      particleSystem.rotation.y -= 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (reducedMotion) renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      wireframeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-[380px] sm:h-[480px] relative pointer-events-none select-none flex items-center justify-center"
    >
      {fallback && <SwizLogo size="lg" showTagline />}
    </div>
  );
};

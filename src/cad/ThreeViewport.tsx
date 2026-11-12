import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CADProduct, MechanicalPart } from '../types';

interface ThreeViewportProps {
  product: CADProduct;
  explodedProgress: number; // 0 to 1
  selectedPartId: string | null;
  onSelectPart: (part: MechanicalPart | null) => void;
  simulationActive: boolean; // thermal / stress mode
  activeLayerFilter: string; // 'all' | 'silkscreen' | 'copper_top' | 'fr4' | 'copper_bottom'
  cameraPreset: 'iso' | 'top' | 'front' | 'cross' | 'underneath' | 'macro';
  hiddenPartIds?: string[];
  xrayMode?: boolean;
}

// Module-level scratch vectors to prevent garbage collection in 60fps render loop
const _targetVec = new THREE.Vector3();
const _camPos = new THREE.Vector3();

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  product,
  explodedProgress,
  selectedPartId,
  onSelectPart,
  simulationActive,
  activeLayerFilter,
  cameraPreset,
  hiddenPartIds = [],
  xrayMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const partMeshesMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const flawMarkersGroupRef = useRef<THREE.Group | null>(null);
  const currentExplodeRef = useRef(0);
  const targetExplodeRef = useRef(0);

  // Keep target explode synced
  useEffect(() => {
    targetExplodeRef.current = explodedProgress;
  }, [explodedProgress]);

  // Handle camera presets smoothly
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const controls = controlsRef.current;

    switch (cameraPreset) {
      case 'iso':
        cam.position.set(5.5, 4.5, 6.0);
        controls.target.set(0, 0.5, 0);
        break;
      case 'top':
        cam.position.set(0.001, 8.5, 0.001); // avoid exact collinear singularity
        controls.target.set(0, 0.5, 0);
        break;
      case 'front':
        cam.position.set(0.0, 1.8, 8.0);
        controls.target.set(0, 0.5, 0);
        break;
      case 'cross':
        cam.position.set(5.5, 1.5, 2.5);
        controls.target.set(0, 0.5, 0);
        break;
      case 'underneath':
        cam.position.set(0.0, -6.5, 3.5);
        controls.target.set(0, 0.2, 0);
        break;
      case 'macro':
        cam.position.set(0.8, 2.2, 2.0);
        controls.target.set(0, 0.6, 0);
        break;
    }
    controls.update();
  }, [cameraPreset]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene & Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05080e);
    scene.fog = new THREE.FogExp2(0x05080e, 0.035);

    // 3. Setup Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(5.5, 4.5, 6.0);
    cameraRef.current = camera;

    // 4. Setup Renderer with Studio PBR pipeline
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // 5. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Studio Lighting Rig
    // Warm Key Light with soft shadow
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(6, 9, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Cool Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x05080e, 1.4);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // Sharp Cyan Rim Light (Iron Man Hologram aesthetic)
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    rimLight.position.set(-6, -2, -6);
    scene.add(rimLight);

    // Holographic ground pedestal grid
    const gridHelper = new THREE.GridHelper(14, 28, 0x00f0ff, 0x0a2540);
    gridHelper.position.y = -1.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // Soft radial contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.18;
    scene.add(shadowPlane);

    // 7. Setup OrbitControls (High-Reliability Multi-Touch & Two-Finger Pan/Zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 22;
    controls.minDistance = 1.2;
    controls.maxPolarAngle = Math.PI - 0.04; // allow viewing completely from underneath
    controls.minPolarAngle = 0.04;
    controls.target.set(0, 0.4, 0);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // 8. Parts root group
    const partsGroup = new THREE.Group();
    partsGroupRef.current = partsGroup;
    scene.add(partsGroup);

    // Flaws group
    const flawsGroup = new THREE.Group();
    flawMarkersGroupRef.current = flawsGroup;
    scene.add(flawsGroup);

    // 9. Raycasting for component selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(partsGroup.children, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && hitObj !== partsGroup) {
          if (hitObj.userData?.partId) {
            const found = product.parts.find((p) => p.id === hitObj!.userData.partId);
            if (found) {
              onSelectPart(found);
              return;
            }
          }
          hitObj = hitObj.parent;
        }
      } else {
        onSelectPart(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 10. Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 11. 60fps Animation Loop with Exponential Damping
    let frameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.1);

      // Smooth exploded view interpolation
      currentExplodeRef.current = THREE.MathUtils.damp(
        currentExplodeRef.current,
        targetExplodeRef.current,
        6,
        dt
      );

      // Update positions of parts based on explode direction
      partMeshesMapRef.current.forEach((meshes, partId) => {
        const part = product.parts.find((p) => p.id === partId);
        if (part) {
          const dist = part.explodeDistance * currentExplodeRef.current;
          const [dx, dy, dz] = part.explodeDirection;
          meshes.forEach((mesh) => {
            mesh.position.set(dx * dist, dy * dist, dz * dist);
          });
        }
      });

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      pmremGenerator.dispose();
      controls.dispose();
    };
  }, [product.id]);

  // Re-build 3D CAD & PCB Meshes whenever product or simulation changes
  useEffect(() => {
    const partsGroup = partsGroupRef.current;
    const flawsGroup = flawMarkersGroupRef.current;
    if (!partsGroup || !flawsGroup) return;

    // Clear previous objects
    while (partsGroup.children.length > 0) {
      partsGroup.remove(partsGroup.children[0]);
    }
    while (flawsGroup.children.length > 0) {
      flawsGroup.remove(flawsGroup.children[0]);
    }
    partMeshesMapRef.current.clear();

    // Build realistic composite procedural 3D model for current product
    buildProceduralModel(
      product,
      partsGroup,
      partMeshesMapRef.current,
      simulationActive,
      selectedPartId,
      hiddenPartIds,
      xrayMode
    );

    // Build 3D Flaw Markers
    product.knownFlaws.forEach((flaw) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.set(...flaw.position);

      // Glowing holographic beacon ring
      const ringGeo = new THREE.RingGeometry(0.12, 0.18, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: flaw.severity === 'critical' ? 0xef4444 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      markerGroup.add(ringMesh);

      // Vertical holographic reticle stem
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
      const stemMat = new THREE.MeshBasicMaterial({
        color: flaw.severity === 'critical' ? 0xef4444 : 0xf59e0b,
        transparent: true,
        opacity: 0.8,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.y = 0.3;
      markerGroup.add(stemMesh);

      // Warning diamond at top
      const diamondGeo = new THREE.OctahedronGeometry(0.1, 0);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: flaw.severity === 'critical' ? 0xff0044 : 0xffaa00,
        emissive: flaw.severity === 'critical' ? 0xff0044 : 0xffaa00,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
      diamondMesh.position.y = 0.65;
      markerGroup.add(diamondMesh);

      flawsGroup.add(markerGroup);
    });
  }, [product, simulationActive, selectedPartId, hiddenPartIds, xrayMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

// Procedural 3D Model Generator for Hardware Assemblies
function buildProceduralModel(
  product: CADProduct,
  parentGroup: THREE.Group,
  partMap: Map<string, THREE.Mesh[]>,
  simulationActive: boolean,
  selectedPartId: string | null,
  hiddenPartIds: string[] = [],
  xrayMode: boolean = false
) {
  product.parts.forEach((part) => {
    // 1. Skip hidden parts (e.g. user commanded: "Remove the circuitry from inside the drone")
    if (hiddenPartIds.includes(part.id)) {
      return;
    }

    const isSelected = selectedPartId === part.id;
    const meshes: THREE.Mesh[] = [];

    // Base PBR Material
    let matColor = new THREE.Color(part.color);
    let roughness = part.roughness;
    let metalness = part.metalness;
    let emissiveColor = new THREE.Color(0x000000);
    let emissiveIntensity = 0;
    let isTranslucent = false;
    let opacityVal = 1.0;

    // See-Through / X-Ray Mode: Enclosure parts appear see-through while clearly defining enclosure outline
    if (
      xrayMode &&
      (part.category === 'mechanical' ||
        part.id === 'cnc_heatsink' ||
        part.id === 'radial_heatsink' ||
        part.id === 'outer_rotor' ||
        part.id === 'acrylic_cover')
    ) {
      isTranslucent = true;
      opacityVal = 0.28;
      roughness = 0.15;
      metalness = 0.1;
      matColor = new THREE.Color(0x38bdf8);
      emissiveColor = new THREE.Color(0x00f0ff);
      emissiveIntensity = 0.15;
    }

    // In simulation mode, show thermal dissipation gradient
    if (simulationActive) {
      if (part.flawNotice || part.id === 'mosfet_bank' || part.id === 'toroidal_inductor') {
        matColor = new THREE.Color(0xef4444); // Thermal hotspot: 115°C+
        emissiveColor = new THREE.Color(0xff2200);
        emissiveIntensity = 0.45;
      } else if (part.id === 'cnc_heatsink' || part.id === 'radial_heatsink') {
        matColor = new THREE.Color(0xf59e0b); // Dissipation fin: 68°C
        emissiveColor = new THREE.Color(0x7c2d12);
        emissiveIntensity = 0.2;
      } else {
        matColor = new THREE.Color(0x0284c7); // Cool baseline: 32°C
      }
    }

    if (isSelected) {
      emissiveColor = new THREE.Color(0x00f0ff);
      emissiveIntensity = 0.55;
    }

    const material = new THREE.MeshStandardMaterial({
      color: matColor,
      roughness,
      metalness,
      emissive: emissiveColor,
      emissiveIntensity,
      transparent: isTranslucent || part.id === 'acrylic_cover',
      opacity: isTranslucent ? opacityVal : part.id === 'acrylic_cover' ? 0.75 : 1.0,
      depthWrite: !isTranslucent,
    });

    // Build procedural 3D geometries based on part type
    if (part.id === 'pcb_main' || part.id === 'arc_pcb' || part.id === 'encoder_pcb') {
      // PCB Board Substrate with chamfered edges
      let pcbGeo: THREE.BufferGeometry;
      if (product.id === 'arc_regulator' || product.id === 'micro_gimbal') {
        // Circular PCB with center cutout
        pcbGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.08, 48);
      } else {
        // Rectangular PCB with rounded corners
        pcbGeo = new THREE.BoxGeometry(2.4, 0.08, 1.5);
      }
      const pcbMesh = new THREE.Mesh(pcbGeo, material);
      pcbMesh.receiveShadow = true;
      pcbMesh.castShadow = true;
      pcbMesh.userData = { partId: part.id };
      parentGroup.add(pcbMesh);
      meshes.push(pcbMesh);

      // Add Gold Immersion (ENIG) Solder Pads
      const padGeo = new THREE.BoxGeometry(0.18, 0.085, 0.28);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.2,
      });
      for (let i = -3; i <= 3; i++) {
        const padMesh1 = new THREE.Mesh(padGeo, padMat);
        padMesh1.position.set(i * 0.32, 0.01, 0.65);
        pcbMesh.add(padMesh1);

        const padMesh2 = new THREE.Mesh(padGeo, padMat);
        padMesh2.position.set(i * 0.32, 0.01, -0.65);
        pcbMesh.add(padMesh2);
      }
    } else if (part.id === 'cnc_heatsink') {
      // Aluminum CNC Heatsink with 6 micro-fins
      const baseGeo = new THREE.BoxGeometry(2.2, 0.12, 1.35);
      const heatsinkBase = new THREE.Mesh(baseGeo, material);
      heatsinkBase.castShadow = true;
      heatsinkBase.receiveShadow = true;
      heatsinkBase.userData = { partId: part.id };

      // Micro-cooling fins
      const finGeo = new THREE.BoxGeometry(2.1, 0.25, 0.04);
      for (let f = -5; f <= 5; f++) {
        const finMesh = new THREE.Mesh(finGeo, material);
        finMesh.position.set(0, 0.15, f * 0.11);
        finMesh.castShadow = true;
        heatsinkBase.add(finMesh);
      }
      parentGroup.add(heatsinkBase);
      meshes.push(heatsinkBase);
    } else if (part.id === 'mosfet_bank' || part.id === 'gan_fets') {
      // Power MOSFETs in 3-phase bridge array
      const fetGroup = new THREE.Group();
      fetGroup.userData = { partId: part.id };
      const fetGeo = new THREE.BoxGeometry(0.35, 0.09, 0.32);

      const positions = [
        [-0.8, 0.1, 0.35],
        [-0.8, 0.1, -0.35],
        [0.0, 0.1, 0.35],
        [0.0, 0.1, -0.35],
        [0.8, 0.1, 0.35],
        [0.8, 0.1, -0.35],
      ];

      positions.forEach(([x, y, z]) => {
        const fetMesh = new THREE.Mesh(fetGeo, material);
        fetMesh.position.set(x, y, z);
        fetMesh.castShadow = true;
        fetGroup.add(fetMesh);
      });
      parentGroup.add(fetGroup as any);
      meshes.push(fetGroup as any);
    } else if (part.id === 'stm32_mcu') {
      // QFN-32 Microcontroller IC with pin 1 indicator dot
      const mcuGeo = new THREE.BoxGeometry(0.45, 0.08, 0.45);
      const mcuMesh = new THREE.Mesh(mcuGeo, material);
      mcuMesh.position.set(-0.35, 0.1, 0);
      mcuMesh.castShadow = true;
      mcuMesh.userData = { partId: part.id };

      // Pin 1 laser dot
      const dotGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.085, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(-0.15, 0.01, -0.15);
      mcuMesh.add(dotMesh);

      parentGroup.add(mcuMesh);
      meshes.push(mcuMesh);
    } else if (part.id === 'filter_capacitor') {
      // Solid polymer electrolytic capacitor cylinder
      const capGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 24);
      const capMesh = new THREE.Mesh(capGeo, material);
      capMesh.position.set(1.4, 0.4, 0);
      capMesh.rotation.z = Math.PI / 2;
      capMesh.castShadow = true;
      capMesh.userData = { partId: part.id };
      parentGroup.add(capMesh);
      meshes.push(capMesh);
    } else if (part.id === 'outer_rotor') {
      // CNC Aluminum Rotor Bell
      const bellGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.75, 48, 1, true);
      const bellMesh = new THREE.Mesh(bellGeo, material);
      bellMesh.castShadow = true;
      bellMesh.userData = { partId: part.id };

      // Top cap with cooling cutouts
      const capGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 48);
      const capMesh = new THREE.Mesh(capGeo, material);
      capMesh.position.y = 0.38;
      bellMesh.add(capMesh);

      parentGroup.add(bellMesh);
      meshes.push(bellMesh);
    } else if (part.id === 'stator_core') {
      // 12-tooth Stator with Copper Windings
      const statorGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.45, 12);
      const statorMesh = new THREE.Mesh(statorGeo, material);
      statorMesh.castShadow = true;
      statorMesh.userData = { partId: part.id };
      parentGroup.add(statorMesh);
      meshes.push(statorMesh);
    } else if (part.id === 'hollow_shaft') {
      // Titanium Center Shaft
      const shaftGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.6, 24);
      const shaftMesh = new THREE.Mesh(shaftGeo, material);
      shaftMesh.castShadow = true;
      shaftMesh.userData = { partId: part.id };
      parentGroup.add(shaftMesh);
      meshes.push(shaftMesh);
    } else if (part.id === 'toroidal_inductor') {
      // Sendust Toroid Coil
      const toroidGeo = new THREE.TorusGeometry(0.9, 0.22, 24, 48);
      const toroidMesh = new THREE.Mesh(toroidGeo, material);
      toroidMesh.rotation.x = Math.PI / 2;
      toroidMesh.position.y = 0.3;
      toroidMesh.castShadow = true;
      toroidMesh.userData = { partId: part.id };
      parentGroup.add(toroidMesh);
      meshes.push(toroidMesh);
    } else if (part.id === 'radial_heatsink') {
      // Circular Radial Fin Heatsink
      const heatsinkGroup = new THREE.Group();
      heatsinkGroup.userData = { partId: part.id };
      const baseGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 36);
      const baseMesh = new THREE.Mesh(baseGeo, material);
      baseMesh.castShadow = true;
      heatsinkGroup.add(baseMesh);

      // Radial cooling fins
      const finGeo = new THREE.BoxGeometry(0.6, 0.35, 0.05);
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const fin = new THREE.Mesh(finGeo, material);
        fin.position.set(Math.cos(angle) * 1.35, 0.2, Math.sin(angle) * 1.35);
        fin.rotation.y = -angle;
        fin.castShadow = true;
        heatsinkGroup.add(fin);
      }
      parentGroup.add(heatsinkGroup as any);
      meshes.push(heatsinkGroup as any);
    } else if (part.id === 'acrylic_cover') {
      // Laser etched acrylic top glass
      const glassGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.06, 48);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.75,
        ior: 1.49,
      });
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.y = 0.7;
      glassMesh.userData = { partId: part.id };
      parentGroup.add(glassMesh);
      meshes.push(glassMesh);
    } else if (part.id === 'lower_insulation') {
      // Thin dielectric Kapton polyimide base film matching PCB footprint
      const filmGeo = new THREE.BoxGeometry(2.42, 0.02, 1.52);
      const filmMesh = new THREE.Mesh(filmGeo, material);
      filmMesh.position.y = -0.06;
      filmMesh.castShadow = true;
      filmMesh.receiveShadow = true;
      filmMesh.userData = { partId: part.id };
      parentGroup.add(filmMesh);
      meshes.push(filmMesh);
    } else if (part.id === 'work_surface') {
      // Precision Optical Prototyping Breadboard Plate (Clean Slate)
      const surfaceGroup = new THREE.Group();
      surfaceGroup.userData = { partId: part.id };
      const plateGeo = new THREE.BoxGeometry(4.4, 0.1, 3.2);
      const plateMesh = new THREE.Mesh(plateGeo, material);
      plateMesh.receiveShadow = true;
      plateMesh.castShadow = true;
      surfaceGroup.add(plateMesh);

      // Tapped M6 grid holes on surface
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
      const holeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.11, 12);
      for (let x = -1.8; x <= 1.8; x += 0.45) {
        for (let z = -1.2; z <= 1.2; z += 0.45) {
          const hole = new THREE.Mesh(holeGeo, holeMat);
          hole.position.set(x, 0.01, z);
          surfaceGroup.add(hole);
        }
      }
      parentGroup.add(surfaceGroup as any);
      meshes.push(surfaceGroup as any);
    } else {
      // Default fallback: match product form factor (box for rectangular, cylinder for circular)
      const isCircular = product.id === 'arc_regulator' || product.id === 'micro_gimbal';
      const defaultGeo = isCircular
        ? new THREE.CylinderGeometry(1.2, 1.2, 0.1, 36)
        : new THREE.BoxGeometry(2.0, 0.08, 1.2);
      const defaultMesh = new THREE.Mesh(defaultGeo, material);
      defaultMesh.userData = { partId: part.id };
      parentGroup.add(defaultMesh);
      meshes.push(defaultMesh);
    }

    partMap.set(part.id, meshes);
  });
}

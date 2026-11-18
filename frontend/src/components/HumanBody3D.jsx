import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  Clock,
  PlusCircle,
} from 'lucide-react';
import api from '../services/api';

/**
 * Anatomical Regions and their clinically associated food allergy symptoms
 */
export const BODY_REGIONS_CONFIG = {
  head: {
    id: 'head',
    name: 'Head & Cranium',
    description: 'Neurological & systemic allergy manifestations',
    color: 0x8b5cf6, // Purple
    icon: 'Brain',
    symptoms: [
      'Dizziness / Lightheadedness',
      'Headache / Migraine-like throbbing',
      'Faintness / Drop in Blood Pressure',
      'Confusion / Brain Fog',
    ],
    position: [0, 2.7, 0],
    scale: [0.65, 0.75, 0.65],
  },
  eyes: {
    id: 'eyes',
    name: 'Eyes & Periorbital Area',
    description: 'Allergic conjunctivitis & ocular swelling',
    color: 0x06b6d4, // Cyan
    symptoms: [
      'Eye redness / Conjunctival injection',
      'Watery eyes (Epiphora)',
      'Periorbital swelling / Puffy eyelids',
      'Intense ocular itching',
    ],
    position: [0, 2.85, 0.55],
    scale: [0.55, 0.22, 0.25],
  },
  face: {
    id: 'face',
    name: 'Face & Cheeks',
    description: 'Facial angioedema, flushing & hives',
    color: 0xa855f7, // Violet
    symptoms: [
      'Facial swelling (Angioedema)',
      'Flushing / Intense facial warmth',
      'Facial hives (Urticaria)',
      'Tingling or burning sensation',
    ],
    position: [0, 2.5, 0.5],
    scale: [0.55, 0.45, 0.3],
  },
  mouth: {
    id: 'mouth',
    name: 'Mouth, Lips & Tongue',
    description: 'Oral Allergy Syndrome (Pollen Food Allergy)',
    color: 0xec4899, // Pink
    symptoms: [
      'Lip swelling (Angioedema)',
      'Tongue swelling / Glossitis',
      'Oral tingling / Pruritus (Itchy palate)',
      'Blisters / Ulceration around lips',
    ],
    position: [0, 2.25, 0.52],
    scale: [0.45, 0.22, 0.25],
  },
  throat: {
    id: 'throat',
    name: 'Throat & Larynx',
    description: 'Airway restriction & laryngeal edema (HIGH RISK)',
    color: 0xf43f5e, // Rose / Red alert
    isHighRisk: true,
    symptoms: [
      'Throat tightness / Constriction',
      'Difficulty swallowing (Dysphagia)',
      'Hoarseness / Change in voice',
      'Feeling of a lump in throat (Globus sensation)',
      'Stridor (High-pitched whistling breathing)',
    ],
    position: [0, 1.85, 0],
    scale: [0.38, 0.45, 0.38],
  },
  chest: {
    id: 'chest',
    name: 'Chest & Respiratory System',
    description: 'Bronchospasm, lungs & respiratory allergy',
    color: 0x3b82f6, // Blue
    isHighRisk: true,
    symptoms: [
      'Wheezing (Audible breathing whistle)',
      'Shortness of breath (Dyspnea)',
      'Chest tightness / Heavy pressure',
      'Persistent dry coughing fits',
      'Rapid shallow breathing',
    ],
    position: [0, 1.15, 0],
    scale: [1.1, 0.95, 0.7],
  },
  abdomen: {
    id: 'abdomen',
    name: 'Abdomen & Digestive Tract',
    description: 'Gastrointestinal allergy & enteric reactions',
    color: 0x10b981, // Emerald green
    symptoms: [
      'Severe abdominal cramps / Stomach pain',
      'Nausea & retching',
      'Vomiting (Acute post-ingestion)',
      'Diarrhea / Loose stools',
      'Abdominal bloating & excessive gas',
    ],
    position: [0, 0.1, 0],
    scale: [0.95, 0.9, 0.65],
  },
  arms: {
    id: 'arms',
    name: 'Arms & Elbows',
    description: 'Flexural eczema, urticaria & rash',
    color: 0x8b5cf6, // Purple
    symptoms: [
      'Hives on upper & lower arms',
      'Inner elbow eczema flare-up',
      'Intense skin itching',
      'Red warm blotches',
    ],
    position: [0, 0.85, 0], // Multi-mesh representation
    scale: [1.8, 1.4, 0.5],
  },
  hands: {
    id: 'hands',
    name: 'Hands & Palms',
    description: 'Palmar pruritus & contact urticaria',
    color: 0x06b6d4, // Cyan
    symptoms: [
      'Intense palm itching (Classic early anaphylaxis sign)',
      'Hand & finger swelling',
      'Contact hives from touching allergen',
      'Dry, cracked eczematous skin',
    ],
    position: [0, -0.1, 0],
    scale: [1.9, 0.35, 0.3],
  },
  legs: {
    id: 'legs',
    name: 'Legs & Knees',
    description: 'Lower extremity hives, swelling & dermatitis',
    color: 0x6366f1, // Indigo
    symptoms: [
      'Generalized leg hives',
      'Back of knees eczema (Popliteal fossa)',
      'Lower limb swelling',
      'Sole / Plantar itching',
    ],
    position: [0, -1.6, 0],
    scale: [0.9, 2.1, 0.55],
  },
  skin: {
    id: 'skin',
    name: 'Whole Body Skin & Cutaneous Surface',
    description: 'Systemic dermatological allergy presentation',
    color: 0xd946ef, // Fuchsia
    symptoms: [
      'Generalized acute urticaria (Hives all over)',
      'Severe generalized pruritus (Intense body itching)',
      'Diffuse flushing & heat sensation',
      'Angioedema (Soft tissue swelling)',
      'Dermatographia',
    ],
    position: [0, 0.3, 0],
    scale: [1.3, 3.4, 0.8],
  },
};

export default function HumanBody3D({ onSymptomLogged, onOpenSymptomModal }) {
  const mountRef = useRef(null);

  // Active user selections
  const [selectedRegionId, setSelectedRegionId] = useState('skin');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Intense body itching']);
  const [selectedSeverity, setSelectedSeverity] = useState('Moderate');
  const [onsetInterval, setOnsetInterval] = useState('Intermediate (30 - 60 mins)');
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [isRotating, setIsRotating] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Three.js internal references
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const bodyGroupRef = useRef(null);
  const meshesMapRef = useRef(new Map());
  const hoveredMeshRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const selectedRegion = useMemo(() => {
    return BODY_REGIONS_CONFIG[selectedRegionId] || BODY_REGIONS_CONFIG.skin;
  }, [selectedRegionId]);

  // Handle symptom checkbox toggle
  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      if (selectedSymptoms.length > 1) {
        setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
      }
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Switch region selection
  const handleSelectRegion = useCallback((regionId) => {
    setSelectedRegionId(regionId);
    const config = BODY_REGIONS_CONFIG[regionId];
    if (config && config.symptoms.length > 0) {
      setSelectedSymptoms([config.symptoms[0]]);
    }
  }, []);

  // Quick-log symptom to MongoDB Atlas
  const handleQuickLog = async () => {
    if (selectedSymptoms.length === 0) return;
    setIsLogging(true);
    setErrorMessage('');
    setSuccessToast('');

    try {
      const payload = {
        symptomName: selectedSymptoms.join(', '),
        symptomCategory:
          selectedRegionId === 'abdomen'
            ? 'Digestive'
            : selectedRegionId === 'chest' || selectedRegionId === 'throat'
            ? 'Respiratory'
            : 'Skin',
        symptomSeverity: selectedSeverity,
        symptomDate: new Date().toISOString().split('T')[0],
        symptomStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        onsetInterval,
        additionalSymptoms: selectedSymptoms.slice(1),
        additionalNotes: `Logged via Interactive 3D Anatomy Model. Target Anatomical Region: ${selectedRegion.name}.`,
      };

      const res = await api.post('/symptoms', payload);
      setSuccessToast(`Logged "${selectedRegion.name}" symptom successfully to MongoDB Atlas!`);
      if (onSymptomLogged) {
        onSymptomLogged(res.data.data);
      }
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Failed to log symptom via 3D model:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to record symptom. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Initialize Three.js 3D Scene
  useEffect(() => {
    if (viewMode !== '3d' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 380;
    const height = 480;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 7.2);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and transparent background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Ambient & Directional Lighting with Liquid Glass Violet/Cyan Highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3, 20);
    cyanPointLight.position.set(4, 3, 4);
    scene.add(cyanPointLight);

    const purplePointLight = new THREE.PointLight(0x8b5cf6, 3.5, 20);
    purplePointLight.position.set(-4, -1, 3);
    scene.add(purplePointLight);

    const topRimLight = new THREE.DirectionalLight(0xe0e7ff, 1.2);
    topRimLight.position.set(0, 6, 2);
    scene.add(topRimLight);

    // 5. Construct Holographic Anatomical Body Model Group
    const bodyGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    // Base glass material shader parameters
    const createGlassMaterial = (colorHex, opacity = 0.5) => {
      return new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.18,
        metalness: 0.15,
        roughness: 0.25,
        transmission: 0.65,
        transparent: true,
        opacity,
        wireframe: false,
      });
    };

    const meshesMap = new Map();
    meshesMapRef.current = meshesMap;

    // --- A. Head (Cranial Sphere) ---
    const headGeo = new THREE.SphereGeometry(0.55, 32, 24);
    const headMat = createGlassMaterial(BODY_REGIONS_CONFIG.head.color, 0.6);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 2.5, 0);
    headMesh.userData = { regionId: 'head' };
    bodyGroup.add(headMesh);
    meshesMap.set('head', headMesh);

    // --- B. Eyes (Ocular Visor Nodes) ---
    const eyeGeo = new THREE.BoxGeometry(0.55, 0.18, 0.25);
    const eyeMat = createGlassMaterial(BODY_REGIONS_CONFIG.eyes.color, 0.85);
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 2.65, 0.45);
    eyeMesh.userData = { regionId: 'eyes' };
    bodyGroup.add(eyeMesh);
    meshesMap.set('eyes', eyeMesh);

    // --- C. Mouth (Oral Node) ---
    const mouthGeo = new THREE.BoxGeometry(0.35, 0.14, 0.22);
    const mouthMat = createGlassMaterial(BODY_REGIONS_CONFIG.mouth.color, 0.85);
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, 2.22, 0.48);
    mouthMesh.userData = { regionId: 'mouth' };
    bodyGroup.add(mouthMesh);
    meshesMap.set('mouth', mouthMesh);

    // --- D. Throat & Neck (Cylinder) ---
    const throatGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.4, 20);
    const throatMat = createGlassMaterial(BODY_REGIONS_CONFIG.throat.color, 0.7);
    const throatMesh = new THREE.Mesh(throatGeo, throatMat);
    throatMesh.position.set(0, 1.82, 0);
    throatMesh.userData = { regionId: 'throat' };
    bodyGroup.add(throatMesh);
    meshesMap.set('throat', throatMesh);

    // --- E. Chest (Thorax / Respiratory) ---
    const chestGeo = new THREE.BoxGeometry(1.2, 0.95, 0.65);
    const chestMat = createGlassMaterial(BODY_REGIONS_CONFIG.chest.color, 0.55);
    const chestMesh = new THREE.Mesh(chestGeo, chestMat);
    chestMesh.position.set(0, 1.15, 0);
    chestMesh.userData = { regionId: 'chest' };
    bodyGroup.add(chestMesh);
    meshesMap.set('chest', chestMesh);

    // --- F. Abdomen (Digestive Tract) ---
    const abdomenGeo = new THREE.BoxGeometry(1.05, 0.9, 0.6);
    const abdomenMat = createGlassMaterial(BODY_REGIONS_CONFIG.abdomen.color, 0.55);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, abdomenMat);
    abdomenMesh.position.set(0, 0.2, 0);
    abdomenMesh.userData = { regionId: 'abdomen' };
    bodyGroup.add(abdomenMesh);
    meshesMap.set('abdomen', abdomenMesh);

    // --- G. Arms & Hands (Left & Right) ---
    const armGeo = new THREE.CylinderGeometry(0.16, 0.14, 1.5, 16);
    const armMat = createGlassMaterial(BODY_REGIONS_CONFIG.arms.color, 0.55);

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.85, 0.85, 0);
    leftArm.rotation.z = 0.25;
    leftArm.userData = { regionId: 'arms' };
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat.clone());
    rightArm.position.set(0.85, 0.85, 0);
    rightArm.rotation.z = -0.25;
    rightArm.userData = { regionId: 'arms' };
    bodyGroup.add(rightArm);
    meshesMap.set('arms', leftArm);

    const handGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const handMat = createGlassMaterial(BODY_REGIONS_CONFIG.hands.color, 0.7);

    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(-1.08, -0.05, 0);
    leftHand.userData = { regionId: 'hands' };
    bodyGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, handMat.clone());
    rightHand.position.set(1.08, -0.05, 0);
    rightHand.userData = { regionId: 'hands' };
    bodyGroup.add(rightHand);
    meshesMap.set('hands', leftHand);

    // --- H. Legs (Left & Right) ---
    const legGeo = new THREE.CylinderGeometry(0.2, 0.16, 1.9, 18);
    const legMat = createGlassMaterial(BODY_REGIONS_CONFIG.legs.color, 0.55);

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.35, -1.35, 0);
    leftLeg.userData = { regionId: 'legs' };
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.35, -1.35, 0);
    rightLeg.userData = { regionId: 'legs' };
    bodyGroup.add(rightLeg);
    meshesMap.set('legs', leftLeg);

    // --- I. Holographic Wireframe Aura & Ground Pedestal ---
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.12, 32);
    const pedestalMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -2.4, 0);
    bodyGroup.add(pedestal);

    // Interactive Raycaster for mouse picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.regionId) {
          renderer.domElement.style.cursor = 'pointer';
          if (hoveredMeshRef.current !== hit) {
            hoveredMeshRef.current = hit;
          }
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        hoveredMeshRef.current = null;
      }
    };

    const handlePointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.regionId) {
          handleSelectRegion(hit.userData.regionId);
        }
      }
    };

    // User manual drag rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging) {
        handlePointerMove(e);
        return;
      }
      const deltaX = e.clientX - previousMousePosition.x;
      bodyGroup.rotation.y += deltaX * 0.012;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Soft auto-rotation unless being dragged
      if (isRotating && !isDragging) {
        bodyGroup.rotation.y = Math.sin(elapsed * 0.45) * 0.35;
      }

      // Gentle floating breathing animation
      bodyGroup.position.y = Math.sin(elapsed * 1.5) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [viewMode, isRotating, handleSelectRegion]);

  // Update 3D mesh highlight when selectedRegionId changes
  useEffect(() => {
    if (viewMode !== '3d' || !meshesMapRef.current) return;

    meshesMapRef.current.forEach((mesh, rId) => {
      if (mesh && mesh.material) {
        const isSelected = rId === selectedRegionId;
        mesh.material.emissiveIntensity = isSelected ? 0.75 : 0.18;
        mesh.scale.setScalar(isSelected ? 1.08 : 1.0);
      }
    });
  }, [selectedRegionId, viewMode]);

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden transition-all duration-300">
      {/* Liquid Glass Ambient Lighting Orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Interactive 3D Anatomical Symptom Visualizer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Human Body Allergy Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Select an anatomical region to explore localized allergy manifestations, assess clinical severity, and log symptoms directly to your permanent health journal.
          </p>
        </div>

        {/* View Controls & Mode Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 backdrop-blur">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3D Hologram
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === '2d'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2D Diagram
            </button>
          </div>

          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => setIsRotating((prev) => !prev)}
              title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
              className="p-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RotateCcw className={`w-4 h-4 ${isRotating ? 'animate-spin-slow' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 3D/2D Visualizer on Left + Interactive Symptom Panel on Right */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Visualizer Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center min-h-[460px] rounded-3xl bg-gradient-to-b from-slate-900/5 via-purple-50/20 to-cyan-50/20 border border-slate-200/60 p-4 relative overflow-hidden">
          {viewMode === '3d' ? (
            <>
              <div ref={mountRef} className="w-full h-[460px] cursor-grab active:cursor-grabbing flex items-center justify-center" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/60 pointer-events-none">
                <span>Drag to rotate • Click region to inspect</span>
                <span className="font-semibold text-purple-700 capitalize">{selectedRegion.name}</span>
              </div>
            </>
          ) : (
            /* 2D Interactive Anatomical Diagram Alternative */
            <div className="w-full flex flex-col items-center justify-center space-y-3 py-4">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Click a Body Region:
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {Object.values(BODY_REGIONS_CONFIG).map((region) => {
                  const isSelected = region.id === selectedRegionId;
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => handleSelectRegion(region.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                          : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <span>{region.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Symptom Details & Action Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
          {/* Active Region Header Card */}
          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Selected Anatomical Region
              </span>
              {selectedRegion.isHighRisk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Airway / High Clinical Attention
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{selectedRegion.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedRegion.description}</p>

            {/* Region quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {Object.values(BODY_REGIONS_CONFIG).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRegion(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    r.id === selectedRegionId
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {r.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Associated Symptoms Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Known Allergy Manifestations ({selectedRegion.symptoms.length}):</span>
              <span className="text-[11px] text-slate-500 font-normal">Select observed symptoms</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {selectedRegion.symptoms.map((symptom) => {
                const isChecked = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-purple-50/90 border-purple-400 text-purple-950 shadow-xs'
                        : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                        isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{symptom}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity & Onset Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 bg-white/90 text-slate-800 shadow-xs"
              >
                <option value="Mild">Mild (Localized, tolerable discomfort)</option>
                <option value="Moderate">Moderate (Systemic hives, persistent cramps)</option>
                <option value="Severe">Severe (Marked distress, spreading swelling)</option>
                <option value="Life-Threatening / Emergency">Life-Threatening (Breathing distress)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Onset After Eating</span>
              </label>
              <select
                value={onsetInterval}
                onChange={(e) => setOnsetInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 bg-white/90 text-slate-800 shadow-xs"
              >
                <option value="Immediate (< 15 mins)">Immediate (&lt; 15 mins)</option>
                <option value="Rapid (15 - 30 mins)">Rapid (15 - 30 mins)</option>
                <option value="Intermediate (30 - 60 mins)">Intermediate (30 - 60 mins)</option>
                <option value="1 - 2 hours">1 - 2 hours</option>
                <option value="Delayed (> 4 hours)">Delayed (&gt; 4 hours)</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            {onOpenSymptomModal && (
              <button
                type="button"
                onClick={() =>
                  onOpenSymptomModal({
                    symptomName: selectedSymptoms[0] || 'Itching',
                    symptomSeverity: selectedSeverity,
                    onsetInterval,
                  })
                }
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white/80 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs"
              >
                Open Full Symptom Entry Modal
              </button>
            )}

            <button
              type="button"
              onClick={handleQuickLog}
              disabled={isLogging || selectedSymptoms.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isLogging ? 'Logging to MongoDB Atlas...' : 'Quick Log Symptom'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-slate-500">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <span>
          <strong>Clinical Educational & Logging Tool:</strong> This 3D anatomical model visualizes organ-system allergy distribution. It is not an automated diagnostic engine. If you experience respiratory distress or swelling of the throat or tongue, seek emergency medical care (911 / 112) immediately.
        </span>
      </div>
    </div>
  );
}

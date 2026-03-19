import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, Sky } from '@react-three/drei';
import { ACESFilmicToneMapping, BackSide, CanvasTexture, PCFShadowMap, PCFSoftShadowMap, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';
import { useShallow } from 'zustand/react/shallow';
import { Bloom, EffectComposer, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import GeneratorModelSimple from './models/GeneratorModelSimple';
import OfficeBuildingModel from './models/OfficeBuildingModel';
import ConveyorModel from './models/ConveyorModel';
import ElectricalPanel from './models/ElectricalPanel';
import Lighting from './Lighting';
import useSimulationStore from '../store/simulationStore';

const ENABLE_DEBUG_MOVEMENT = process.env.REACT_APP_ENABLE_DEBUG_MOVEMENT === 'true';

const KEY_GROUPS = {
  moveLeft: ['ArrowLeft', 'a', 'A'],
  moveRight: ['ArrowRight', 'd', 'D'],
  moveForward: ['ArrowUp', 'w', 'W'],
  moveBackward: ['ArrowDown', 's', 'S'],
  moveUp: ['q', 'Q'],
  moveDown: ['e', 'E'],
  rotateLeft: ['r', 'R'],
  rotateRight: ['f', 'F'],
};

const isAnyPressed = (keys, group) => group.some((key) => keys[key]);

const getAdaptiveQuality = () => {
  if (typeof window === 'undefined') {
    return {
      isLowPower: false,
      dpr: [1, 1.5],
      envResolution: 256,
      contactShadowResolution: 512,
      contactShadowFrames: 12,
      postFxResolutionScale: 0.85,
      postFxMultisampling: 0,
      enableSSAO: true,
    };
  }

  const coarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
  const hasTouchPoints = (navigator.maxTouchPoints || 0) > 0;

  // Heuristics for lower-end desktops/laptops too (helps prevent "page unresponsive" on weak GPUs)
  const deviceMemory = Number(navigator.deviceMemory || 0);
  const hardwareConcurrency = Number(navigator.hardwareConcurrency || 0);
  const lowSpec = (deviceMemory && deviceMemory <= 4) || (hardwareConcurrency && hardwareConcurrency <= 4);

  const isLowPower = coarsePointer || hasTouchPoints || lowSpec;

  const canAffordSSAO = !isLowPower && (!deviceMemory || deviceMemory >= 8) && (!hardwareConcurrency || hardwareConcurrency >= 8);

  return {
    isLowPower,
    dpr: isLowPower ? [1, 1.2] : [1, 1.5],
    envResolution: isLowPower ? 256 : 512,
    contactShadowResolution: isLowPower ? 256 : 512,
    contactShadowFrames: isLowPower ? 1 : 12,
    postFxResolutionScale: isLowPower ? 0.65 : 0.85,
    postFxMultisampling: 0,
    enableSSAO: canAffordSSAO,
  };
};

const getScenarioGroundY = (scenarioId) => {
  switch (scenarioId) {
    case 'gen-diesel':
      // Model has internal group position y=0.3 and ground plane at y=-0.21
      return 0.09;
    case 'compressor':
      // OfficeBuilding floor at y=-0.05 with model scale 1.3 => -0.065
      return -0.065;
    case 'conveyor':
      // Conveyor model ground plane at y=-0.31
      return -0.31;
    default:
      return -0.1;
  }
};

const getScenarioContactShadowConfig = (scenarioId) => {
  switch (scenarioId) {
    case 'gen-diesel':
      return {
        scale: 18,
        far: 8,
        blur: 2.4,
        opacity: 0.3,
      };
    case 'compressor':
      return {
        scale: 22,
        far: 10,
        blur: 2.2,
        opacity: 0.28,
      };
    case 'conveyor':
      return {
        scale: 20,
        far: 10,
        blur: 2.3,
        opacity: 0.3,
      };
    default:
      return {
        scale: 20,
        far: 10,
        blur: 2.3,
        opacity: 0.28,
      };
  }
};

const GeneratorSkyDome = React.memo(function GeneratorSkyDome() {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new TextureLoader();

    // Public asset (optional). If not present, we simply keep the procedural sky.
    loader.load(
      '/sky/gen-diesel-sky.jpg',
      (loaded) => {
        if (cancelled) return;
        loaded.colorSpace = SRGBColorSpace;
        setTexture(loaded);
      },
      undefined,
      () => {
        if (cancelled) return;
        setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!texture) return null;

  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshBasicMaterial map={texture} side={BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
});

const createSkyGradientTexture = ({ size, topColor, midColor, horizonColor, bottomColor }) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Vertical gradient mapped onto equirect UVs (v=0.5 roughly aligns with horizon).
  const grad = ctx.createLinearGradient(0, size, 0, 0);

  // Bottom (down) – slightly darker than horizon.
  grad.addColorStop(0.0, bottomColor);
  grad.addColorStop(0.35, bottomColor);

  // Horizon band: very light sky-blue (avoid white/overexposed look).
  grad.addColorStop(0.48, horizonColor);
  grad.addColorStop(0.52, horizonColor);

  // Smooth transition up.
  grad.addColorStop(0.70, midColor);
  grad.addColorStop(1.0, topColor);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle extra haze line near horizon (still blue, not white).
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#d7f3ff';
  ctx.fillRect(0, Math.floor(size * 0.47), size, Math.ceil(size * 0.06));
  ctx.globalAlpha = 1;

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
};

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const hash2 = (x, y, seed) => {
  const s = Math.sin((x * 127.1 + y * 311.7 + seed * 74.7) * 0.01);
  const t = Math.sin((x * 269.5 + y * 183.3 + seed * 19.1) * 0.01);
  return (s + t) * 0.25 + 0.5;
};

const fbm2 = (x, y, seed) => {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i += 1) {
    value += amp * hash2(x * freq, y * freq, seed + i * 13);
    freq *= 2.02;
    amp *= 0.55;
  }
  return Math.min(1, Math.max(0, value));
};

const makeRng = (seed) => {
  let s = (seed >>> 0) || 1;
  return () => {
    // LCG
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const createCloudTexture = ({ size, seed }) => {
  // Stratocumulus-like clustered puffs: fewer speckles, larger connected shapes,
  // with clear blue gaps similar to the reference image.
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.clearRect(0, 0, size, size);

  // Large-scale clustering mask: decides where clouds exist.
  const maskSize = Math.max(96, Math.floor(size / 8));
  const mask = new Float32Array(maskSize * maskSize);
  for (let y = 0; y < maskSize; y += 1) {
    for (let x = 0; x < maskSize; x += 1) {
      const n = fbm2(x * 7.5, y * 7.5, seed + 9);
      // Higher threshold -> fewer patches (less "manchas").
      mask[y * maskSize + x] = smoothstep(0.62, 0.86, n);
    }
  }

  const rand = makeRng(seed ^ 0x9e3779b9);

  const drawPuff = (x, y, r, strength) => {
    const rot = (rand() - 0.5) * 0.9;
    const sx = 0.75 + rand() * 0.9;
    const sy = 0.75 + rand() * 0.9;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);

    const grad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    const core = 0.78 * strength;
    grad.addColorStop(0, `rgba(255,255,255,${core})`);
    grad.addColorStop(0.42, `rgba(255,255,255,${0.44 * strength})`);
    grad.addColorStop(0.78, `rgba(255,255,255,${0.18 * strength})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Build clusters (less "bolinhas" isoladas; mais massas orgânicas)
  const clusterCount = size >= 1024 ? 26 : 16;
  // Slightly smaller puffs/clusters (user request: reduce cloud size a bit)
  const baseRadius = size >= 1024 ? 36 : 25;
  const radiusJitter = size >= 1024 ? 28 : 18;
  const clusterRadius = size >= 1024 ? 112 : 80;

  ctx.globalCompositeOperation = 'source-over';

  let placed = 0;
  let attempts = 0;
  while (placed < clusterCount && attempts < clusterCount * 20) {
    attempts += 1;

    const cx = rand() * size;
    const cy = rand() * size;

    const mx = Math.min(maskSize - 1, Math.max(0, Math.floor((cx / size) * maskSize)));
    const my = Math.min(maskSize - 1, Math.max(0, Math.floor((cy / size) * maskSize)));
    const m = mask[my * maskSize + mx];
    if (m < 0.35) continue;

    const yNorm = cy / size;
    const horizonFade = smoothstep(0.10, 0.34, yNorm);
    if (rand() > horizonFade) continue;

    const strength = Math.min(1, 0.45 + 0.75 * m);
    const puffsInCluster = Math.floor((size >= 1024 ? 18 : 12) + rand() * (size >= 1024 ? 18 : 10));

    for (let j = 0; j < puffsInCluster; j += 1) {
      const a = rand() * Math.PI * 2;
      const d = (rand() ** 0.55) * clusterRadius;
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * (0.65 + 0.4 * rand());

      // keep within map
      if (px < -80 || px > size + 80 || py < -80 || py > size + 80) continue;

      const rr = (baseRadius + rand() * radiusJitter) * (0.65 + 0.65 * strength);
      drawPuff(px, py, rr, strength);

      // Add a couple of smaller edge puffs to break the perfect outline.
      if (rand() < 0.55) {
        const er = rr * (0.25 + 0.35 * rand());
        drawPuff(px + (rand() - 0.5) * rr * 0.7, py + (rand() - 0.5) * rr * 0.5, er, strength * 0.75);
      }
    }

    placed += 1;
  }

  // Add medium-scale structure + ragged edges (avoid "bolas" lisas).
  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const a0 = data[i + 3] / 255;
      if (a0 <= 0) continue;

      // Turbulence for edge erosion.
      const turb = fbm2(x * 2.2, y * 1.9, seed + 77);
      const erosion = (turb - 0.5) * 0.14;

      // Gentle breakup (no speckle) + contrast.
      const d = fbm2(x * 0.95, y * 0.95, seed + 101);
      const mod = 0.86 + 0.14 * smoothstep(0.30, 0.78, d);

      // Shift thresholds per-pixel to get more natural outlines.
      const a1 = smoothstep(0.18 + erosion, 0.93 + erosion, a0 * mod);
      data[i + 0] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.floor(a1 * 255);
    }
  }
  ctx.putImageData(img, 0, 0);

  // Soft blur pass to unify puffs (reduce blotchy artifacts)
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = size;
  blurCanvas.height = size;
  const bctx = blurCanvas.getContext('2d');
  bctx.filter = size >= 1024 ? 'blur(1.15px)' : 'blur(0.95px)';
  bctx.drawImage(canvas, 0, 0);
  bctx.filter = 'none';

  const tex = new CanvasTexture(blurCanvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  // Bigger features, fewer repeats = less "manchado".
  // Slightly higher repeat = smaller apparent clouds
  tex.repeat.set(1.85, 1.15);
  tex.needsUpdate = true;
  return tex;
};

const ProjectSkyGradientDome = React.memo(function ProjectSkyGradientDome({ quality }) {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = quality?.isLowPower ? 512 : 1024;
    return createSkyGradientTexture({
      size,
      // Reference-like azure
      topColor: '#0a2f63',
      midColor: '#1e63b2',
      horizonColor: '#8bd0f2',
      bottomColor: '#3c8bc9',
    });
  }, [quality?.isLowPower]);

  if (!texture) return null;

  return (
    <mesh scale={[600, 600, 600]} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
        dithering
      />
    </mesh>
  );
});

const ProjectCloudDome = React.memo(function ProjectCloudDome({ quality }) {
  const cloudTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = quality?.isLowPower ? 512 : 1024;
    return createCloudTexture({ size, seed: 33 });
  }, [quality?.isLowPower]);

  const texRef = useRef(null);
  useEffect(() => {
    texRef.current = cloudTex;
  }, [cloudTex]);

  useFrame((state, delta) => {
    const tex = texRef.current;
    if (!tex) return;
    // Gentle drift to feel alive.
    tex.offset.x = (tex.offset.x + delta * 0.0022) % 1;
    tex.offset.y = (tex.offset.y + delta * 0.0011) % 1;
  });

  if (!cloudTex) return null;

  return (
    <mesh scale={[590, 590, 590]} renderOrder={-9} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshBasicMaterial
        map={cloudTex}
        transparent
        opacity={quality?.isLowPower ? 0.64 : 0.74}
        alphaTest={0.12}
        color={'#ffffff'}
        side={BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
        dithering
      />
    </mesh>
  );
});

const SceneLook = React.memo(function SceneLook({ scenarioId, quality }) {
  const groundY = getScenarioGroundY(scenarioId);
  const shadowCfg = getScenarioContactShadowConfig(scenarioId);
  const isGenerator = scenarioId === 'gen-diesel';
  const iblIntensity = isGenerator ? 0.7 : 1.0;

  return (
    <>
      {/* Sky (project-wide): light sky-blue horizon + smooth blue gradient + fluffy clouds */}
      <ProjectSkyGradientDome quality={quality} />
      <ProjectCloudDome quality={quality} />

      {/* Procedural IBL for more realistic reflections/material response (no external HDR download) */}
      <Environment resolution={quality.envResolution} background={false}>
        {isGenerator && (
          <Lightformer
            form="rect"
            intensity={1.6 * iblIntensity}
            position={[0, 10, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[20, 20, 1]}
            color="#cfe6ff"
          />
        )}
        <Lightformer
          form="rect"
          intensity={2.5 * iblIntensity}
          position={[0, 6, -6]}
          rotation={[0, 0, 0]}
          scale={[12, 6, 1]}
          color={isGenerator ? '#eef6ff' : '#ffffff'}
        />
        <Lightformer
          form="ring"
          intensity={1.2 * iblIntensity}
          position={[-6, 3, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 6, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="circle"
          intensity={0.8 * iblIntensity}
          position={[6, 2, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[4, 4, 1]}
          color="#ffffff"
        />
      </Environment>

      {/* Contact shadow to anchor objects to the ground visually; raycast disabled to avoid interfering with clicks */}
      <ContactShadows
        position={[0, groundY + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={shadowCfg.scale}
        opacity={quality.isLowPower ? Math.min(0.22, shadowCfg.opacity) : shadowCfg.opacity}
        blur={quality.isLowPower ? Math.max(2.8, shadowCfg.blur) : shadowCfg.blur}
        far={shadowCfg.far}
        resolution={quality.contactShadowResolution}
        frames={quality.contactShadowFrames}
        raycast={() => null}
      />
    </>
  );
});

const ScenePostFX = React.memo(function ScenePostFX({ quality, scenarioId }) {
  const isGenerator = scenarioId === 'gen-diesel';
  const bloomIntensity = isGenerator
    ? (quality.isLowPower ? 0.12 : 0.18)
    : (quality.isLowPower ? 0.18 : 0.25);

  const bloomThreshold = isGenerator ? 0.94 : 0.92;
  const bloomSmoothing = isGenerator ? 0.2 : 0.15;

  const ssaoIntensity = isGenerator ? 6 : 7;
  const ssaoRadius = isGenerator ? 0.055 : 0.06;

  return (
    <EffectComposer
      multisampling={quality.postFxMultisampling}
      resolutionScale={quality.postFxResolutionScale}
    >
      {/* Subtle bloom for emissive/bright areas; intentionally restrained */}
      <Bloom
        blendFunction={BlendFunction.SCREEN}
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
      />

      {/* SSAO adds depth/contact in corners; disabled on touch/low-power for responsiveness */}
      {quality.enableSSAO && (
        <SSAO
          samples={6}
          radius={ssaoRadius}
          intensity={ssaoIntensity}
          luminanceInfluence={0.6}
          worldDistanceThreshold={10}
          worldDistanceFalloff={2}
          worldProximityThreshold={0.5}
          worldProximityFalloff={0.25}
        />
      )}
    </EffectComposer>
  );
});

const ScenarioCameraRig = React.memo(function ScenarioCameraRig({ config, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (config?.cameraFov) {
      camera.fov = config.cameraFov;
      camera.updateProjectionMatrix();
    }

    if (Array.isArray(config?.cameraPosition)) {
      camera.position.set(...config.cameraPosition);
    }

    if (controlsRef?.current && Array.isArray(config?.cameraTarget)) {
      controlsRef.current.target.set(...config.cameraTarget);
      controlsRef.current.update();
    } else if (Array.isArray(config?.cameraTarget)) {
      camera.lookAt(...config.cameraTarget);
    }
  }, [camera, config, controlsRef]);

  return null;
});

const ScenarioRendererTuning = React.memo(function ScenarioRendererTuning({ scenarioId }) {
  const { gl } = useThree();

  useEffect(() => {
    // Slight exposure tuning per scenario to keep readability.
    // Generator uses a solid background and physically-correct lights; keep it slightly underexposed
    // (more contrast, less “washed out”) while preserving panel readability.
    gl.toneMappingExposure = scenarioId === 'gen-diesel' ? 0.7 : 1.0;
  }, [gl, scenarioId]);

  return null;
});

// Configurações específicas para cada cenário
const SCENARIO_CONFIG = {
  // Cenário 1: Gerador Diesel - POSIÇÃO FIXA
  'gen-diesel': {
    model: GeneratorModelSimple,
    modelPosition: [0, 0, 0],
    panelPosition: [-1.35, 0.60, 1.25],
    panelRotation: [0, 3 * Math.PI / 180, 0], // 3 degrees
    showPanel: true,
    showLightingLabels: true,
    cameraTarget: [0, 1, 0],
    cameraPosition: [2.6, 2.1, 5.6],
    cameraFov: 45,
    background: '#0f3a5f',
    controls: {
      minDistance: 3.2,
      maxDistance: 14,
      minPolarAngle: 0.35,
      maxPolarAngle: 1.35,
    },
    isPanelDraggable: false,
    scenarioName: 'Gerador Diesel'
  },
  
  // Cenário 2: Compressor de Ar (Escritório/Prédio)
  'compressor': {
    model: OfficeBuildingModel,
    modelPosition: [0, 0, 0],
    panelPosition: [0.55, 2.70, 8.20],
    panelRotation: [0, -20 * Math.PI / 180, 0],
    showPanel: true,
    showLightingLabels: true,
    cameraTarget: [0, 1, 0],
    background: '#71717a',
    isPanelDraggable: false,
    scenarioName: 'Compressor de Ar'
  },
  
  // Cenário 3: Esteira Transportadora
  'conveyor': {
    model: ConveyorModel,
    modelPosition: [0, 0, 0],
    panelPosition: [2, 0, 0],
    panelRotation: [0, -0.5, 0],
    showPanel: true,
    showLightingLabels: false,
    cameraTarget: [0, 0.5, 0],
    background: '#71717a',
    isPanelDraggable: false,
    scenarioName: 'Esteira Transportadora'
  }
};

const SceneManager = () => {
  const { scenarioId, isPowerOff } = useSimulationStore(
    useShallow((state) => ({
      scenarioId: state.currentScenario?.id || 'gen-diesel',
      isPowerOff: state.isPowerOff,
    }))
  );
  
  // Estado para UI de posição
  const [panelPos, setPanelPos] = useState([-1.2, 0, 2]);
  const [panelRot, setPanelRot] = useState([0, 0.4, 0]);
  const keysRef = useRef({});
  const positionRef = useRef([-1.2, 0, 2]);
  const rotationRef = useRef([0, 0.4, 0]);
  const panelGroupRef = useRef(null);
  const uiUpdateAccumulatorRef = useRef(0);
  
  const moveSpeed = 0.15;
  const rotateSpeed = 0.05;

  const qualityRef = useRef(null);
  if (!qualityRef.current) qualityRef.current = getAdaptiveQuality();
  const quality = qualityRef.current;

  const controlsRef = useRef(null);

  // Obter configuração do cenário atual
  const config = SCENARIO_CONFIG[scenarioId] || SCENARIO_CONFIG['gen-diesel'];
  
  const ModelComponent = config.model;

  // Handlers de teclado
  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.key] = false;
  }, []);

  useEffect(() => {
    // Reset position when scenario changes
    const newConfig = SCENARIO_CONFIG[scenarioId] || SCENARIO_CONFIG['gen-diesel'];
    positionRef.current = [...newConfig.panelPosition];
    rotationRef.current = [...newConfig.panelRotation];
    setPanelPos(newConfig.panelPosition);
    setPanelRot(newConfig.panelRotation);
    keysRef.current = {};
    uiUpdateAccumulatorRef.current = 0;

    if (panelGroupRef.current) {
      panelGroupRef.current.position.set(...newConfig.panelPosition);
      panelGroupRef.current.rotation.set(...newConfig.panelRotation);
    }
  }, [scenarioId]);

  useEffect(() => {
    if (!config.isPanelDraggable || !ENABLE_DEBUG_MOVEMENT) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, config.isPanelDraggable]);

  const PanelDragController = () => {
    useFrame((_, delta) => {
      if (!config.isPanelDraggable || !ENABLE_DEBUG_MOVEMENT) return;

      const pressedKeys = keysRef.current;
      const inputActive = Object.values(pressedKeys).some(Boolean);
      if (!inputActive) return;

      const frameScale = delta * 60;
      let newPos = [...positionRef.current];
      let newRot = [...rotationRef.current];
      let changed = false;

      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveLeft)) {
        newPos[0] -= moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveRight)) {
        newPos[0] += moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveForward)) {
        newPos[2] -= moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveBackward)) {
        newPos[2] += moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveUp)) {
        newPos[1] += moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.moveDown)) {
        newPos[1] -= moveSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.rotateLeft)) {
        newRot[1] += rotateSpeed * frameScale;
        changed = true;
      }
      if (isAnyPressed(pressedKeys, KEY_GROUPS.rotateRight)) {
        newRot[1] -= rotateSpeed * frameScale;
        changed = true;
      }

      if (!changed) return;

      positionRef.current = newPos;
      rotationRef.current = newRot;

      if (panelGroupRef.current) {
        panelGroupRef.current.position.set(...newPos);
        panelGroupRef.current.rotation.set(...newRot);
      }

      uiUpdateAccumulatorRef.current += delta;
      if (uiUpdateAccumulatorRef.current >= 0.1) {
        uiUpdateAccumulatorRef.current = 0;
        setPanelPos(newPos);
        setPanelRot(newRot);
      }
    });

    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 4, 8], fov: 50 }}
        dpr={quality.dpr}
        shadows
        gl={{ antialias: !quality.isLowPower, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;

          // More realistic light falloff + softer, less jaggy shadows.
          gl.physicallyCorrectLights = true;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = quality.isLowPower ? PCFShadowMap : PCFSoftShadowMap;
        }}
        style={{ background: '#71717a', width: '100%', height: '100%' }}
      >
        <color attach="background" args={[config.background || '#71717a']} />

        {/* Lights (centralized for consistency across scenarios) */}
        <Lighting scenarioId={scenarioId} isPowerOff={isPowerOff} isLowPower={quality.isLowPower} />

        <ScenarioRendererTuning scenarioId={scenarioId} />

        <ScenarioCameraRig config={config} controlsRef={controlsRef} />

        {/* Look/realism helpers (environment + contact shadow) */}
        <SceneLook scenarioId={scenarioId} quality={quality} />

        {/* Post-processing (kept subtle; adaptive for touch devices) */}
        <ScenePostFX quality={quality} scenarioId={scenarioId} />
        
        {/* Controls */}
        <OrbitControls 
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.08}
          target={config.cameraTarget}
          minDistance={config.controls?.minDistance}
          maxDistance={config.controls?.maxDistance}
          minPolarAngle={config.controls?.minPolarAngle}
          maxPolarAngle={config.controls?.maxPolarAngle}
        />
        
        {/* Modelo 3D */}
        <group position={config.modelPosition}>
          <ModelComponent />
        </group>

        {/* Panel drag controller (only active for draggable scenarios) */}
        <PanelDragController />
        
        {/* Painel de energia */}
        {config.showPanel && (
          <group
            ref={panelGroupRef}
            position={config.isPanelDraggable ? panelPos : config.panelPosition}
            rotation={config.isPanelDraggable ? panelRot : config.panelRotation}
          >
            <ElectricalPanel showLightingLabels={config.showLightingLabels} />
          </group>
        )}
      </Canvas>
      
      {/* UI Overlay - sempre visível para cenários arrastáveis */}
      {config.isPanelDraggable && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#22C55E',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          border: '2px solid #22C55E',
          minWidth: '200px'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#fff' }}>
            {config.scenarioName} - Painel
          </div>
          <div>X: {panelPos[0].toFixed(2)}</div>
          <div>Y: {panelPos[1].toFixed(2)}</div>
          <div>Z: {panelPos[2].toFixed(2)}</div>
          <div style={{ marginTop: '10px', color: '#fbbf24' }}>
            RotY: {(panelRot[1] * 180 / Math.PI).toFixed(0)}°
          </div>
          <div style={{ marginTop: '15px', fontSize: '11px', color: '#9ca3af' }}>
            <div>WASD/Setas = Mover</div>
            <div>Q/E = Cima/Baixo</div>
            <div>R/F = Girar</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SceneManager);

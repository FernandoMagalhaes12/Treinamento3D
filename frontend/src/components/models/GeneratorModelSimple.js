import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
} from 'three';
import useSimulationStore from '../../store/simulationStore';

const GRILLE_SLATS = 11;
const RADIATOR_FINS = 26;
const RADIATOR_FASTENERS = 8;
const GRASS_TUFTS_HIGH = 260;
const GRASS_TUFTS_LOW = 120;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const makeFractalNoise = (x, y, size, seed) => {
  // Fast deterministic value-noise-ish function (good enough for grass breakup)
  const s = Math.sin((x * 127.1 + y * 311.7 + seed * 74.7) * 0.01);
  const t = Math.sin((x * 269.5 + y * 183.3 + seed * 19.1) * 0.01);
  const base = (s + t) * 0.25 + 0.5;

  // Add a little higher-frequency detail
  const hf = Math.sin((x * 911.3 + y * 421.9 + seed * 3.7) * 0.02) * 0.15 + 0.5;
  return clamp01(base * 0.75 + hf * 0.25);
};

const createGrassTuftTexture = (size = 128) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw multiple blades with alpha gradient
  const bladeCount = 28;
  for (let i = 0; i < bladeCount; i += 1) {
    const x = (size * 0.2) + (size * 0.6) * (i / (bladeCount - 1));
    const h = size * (0.55 + 0.35 * Math.abs(Math.sin(i * 1.7)));
    const y0 = size * 0.92;
    const y1 = y0 - h;

    const w = 1.2 + 1.6 * Math.abs(Math.sin(i * 2.13));
    const lean = (Math.sin(i * 3.1) * 0.08) * size;

    const grad = ctx.createLinearGradient(x, y0, x + lean, y1);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + lean * 0.6, (y0 + y1) * 0.55, x + lean, y1);
    ctx.stroke();
  }

  // Soft base cluster
  const baseGrad = ctx.createRadialGradient(size * 0.5, size * 0.9, 0, size * 0.5, size * 0.9, size * 0.35);
  baseGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
  baseGrad.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.9, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const createChainLinkTexture = (size = 256) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  // Diamond chain-link pattern (white lines on transparent background)
  // Larger step => bigger holes (less "fine" looking screen)
  const step = Math.max(14, Math.floor(size / 12));
  ctx.lineWidth = Math.max(1.7, size / 165);
  ctx.strokeStyle = 'rgba(255,255,255,1.0)';
  ctx.globalCompositeOperation = 'source-over';

  for (let y = -size; y <= size * 2; y += step) {
    for (let x = -size; x <= size * 2; x += step) {
      const cx = x + step * 0.5;
      const cy = y + step * 0.5;
      const w = step * 0.55;
      const h = step * 0.35;

      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Keep background fully transparent (alphaMap will define the cutout)

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const generateGrassTextures = ({ size, seed, repeat }) => {
  // Produces 4 textures: albedo (sRGB), normal (linear), roughness (linear), height (linear)
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const heightCtx = heightCanvas.getContext('2d', { willReadFrequently: true });

  const heightImg = heightCtx.createImageData(size, size);
  const heightData = heightImg.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = makeFractalNoise(x, y, size, seed);
      // Slight directional streaking to mimic blades
      const streak = clamp01(0.6 + 0.4 * Math.sin((x * 0.6 + y * 0.15 + seed) * 0.35));
      const h = clamp01(n * 0.75 + streak * 0.25);
      const v = Math.floor(h * 255);
      const i = (y * size + x) * 4;
      heightData[i + 0] = v;
      heightData[i + 1] = v;
      heightData[i + 2] = v;
      heightData[i + 3] = 255;
    }
  }

  heightCtx.putImageData(heightImg, 0, 0);

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d', { willReadFrequently: true });
  const albedoImg = albedoCtx.createImageData(size, size);
  const albedoData = albedoImg.data;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d', { willReadFrequently: true });
  const roughImg = roughCtx.createImageData(size, size);
  const roughData = roughImg.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const h = heightData[i] / 255;

      // Mix a few grassy tones + dry patches
      const wet = clamp01(0.15 + h * 0.85);
      const dry = clamp01(1 - wet);

      const r = clamp01(0.10 + wet * 0.10 + dry * 0.18);
      const g = clamp01(0.22 + wet * 0.55 + dry * 0.30);
      const b = clamp01(0.08 + wet * 0.10 + dry * 0.06);

      albedoData[i + 0] = Math.floor(r * 255);
      albedoData[i + 1] = Math.floor(g * 255);
      albedoData[i + 2] = Math.floor(b * 255);
      albedoData[i + 3] = 255;

      // Roughness: grass is generally very rough; add subtle variation
      const rough = clamp01(0.78 + 0.18 * (1 - h));
      const rv = Math.floor(rough * 255);
      roughData[i + 0] = rv;
      roughData[i + 1] = rv;
      roughData[i + 2] = rv;
      roughData[i + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  // Normal map from height
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d', { willReadFrequently: true });
  const normalImg = normalCtx.createImageData(size, size);
  const normalData = normalImg.data;

  const getH = (xx, yy) => {
    const x = (xx + size) % size;
    const y = (yy + size) % size;
    return heightData[(y * size + x) * 4] / 255;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const hl = getH(x - 1, y);
      const hr = getH(x + 1, y);
      const hd = getH(x, y - 1);
      const hu = getH(x, y + 1);

      // Sobel-ish gradient
      const dx = (hr - hl);
      const dy = (hu - hd);
      const strength = 2.2;

      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

      const r = Math.floor((nx * invLen * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * invLen * 0.5 + 0.5) * 255);
      const b = Math.floor((nz * invLen * 0.5 + 0.5) * 255);

      const i = (y * size + x) * 4;
      normalData[i + 0] = r;
      normalData[i + 1] = g;
      normalData[i + 2] = b;
      normalData[i + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImg, 0, 0);

  const makeTexture = (canvas, isColor) => {
    const tex = new CanvasTexture(canvas);
    if (isColor) tex.colorSpace = SRGBColorSpace;
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.needsUpdate = true;
    return tex;
  };

  return {
    map: makeTexture(albedoCanvas, true),
    normalMap: makeTexture(normalCanvas, false),
    roughnessMap: makeTexture(roughCanvas, false),
    displacementMap: makeTexture(heightCanvas, false),
  };
};

const generateMicroSurfaceTextures = ({ size, seed }) => {
  // Small, reusable roughness + normal breakup to avoid the “flat plastic” look.
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const heightCtx = heightCanvas.getContext('2d', { willReadFrequently: true });
  const heightImg = heightCtx.createImageData(size, size);
  const heightData = heightImg.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n1 = makeFractalNoise(x * 2.6, y * 2.6, size, seed);
      const n2 = makeFractalNoise(x * 7.2, y * 7.2, size, seed + 17);
      const h = clamp01((n1 * 0.72 + n2 * 0.28 - 0.5) * 0.7 + 0.5);
      const v = Math.floor(h * 255);
      const i = (y * size + x) * 4;
      heightData[i + 0] = v;
      heightData[i + 1] = v;
      heightData[i + 2] = v;
      heightData[i + 3] = 255;
    }
  }

  heightCtx.putImageData(heightImg, 0, 0);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d', { willReadFrequently: true });
  const roughImg = roughCtx.createImageData(size, size);
  const roughData = roughImg.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const h = heightData[i] / 255;
      const r = clamp01(0.55 + (h - 0.5) * 0.25);
      const v = Math.floor(r * 255);
      roughData[i + 0] = v;
      roughData[i + 1] = v;
      roughData[i + 2] = v;
      roughData[i + 3] = 255;
    }
  }
  roughCtx.putImageData(roughImg, 0, 0);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d', { willReadFrequently: true });
  const normalImg = normalCtx.createImageData(size, size);
  const normalData = normalImg.data;

  const getH = (xx, yy) => {
    const x = (xx + size) % size;
    const y = (yy + size) % size;
    return heightData[(y * size + x) * 4] / 255;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const hl = getH(x - 1, y);
      const hr = getH(x + 1, y);
      const hd = getH(x, y - 1);
      const hu = getH(x, y + 1);

      const dx = (hr - hl);
      const dy = (hu - hd);
      const strength = 1.15;

      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);

      const r = Math.floor((nx * invLen * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * invLen * 0.5 + 0.5) * 255);
      const b = Math.floor((nz * invLen * 0.5 + 0.5) * 255);

      const i = (y * size + x) * 4;
      normalData[i + 0] = r;
      normalData[i + 1] = g;
      normalData[i + 2] = b;
      normalData[i + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImg, 0, 0);

  const makeTexture = (canvas) => {
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(1, 1);
    tex.needsUpdate = true;
    return tex;
  };

  return {
    normalMap: makeTexture(normalCanvas),
    roughnessMap: makeTexture(roughCanvas),
  };
};

const GeneratorModelSimple = () => {
  const fanRef = useRef();
  const ventRef1 = useRef();
  const ventRef2 = useRef();
  const beltRef = useRef();
  const gateHingeRef = useRef();
  const grilleRef = useRef();
  const radiatorFinsRef = useRef();
  const fastenersRef = useRef();
  const grassTuftsRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const [gateOpen, setGateOpen] = useState(false);
  const isPowerOff = useSimulationStore(state => state.isPowerOff);
  const residualEnergyEliminated = useSimulationStore(state => state.residualEnergyEliminated);
  const generatorGateLocked = useSimulationStore(state => state.generatorGateLocked);
  const generatorGateUnlockedWhilePowerOn = useSimulationStore(state => state.generatorGateUnlockedWhilePowerOn);
  const openGateUnlockDialog = useSimulationStore(state => state.openGateUnlockDialog);
  const triggerGameOver = useSimulationStore(state => state.triggerGameOver);

  const groundQuality = useMemo(() => {
    if (typeof window === 'undefined') return { segments: 64, displacement: 0.0, repeat: 7 };

    const deviceMemory = Number(navigator.deviceMemory || 0);
    const hardwareConcurrency = Number(navigator.hardwareConcurrency || 0);
    const coarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
    const lowSpec = coarsePointer || (deviceMemory && deviceMemory <= 4) || (hardwareConcurrency && hardwareConcurrency <= 4);

    return lowSpec
      ? { segments: 64, displacement: 0.0, repeat: 7 }
      : { segments: 120, displacement: 0.045, repeat: 9 };
  }, []);

  const grassTextures = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return generateGrassTextures({ size: 384, seed: 13, repeat: groundQuality.repeat });
  }, [groundQuality.repeat]);

  const grassTuftTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createGrassTuftTexture(128);
  }, []);

  const chainLinkTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const tex = createChainLinkTexture(256);
    // Lower repeat => larger diamonds in world space
    tex.repeat.set(7, 4);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const microSurfaceBase = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return generateMicroSurfaceTextures({ size: 256, seed: 29 });
  }, []);

  const paintMicroSurface = useMemo(() => {
    if (!microSurfaceBase) return null;
    const normalMap = microSurfaceBase.normalMap.clone();
    normalMap.repeat.set(7, 7);
    normalMap.needsUpdate = true;

    const roughnessMap = microSurfaceBase.roughnessMap.clone();
    roughnessMap.repeat.set(7, 7);
    roughnessMap.needsUpdate = true;

    return { normalMap, roughnessMap };
  }, [microSurfaceBase]);

  const metalMicroSurface = useMemo(() => {
    if (!microSurfaceBase) return null;
    const normalMap = microSurfaceBase.normalMap.clone();
    normalMap.repeat.set(10, 10);
    normalMap.needsUpdate = true;

    const roughnessMap = microSurfaceBase.roughnessMap.clone();
    roughnessMap.repeat.set(10, 10);
    roughnessMap.needsUpdate = true;

    return { normalMap, roughnessMap };
  }, [microSurfaceBase]);

  useLayoutEffect(() => {
    if (!grilleRef.current || !radiatorFinsRef.current || !fastenersRef.current) return;

    const base = new Color('#334155');

    // Front grille slats (instanced for low draw calls)
    for (let i = 0; i < GRILLE_SLATS; i += 1) {
      const t = i / (GRILLE_SLATS - 1);
      const y = 0.36 + t * 0.78; // covers the front body height region
      // Slight louver tilt helps catch highlights and avoids a flat black read.
      const tilt = -0.22 + 0.03 * Math.sin(i * 1.7);
      dummy.position.set(0.55, y, 0.842);
      dummy.rotation.set(tilt, 0, 0);
      dummy.updateMatrix();
      grilleRef.current.setMatrixAt(i, dummy.matrix);

      // Subtle per-slat color variation so it doesn't read as a flat black card.
      // Slightly darker at the bottom to mimic natural dirt/occlusion.
      const verticalShade = 0.9 + 0.12 * (1 - t);
      const microVariation = 0.92 + 0.06 * Math.abs(Math.sin(i * 12.9898));
      const variation = verticalShade * microVariation;
      grilleRef.current.setColorAt(
        i,
        new Color(
          Math.min(1, base.r * variation),
          Math.min(1, base.g * variation),
          Math.min(1, base.b * variation)
        )
      );
    }
    grilleRef.current.instanceMatrix.needsUpdate = true;
    if (grilleRef.current.instanceColor) grilleRef.current.instanceColor.needsUpdate = true;

    // Radiator fins behind the grille (adds depth/realism without heavy geometry)
    const finsBase = new Color('#111827');
    for (let i = 0; i < RADIATOR_FINS; i += 1) {
      const t = i / (RADIATOR_FINS - 1);
      const x = 0.55 + (t - 0.5) * 1.1; // span inside the radiator opening
      dummy.position.set(x, 0.75, 0.79);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      radiatorFinsRef.current.setMatrixAt(i, dummy.matrix);

      const variation = 0.92 + 0.06 * Math.abs(Math.sin(i * 9.173));
      radiatorFinsRef.current.setColorAt(
        i,
        new Color(
          Math.min(1, finsBase.r * variation),
          Math.min(1, finsBase.g * variation),
          Math.min(1, finsBase.b * variation)
        )
      );
    }
    radiatorFinsRef.current.instanceMatrix.needsUpdate = true;
    if (radiatorFinsRef.current.instanceColor) radiatorFinsRef.current.instanceColor.needsUpdate = true;

    // Fasteners on the radiator frame (small, subtle details)
    const fastenerColor = new Color('#111827');
    const z = 0.852;
    const points = [
      [0.55 - 0.62, 0.75 + 0.53, z],
      [0.55, 0.75 + 0.53, z],
      [0.55 + 0.62, 0.75 + 0.53, z],
      [0.55 - 0.62, 0.75, z],
      [0.55 + 0.62, 0.75, z],
      [0.55 - 0.62, 0.75 - 0.53, z],
      [0.55, 0.75 - 0.53, z],
      [0.55 + 0.62, 0.75 - 0.53, z],
    ];

    for (let i = 0; i < RADIATOR_FASTENERS; i += 1) {
      const [x, y, zPos] = points[i];
      dummy.position.set(x, y, zPos);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      fastenersRef.current.setMatrixAt(i, dummy.matrix);

      const variation = 0.92 + 0.06 * Math.abs(Math.sin(i * 7.13));
      fastenersRef.current.setColorAt(
        i,
        new Color(
          Math.min(1, fastenerColor.r * variation),
          Math.min(1, fastenerColor.g * variation),
          Math.min(1, fastenerColor.b * variation)
        )
      );
    }
    fastenersRef.current.instanceMatrix.needsUpdate = true;
    if (fastenersRef.current.instanceColor) fastenersRef.current.instanceColor.needsUpdate = true;
  }, [dummy]);

  useLayoutEffect(() => {
    if (!grassTuftsRef.current) return;

    const count = groundQuality.displacement > 0 ? GRASS_TUFTS_HIGH : GRASS_TUFTS_LOW;
    const rand = mulberry32(1337);
    const base = new Color('#166534');
    const dry = new Color('#3f6212');

    for (let i = 0; i < count; i += 1) {
      // Place tufts in an annulus around the generator to avoid intersections
      const angle = rand() * Math.PI * 2;
      const radius = 1.8 + Math.pow(rand(), 0.55) * 7.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Keep clear around the panel/front area a bit
      if (x > 1.1 && z > -1.2 && z < 1.2) continue;

      const y = -0.209 + (rand() - 0.5) * 0.004;
      dummy.position.set(x, y, z);
      dummy.rotation.set((rand() - 0.5) * 0.18, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
      const s = 0.55 + rand() * 0.9;
      dummy.scale.set(0.28 * s, 0.55 * s, 0.28 * s);
      dummy.updateMatrix();
      grassTuftsRef.current.setMatrixAt(i, dummy.matrix);

      const mix = rand();
      const tint = base.clone().lerp(dry, mix * 0.55);
      tint.multiplyScalar(0.85 + rand() * 0.25);
      grassTuftsRef.current.setColorAt(i, tint);
    }

    grassTuftsRef.current.instanceMatrix.needsUpdate = true;
    if (grassTuftsRef.current.instanceColor) grassTuftsRef.current.instanceColor.needsUpdate = true;
  }, [dummy, groundQuality.displacement]);

  useFrame((state, delta) => {
    const speed = delta * 2;
    if (fanRef.current && !isPowerOff) {
      fanRef.current.rotation.y += speed;
    }
    if (ventRef1.current && !isPowerOff) {
      ventRef1.current.rotation.y += speed;
    }
    if (ventRef2.current && !isPowerOff) {
      ventRef2.current.rotation.y += speed;
    }
    if (beltRef.current && !isPowerOff) {
      beltRef.current.rotation.y += speed;
    }

    if (gateHingeRef.current) {
      const target = gateOpen ? -1.15 : 0; // ~66 degrees outward
      const t = 1 - Math.pow(0.001, Math.min(1, delta * 6.5));
      gateHingeRef.current.rotation.y += (target - gateHingeRef.current.rotation.y) * t;
    }
  });

  return (
    <group position={[0, 0.3, 0]} scale={[1.3, 1.3, 1.3]}>
      {/* Perimeter zinc-mesh fence + roof cover (raycast disabled so hotspots remain clickable) */}
      <group>
        {(() => {
          const baseWidth = 3.5;
          const baseDepth = 2.0;
          const margin = 0.75;
          const fenceW = baseWidth + margin * 2;
          const fenceD = baseDepth + margin * 2;
          const y0 = -0.2; // base bottom is ~-0.2
          const fenceH = 3.15; // taller than generator
          const topY = y0 + fenceH;

          const postR = 0.04;
          const railR = 0.03;

          const gateW = 1.05;
          const gateH = fenceH - 0.25;
          const gateX = 0.85; // slightly to the right for readability
          const frontZ = fenceD * 0.5;

          const openingPadding = 0.14;
          const openingW = gateW + openingPadding;
          // Mesh panels: slightly larger to avoid visible corner gaps.
          // Keep a tiny inset to reduce z-fighting with rails/posts.
          const meshInset = 0.02;
          const meshW = fenceW - meshInset;
          const meshD = fenceD - meshInset;

          const zincMatProps = {
            color: '#bfc7ce',
            metalness: 0.75,
            roughness: 0.55,
            clearcoat: 0.08,
            clearcoatRoughness: 0.8,
            envMapIntensity: 0.8,
            dithering: true,
          };

          const screenMatProps = {
            // Darker screen so the mesh is readable from a distance.
            color: '#4b5563',
            metalness: 0.35,
            roughness: 0.78,
            clearcoat: 0.06,
            clearcoatRoughness: 0.85,
            envMapIntensity: 0.65,
            dithering: true,
          };

          return (
            <>
              {/* Corner posts */}
              {[
                [-fenceW * 0.5, y0 + fenceH * 0.5, -fenceD * 0.5],
                [fenceW * 0.5, y0 + fenceH * 0.5, -fenceD * 0.5],
                [-fenceW * 0.5, y0 + fenceH * 0.5, fenceD * 0.5],
                [fenceW * 0.5, y0 + fenceH * 0.5, fenceD * 0.5],
              ].map((pos, idx) => (
                <mesh key={`post-${idx}`} position={pos} castShadow receiveShadow raycast={() => null}>
                  <cylinderGeometry args={[postR, postR, fenceH, 10]} />
                  <meshStandardMaterial {...zincMatProps} />
                </mesh>
              ))}

              {/* Rails (top + mid) */}
              {[topY - 0.05, y0 + fenceH * 0.55].map((y, idx) => (
                <group key={`rails-${idx}`}>
                  <mesh position={[0, y, -fenceD * 0.5]} castShadow receiveShadow raycast={() => null}>
                    <boxGeometry args={[fenceW, railR * 2, railR * 2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                  {/* Front (+Z) rail split around gate opening (real cutout) */}
                  {(() => {
                    const leftStart = -fenceW * 0.5;
                    const leftEnd = gateX - openingW * 0.5;
                    const rightStart = gateX + openingW * 0.5;
                    const rightEnd = fenceW * 0.5;

                    const leftW = Math.max(0.01, leftEnd - leftStart);
                    const rightW = Math.max(0.01, rightEnd - rightStart);

                    const leftX = (leftStart + leftEnd) * 0.5;
                    const rightX = (rightStart + rightEnd) * 0.5;

                    return (
                      <>
                        <mesh position={[leftX, y, fenceD * 0.5]} castShadow receiveShadow raycast={() => null}>
                          <boxGeometry args={[leftW, railR * 2, railR * 2]} />
                          <meshStandardMaterial {...zincMatProps} />
                        </mesh>
                        <mesh position={[rightX, y, fenceD * 0.5]} castShadow receiveShadow raycast={() => null}>
                          <boxGeometry args={[rightW, railR * 2, railR * 2]} />
                          <meshStandardMaterial {...zincMatProps} />
                        </mesh>
                      </>
                    );
                  })()}
                  <mesh position={[-fenceW * 0.5, y, 0]} castShadow receiveShadow raycast={() => null}>
                    <boxGeometry args={[railR * 2, railR * 2, fenceD]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                  <mesh position={[fenceW * 0.5, y, 0]} castShadow receiveShadow raycast={() => null}>
                    <boxGeometry args={[railR * 2, railR * 2, fenceD]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                </group>
              ))}

              {/* Side mesh panels (zinc screen) */}
              <mesh position={[0, y0 + fenceH * 0.5, -fenceD * 0.5]} rotation={[0, 0, 0]} receiveShadow castShadow raycast={() => null}>
                <planeGeometry args={[meshW, fenceH - 0.15]} />
                <meshPhysicalMaterial
                  {...screenMatProps}
                  alphaMap={chainLinkTexture || null}
                  transparent
                  alphaTest={0.5}
                  side={DoubleSide}
                  depthWrite
                />
              </mesh>
              {/* Front (+Z) mesh split around gate opening (real cutout) */}
              {(() => {
                const leftStart = -fenceW * 0.5;
                const leftEnd = gateX - openingW * 0.5;
                const rightStart = gateX + openingW * 0.5;
                const rightEnd = fenceW * 0.5;

                const leftW = Math.max(0.01, leftEnd - leftStart);
                const rightW = Math.max(0.01, rightEnd - rightStart);

                const leftX = (leftStart + leftEnd) * 0.5;
                const rightX = (rightStart + rightEnd) * 0.5;

                const mat = (
                  <meshPhysicalMaterial
                    {...screenMatProps}
                    alphaMap={chainLinkTexture || null}
                    transparent
                    alphaTest={0.5}
                    side={DoubleSide}
                    depthWrite
                  />
                );

                return (
                  <>
                    <mesh position={[leftX, y0 + fenceH * 0.5, fenceD * 0.5 - 0.001]} rotation={[0, Math.PI, 0]} receiveShadow castShadow raycast={() => null}>
                      <planeGeometry args={[leftW - 0.02, fenceH - 0.15]} />
                      {mat}
                    </mesh>
                    <mesh position={[rightX, y0 + fenceH * 0.5, fenceD * 0.5 - 0.001]} rotation={[0, Math.PI, 0]} receiveShadow castShadow raycast={() => null}>
                      <planeGeometry args={[rightW - 0.02, fenceH - 0.15]} />
                      {mat}
                    </mesh>
                  </>
                );
              })()}
              <mesh position={[-fenceW * 0.5, y0 + fenceH * 0.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow raycast={() => null}>
                <planeGeometry args={[meshD, fenceH - 0.15]} />
                <meshPhysicalMaterial
                  {...screenMatProps}
                  alphaMap={chainLinkTexture || null}
                  transparent
                  alphaTest={0.5}
                  side={DoubleSide}
                  depthWrite
                />
              </mesh>
              <mesh position={[fenceW * 0.5, y0 + fenceH * 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow raycast={() => null}>
                <planeGeometry args={[meshD, fenceH - 0.15]} />
                <meshPhysicalMaterial
                  {...screenMatProps}
                  alphaMap={chainLinkTexture || null}
                  transparent
                  alphaTest={0.5}
                  side={DoubleSide}
                  depthWrite
                />
              </mesh>

              {/* Gate posts (front side) */}
              <mesh position={[gateX - gateW * 0.5, y0 + fenceH * 0.5, frontZ]} castShadow receiveShadow raycast={() => null}>
                <cylinderGeometry args={[postR, postR, fenceH, 10]} />
                <meshStandardMaterial {...zincMatProps} />
              </mesh>
              <mesh position={[gateX + gateW * 0.5, y0 + fenceH * 0.5, frontZ]} castShadow receiveShadow raycast={() => null}>
                <cylinderGeometry args={[postR, postR, fenceH, 10]} />
                <meshStandardMaterial {...zincMatProps} />
              </mesh>

              {/* Gate door (independent, hinged, clickable) */}
              <group
                ref={gateHingeRef}
                position={[gateX - gateW * 0.5, y0, frontZ - 0.02]}
              >
                <group
                  position={[0, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (generatorGateLocked) {
                      openGateUnlockDialog();
                      return;
                    }
                    // Safety rule: if padlock was removed while power was ON,
                    // opening the gate with the main breaker ON causes Game Over.
                    if (!gateOpen && generatorGateUnlockedWhilePowerOn && !isPowerOff) {
                      triggerGameOver(2000);
                      return;
                    }
                    setGateOpen((v) => !v);
                  }}
                  onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                  onPointerOut={() => { document.body.style.cursor = 'default'; }}
                >
                  {/* Gate frame */}
                  <mesh position={[gateW * 0.5, gateH * 0.5, 0.0]} castShadow receiveShadow>
                    <boxGeometry args={[gateW, railR * 2.2, railR * 2.2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                  <mesh position={[gateW * 0.5, railR * 1.1, 0.0]} castShadow receiveShadow>
                    <boxGeometry args={[gateW, railR * 2.2, railR * 2.2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                  <mesh position={[gateW - railR, gateH * 0.5, 0.0]} castShadow receiveShadow>
                    <boxGeometry args={[railR * 2.2, gateH, railR * 2.2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>
                  <mesh position={[railR, gateH * 0.5, 0.0]} castShadow receiveShadow>
                    <boxGeometry args={[railR * 2.2, gateH, railR * 2.2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>

                  {/* Gate zinc mesh */}
                  <mesh position={[gateW * 0.5, gateH * 0.5, -0.001]} receiveShadow castShadow>
                    <planeGeometry args={[gateW - 0.12, gateH - 0.12]} />
                    <meshPhysicalMaterial
                      {...screenMatProps}
                      alphaMap={chainLinkTexture || null}
                      transparent
                      alphaTest={0.5}
                      side={DoubleSide}
                      depthWrite
                    />
                  </mesh>

                  {/* Top crossbar */}
                  <mesh position={[gateW * 0.5, gateH - railR * 1.1, 0.0]} castShadow receiveShadow>
                    <boxGeometry args={[gateW, railR * 2.2, railR * 2.2]} />
                    <meshStandardMaterial {...zincMatProps} />
                  </mesh>

                  {/* Simple latch/handle */}
                  <mesh position={[gateW * 0.85, gateH * 0.55, 0.02]} castShadow receiveShadow>
                    <boxGeometry args={[0.07, 0.02, 0.03]} />
                    <meshStandardMaterial {...zincMatProps} roughness={0.45} />
                  </mesh>

                  {/* Padlock (shown while locked) */}
                  {generatorGateLocked && (
                    <group position={[gateW * 0.86, gateH * 0.46, 0.045]} scale={[1.22, 1.22, 1.22]}>
                      {/* Body */}
                      <mesh castShadow receiveShadow position={[0, -0.02, 0]}>
                        <boxGeometry args={[0.06, 0.075, 0.03]} />
                        <meshPhysicalMaterial
                          color={'#fbbf24'}
                          metalness={0.8}
                          roughness={0.42}
                          clearcoat={0.12}
                          clearcoatRoughness={0.75}
                          envMapIntensity={0.9}
                          dithering
                        />
                      </mesh>
                      {/* Shackle */}
                      <mesh castShadow receiveShadow position={[0, 0.074, 0.0]}>
                        <torusGeometry args={[0.022, 0.006, 10, 18, Math.PI]} />
                        <meshStandardMaterial
                          color={'#e5e7eb'}
                          metalness={0.95}
                          roughness={0.22}
                          envMapIntensity={1.0}
                          dithering
                        />
                      </mesh>
                      {/* Shackle legs */}
                      {[-0.022, 0.022].map((x, idx) => (
                        <mesh key={`lock-leg-${idx}`} castShadow receiveShadow position={[x, 0.044, 0.0]}>
                          <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />
                          <meshStandardMaterial
                            color={'#e5e7eb'}
                            metalness={0.95}
                            roughness={0.22}
                            envMapIntensity={1.0}
                            dithering
                          />
                        </mesh>
                      ))}
                    </group>
                  )}
                </group>
              </group>

              {/* Roof mesh cover */}
              <mesh position={[0, topY + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow raycast={() => null}>
                <planeGeometry args={[fenceW - 0.02, fenceD - 0.02]} />
                <meshPhysicalMaterial
                  {...screenMatProps}
                  alphaMap={chainLinkTexture || null}
                  transparent
                  alphaTest={0.5}
                  side={DoubleSide}
                  depthWrite
                />
              </mesh>

              {/* Trapezoidal zinc roof sheets above the mesh */}
              <group
                position={[0, topY + 0.095, 0]}
                rotation={[-0.055, 0, 0]}
                raycast={() => null}
              >
                {(() => {
                  const overhang = 0.14;
                  const roofW = fenceW + overhang * 2;
                  const roofD = fenceD + overhang * 2;
                  const sheetT = 0.012;

                  // Corrugation: repeated trapezoid-ish ribs along X (vertical orientation).
                  // Ribs run front-to-back (Z), spaced across the width (X).
                  const ribs = 13;
                  const ribStep = roofW / ribs;

                  return (
                    <>
                      {/* Base thin sheet */}
                      <mesh position={[0, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[roofW, sheetT, roofD]} />
                        <meshStandardMaterial {...zincMatProps} roughness={0.48} metalness={0.82} />
                      </mesh>

                      {/* Raised ribs (trapezoidal look) */}
                      {Array.from({ length: ribs }).map((_, i) => {
                        const x = -roofW * 0.5 + (i + 0.5) * ribStep;
                        const isHigh = i % 2 === 0;
                        const ribH = isHigh ? 0.045 : 0.03;
                        const ribW = isHigh ? 0.12 : 0.085;
                        return (
                          <mesh key={`rib-${i}`} position={[x, ribH * 0.5 + sheetT * 0.5, 0]} castShadow receiveShadow>
                            <boxGeometry args={[ribW, ribH, roofD]} />
                            <meshStandardMaterial {...zincMatProps} roughness={0.42} metalness={0.85} />
                          </mesh>
                        );
                      })}

                      {/* Simple edge caps */}
                      <mesh position={[-roofW * 0.5, sheetT * 0.5 + 0.008, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.03, 0.02, roofD]} />
                        <meshStandardMaterial {...zincMatProps} roughness={0.45} metalness={0.85} />
                      </mesh>
                      <mesh position={[roofW * 0.5, sheetT * 0.5 + 0.008, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.03, 0.02, roofD]} />
                        <meshStandardMaterial {...zincMatProps} roughness={0.45} metalness={0.85} />
                      </mesh>
                    </>
                  );
                })()}
              </group>
            </>
          );
        })()}
      </group>

      {/* Base/Platform - Gray */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.2, 2]} />
        <meshPhysicalMaterial
          color="#6b7280"
          metalness={0.12}
          roughness={0.75}
          clearcoat={0.12}
          clearcoatRoughness={0.75}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.12, 0.12)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.55}
          dithering
        />
      </mesh>

      {/* Skids / Rails */}
      <mesh position={[0, -0.18, 0.82]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.08, 0.12]} />
        <meshPhysicalMaterial
          color="#374151"
          metalness={0.25}
          roughness={0.65}
          clearcoat={0.06}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.55}
          dithering
        />
      </mesh>
      <mesh position={[0, -0.18, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.08, 0.12]} />
        <meshPhysicalMaterial
          color="#374151"
          metalness={0.25}
          roughness={0.65}
          clearcoat={0.06}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.55}
          dithering
        />
      </mesh>

      {/* Feet */}
      <mesh position={[-1.35, -0.2, 0.82]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.0} roughness={0.95} dithering />
      </mesh>
      <mesh position={[1.35, -0.2, 0.82]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.0} roughness={0.95} dithering />
      </mesh>
      <mesh position={[-1.35, -0.2, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.0} roughness={0.95} dithering />
      </mesh>
      <mesh position={[1.35, -0.2, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.0} roughness={0.95} dithering />
      </mesh>

      {/* Main Generator Body - Orange */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.5, 1.5]} />
        <meshPhysicalMaterial
          color="#f97316"
          metalness={0.08}
          roughness={0.58}
          clearcoat={0.35}
          clearcoatRoughness={0.58}
          normalMap={paintMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.18, 0.18)}
          roughnessMap={paintMicroSurface?.roughnessMap || null}
          envMapIntensity={0.95}
          dithering
        />
      </mesh>

      {/* Front radiator frame */}
      <mesh position={[0.55, 0.75, 0.82]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 1.18, 0.06]} />
        <meshPhysicalMaterial
          color="#1f2937"
          metalness={0.18}
          roughness={0.78}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.16, 0.16)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.75}
          dithering
        />
      </mesh>

      {/* Inner folded edge (thin inset frame) */}
      <mesh position={[0.55, 0.75, 0.835]} castShadow receiveShadow>
        <boxGeometry args={[1.28, 1.10, 0.02]} />
        <meshPhysicalMaterial
          color="#334155"
          metalness={0.14}
          roughness={0.8}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.85}
          dithering
        />
      </mesh>

      {/* Inner channel/U-profile strips (adds perceived thickness and depth) */}
      <mesh position={[0.55, 0.75 + 0.55 - 0.02, 0.828]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.04, 0.02]} />
        <meshPhysicalMaterial
          color="#1f2937"
          metalness={0.16}
          roughness={0.78}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.8}
          dithering
        />
      </mesh>
      <mesh position={[0.55, 0.75 - 0.55 + 0.02, 0.828]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.04, 0.02]} />
        <meshPhysicalMaterial
          color="#1f2937"
          metalness={0.16}
          roughness={0.78}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.8}
          dithering
        />
      </mesh>
      <mesh position={[0.55 + 0.64 - 0.02, 0.75, 0.828]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.04, 0.02]} />
        <meshPhysicalMaterial
          color="#1f2937"
          metalness={0.16}
          roughness={0.78}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.8}
          dithering
        />
      </mesh>
      <mesh position={[0.55 - 0.64 + 0.02, 0.75, 0.828]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.04, 0.02]} />
        <meshPhysicalMaterial
          color="#1f2937"
          metalness={0.16}
          roughness={0.78}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.14, 0.14)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.8}
          dithering
        />
      </mesh>

      {/* Radiator backing (adds depth so the grille doesn't look like a black void) */}
      <mesh position={[0.55, 0.75, 0.80]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.02, 0.03]} />
        <meshStandardMaterial color="#0f172a" metalness={0.05} roughness={0.98} envMapIntensity={0.28} dithering />
      </mesh>

      {/* Frame fasteners */}
      <instancedMesh ref={fastenersRef} args={[null, null, RADIATOR_FASTENERS]} castShadow receiveShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.01, 10]} />
        <meshStandardMaterial vertexColors metalness={0.7} roughness={0.55} envMapIntensity={0.7} dithering />
      </instancedMesh>

      {/* Radiator fins/core (instanced) */}
      <instancedMesh ref={radiatorFinsRef} args={[null, null, RADIATOR_FINS]} castShadow receiveShadow>
        <boxGeometry args={[0.028, 1.0, 0.01]} />
        <meshStandardMaterial
          vertexColors
          metalness={0.05}
          roughness={0.95}
          envMapIntensity={0.25}
          dithering
        />
      </instancedMesh>

      {/* Radiator grille slats (instanced) */}
      <instancedMesh ref={grilleRef} args={[null, null, GRILLE_SLATS]} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.04, 0.02]} />
        <meshPhysicalMaterial
          vertexColors
          metalness={0.25}
          roughness={0.6}
          clearcoat={0.18}
          clearcoatRoughness={0.55}
          envMapIntensity={0.75}
          dithering
        />
      </instancedMesh>

      {/* Rotating Vent 1 - Side - Gray */}
      <mesh ref={ventRef1} position={[0, 0.8, 0.76]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 8]} />
        <meshStandardMaterial 
          color={isPowerOff ? "#4b5563" : "#9ca3af"} 
          metalness={0.28} 
          roughness={0.55} 
          envMapIntensity={0.6}
          dithering
        />
      </mesh>

      {/* Rotating Vent 2 - Side - Gray */}
      <mesh ref={ventRef2} position={[0, 0.8, -0.76]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 8]} />
        <meshStandardMaterial 
          color={isPowerOff ? "#4b5563" : "#9ca3af"} 
          metalness={0.28} 
          roughness={0.55} 
          envMapIntensity={0.6}
          dithering
        />
      </mesh>

      {/* Engine Block - Gray */}
      <mesh position={[-0.8, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 1.2]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={0.08}
          roughness={0.92}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.16, 0.16)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.4}
          dithering
        />
      </mesh>

      {/* Control Panel - Gray */}
      <mesh position={[1.3, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.6, 0.8]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={0.05}
          roughness={0.85}
          normalMap={metalMicroSurface?.normalMap || null}
          normalScale={new Vector2(0.12, 0.12)}
          roughnessMap={metalMicroSurface?.roughnessMap || null}
          envMapIntensity={0.5}
          dithering
        />
      </mesh>

      {/* Panel face */}
      <mesh position={[1.38, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.02, 0.42, 0.55]} />
        <meshStandardMaterial color="#0f172a" metalness={0.0} roughness={0.92} envMapIntensity={0.15} dithering />
      </mesh>

      {/* Status LEDs */}
      <mesh position={[1.40, 1.34, 0.15]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color={isPowerOff ? '#ef4444' : '#22c55e'}
          emissive={isPowerOff ? '#ef4444' : '#22c55e'}
          emissiveIntensity={isPowerOff ? 0.55 : 0.75}
          metalness={0.0}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[1.40, 1.34, -0.05]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color={isPowerOff ? '#ef4444' : '#22c55e'}
          emissive={isPowerOff ? '#ef4444' : '#22c55e'}
          emissiveIntensity={isPowerOff ? 0.55 : 0.75}
          metalness={0.0}
          roughness={0.2}
        />
      </mesh>

      {/* Exhaust Pipes - Gray */}
      <mesh position={[-1.2, 1.8, 0.3]} rotation={[0, 0, Math.PI / 8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.18} roughness={0.78} envMapIntensity={0.45} dithering />
      </mesh>

      {/* Cooling Fan (animated) - Gray */}
      <mesh ref={fanRef} position={[0.8, 0.8, 0.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
        <meshStandardMaterial 
          color={isPowerOff ? "#4b5563" : "#9ca3af"} 
          metalness={0.22} 
          roughness={0.62} 
          envMapIntensity={0.55}
          dithering
        />
      </mesh>

      {/* Rotating Belt/Pulley - Front - Gray */}
      <mesh ref={beltRef} position={[0.8, 0.4, 0.76]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 8]} />
        <meshStandardMaterial 
          color={isPowerOff ? "#4b5563" : "#9ca3af"} 
          metalness={0.25} 
          roughness={0.65} 
          envMapIntensity={0.55}
          dithering
        />
      </mesh>

      {/* Ground Plane - grass */}
      <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20, groundQuality.segments, groundQuality.segments]} />
        <meshStandardMaterial
          color="#ffffff"
          map={grassTextures?.map || null}
          normalMap={grassTextures?.normalMap || null}
          normalScale={new Vector2(0.65, 0.65)}
          roughnessMap={grassTextures?.roughnessMap || null}
          roughness={0.95}
          metalness={0.0}
          displacementMap={grassTextures?.displacementMap || null}
          displacementScale={groundQuality.displacement}
          envMapIntensity={0.15}
          dithering
        />
      </mesh>

      {/* Grass tufts (instanced cards) for extra 3D volume near the generator */}
      <instancedMesh
        ref={grassTuftsRef}
        args={[null, null, groundQuality.displacement > 0 ? GRASS_TUFTS_HIGH : GRASS_TUFTS_LOW]}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          vertexColors
          map={grassTuftTexture || null}
          transparent
          alphaTest={0.55}
          depthWrite
          side={DoubleSide}
          roughness={1.0}
          metalness={0.0}
          dithering
        />
      </instancedMesh>

      {/* Copper Ground Rod - Appears when residual energy is eliminated */}
      {residualEnergyEliminated && (
        <group>
          {/* Copper Rod - thinner and shorter */}
          <mesh position={[2.5, 0.04, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
            <meshStandardMaterial color="#D2691E" metalness={1.0} roughness={0.22} envMapIntensity={0.9} dithering />
          </mesh>
          {/* Connection Line from Generator Base (between orange and gray) to Copper Rod Top */}
          <Line
            points={[[0, 0, 0], [2.5, 0.29, 0]]}
            color="#D2691E"
            lineWidth={2}
          />
          {/* Ground connection line */}
          <Line
            points={[[2.5, 0.29, 0], [2.5, -0.21, 0]]}
            color="#D2691E"
            lineWidth={2}
          />
        </group>
      )}
    </group>
  );
};

export default React.memo(GeneratorModelSimple);

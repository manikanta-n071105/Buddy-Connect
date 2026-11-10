/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, extend, useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import { drawSSEIdCard } from './drawSSECard';

// @ts-ignore
import cardGLB from './card.glb';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

// 1x1 transparent pixel
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

/**
 * Creates a vibrant high-definition Sanskrithi Orange lanyard strap (tag) texture
 */
const createOrangeStrapTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Vibrant Sanskrithi Orange gradient base
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#c2410c');
  grad.addColorStop(0.2, '#ea580c');
  grad.addColorStop(0.5, '#f97316');
  grad.addColorStop(0.8, '#ea580c');
  grad.addColorStop(1, '#c2410c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 256);

  // Subtle woven fabric texture
  ctx.globalAlpha = 0.08;
  for (let x = 0; x < 2048; x += 6) {
    ctx.fillStyle = x % 12 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(x, 0, 3, 256);
  }
  ctx.globalAlpha = 1;

  // Crisp white and yellow accent border stripes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 8, 2048, 10);
  ctx.fillRect(0, 238, 2048, 10);

  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 26, 2048, 4);
  ctx.fillRect(0, 226, 2048, 4);

  // Bold white text along the lanyard tag!
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px "Arial Black", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = '  SANSKRITHI  •  SCHOOL OF ENGINEERING  •  SANSKRITHI  •  SCHOOL OF ENGINEERING  ';
  ctx.fillText(text, 1024, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
};

export interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  bandColor?: string;
  userName?: string;
  department?: string;
  registerNo?: string;
  userRole?: string;
  residenceStatus?: string;
  bloodGroup?: string;
  academicYear?: string;
  validUpto?: string;
  className?: string;
}

class LanyardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('[Lanyard] 3D Canvas error caught, activating fallback ID card:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const LanyardFallbackCard: React.FC<LanyardProps> = ({
  userName = 'N MANIKANTA',
  department = 'CSE - B',
  registerNo = '23KF1A0591',
  userRole = 'SENIOR',
  residenceStatus = 'DAY SCHOLAR',
  bloodGroup = 'O +VE',
  academicYear = '2025 - 2026',
  validUpto = 'MAY 2027',
  className = 'relative z-0 w-full h-full flex justify-center items-center'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 1024;
    canvas.height = 1024;
    const logo = new Image();
    logo.src = '/assets/sse-s-logo.jpg';
    logo.onload = () => {
      drawSSEIdCard(canvas, {
        name: userName,
        department,
        registerNo,
        userRole,
        residenceStatus,
        bloodGroup,
        academicYear,
        validUpto,
        sLogoImage: logo
      });
    };
    drawSSEIdCard(canvas, {
      name: userName,
      department,
      registerNo,
      userRole,
      residenceStatus,
      bloodGroup,
      academicYear,
      validUpto,
      sLogoImage: null
    });
  }, [userName, department, registerNo, userRole, residenceStatus, bloodGroup, academicYear, validUpto]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * 18, y: x * 18 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
    >
      <div className="flex flex-col items-center select-none">
        {/* Top Lanyard Strap */}
        <div className="w-9 h-24 bg-gradient-to-b from-orange-700 via-orange-500 to-orange-700 shadow-md border-x-2 border-white/25 rounded-t-sm flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px] opacity-25" />
          <span className="text-[9px] font-black tracking-widest text-white/90 rotate-90 select-none uppercase">SSE</span>
        </div>
        {/* Metallic Clip & Ring */}
        <div className="w-5 h-4 bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 rounded-sm shadow-md border border-slate-400/80 -mt-0.5 z-10" />
        <div className="w-7 h-2 bg-gradient-to-r from-slate-600 via-slate-300 to-slate-600 rounded-full shadow-inner z-10" />

        {/* 3D-Tiltable Realistic ID Card Badge */}
        <div
          className="w-[270px] sm:w-[310px] aspect-square rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60 transition-transform duration-150 ease-out bg-slate-900 mt-0.5"
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default function Lanyard(props: LanyardProps) {
  const {
    position = [0, -1.35, 9.2],
    gravity = [0, -40, 0],
    fov = 22,
    transparent = true,
    frontImage = null,
    backImage = null,
    imageFit = 'cover',
    lanyardImage = null,
    lanyardWidth = 1.1,
    bandColor = '#c84724',
    userName,
    department,
    registerNo,
    userRole,
    residenceStatus,
    bloodGroup,
    academicYear,
    validUpto,
    className = 'relative z-0 w-full h-full flex justify-center items-center'
  } = props;

  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <LanyardErrorBoundary fallback={<LanyardFallbackCard {...props} />}>
      <div className={className}>
        <Canvas
          camera={{ position, fov }}
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ alpha: transparent, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1);
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('[Lanyard] WebGL context lost handled gracefully');
            }, false);
          }}
        >
          {/* Crystal-clear studio lighting so text and colors are sharp and vibrant */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[0, -1, 6]} intensity={0.9} color="#ffffff" />
          <directionalLight position={[3, 5, 4]} intensity={0.7} color="#ffffff" />
          <pointLight position={[-3, 2, 4]} intensity={0.3} color="#ea580c" />
          <Suspense fallback={null}>
            <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
              <Band
                isMobile={isMobile}
                frontImage={frontImage}
                backImage={backImage}
                imageFit={imageFit}
                lanyardImage={lanyardImage}
                lanyardWidth={lanyardWidth}
                bandColor={bandColor}
                userName={userName}
                department={department}
                registerNo={registerNo}
                userRole={userRole}
                residenceStatus={residenceStatus}
                bloodGroup={bloodGroup}
                academicYear={academicYear}
                validUpto={validUpto}
              />
            </Physics>
            <Environment blur={0.75}>
              <Lightformer
                intensity={1.2}
                color="#ffffff"
                position={[0, -1, 5]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={1.5}
                color="#ea580c"
                position={[-1, -1, 1]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={1.5}
                color="white"
                position={[1, 1, 1]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
            </Environment>
          </Suspense>
        </Canvas>
      </div>
    </LanyardErrorBoundary>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  imageFit?: 'cover' | 'contain';
  lanyardImage?: string | null;
  lanyardWidth?: number;
  bandColor?: string;
  userName?: string;
  department?: string;
  registerNo?: string;
  userRole?: string;
  residenceStatus?: string;
  bloodGroup?: string;
  academicYear?: string;
  validUpto?: string;
}

type LanyardRigidBody = RapierRigidBody & {
  lerped?: THREE.Vector3;
};

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1.1,
  bandColor = '#c84724',
  userName,
  department,
  registerNo,
  userRole,
  residenceStatus,
  bloodGroup,
  academicYear,
  validUpto
}: BandProps) {
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>, InstanceType<typeof MeshLineMaterial>>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LanyardRigidBody>(null!);
  const j2 = useRef<LanyardRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);

  const [sLogoImage, setSLogoImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const logo = new Image();
    logo.src = '/assets/sse-s-logo.jpg';
    logo.onload = () => setSLogoImage(logo);
  }, []);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  // Natural physical pendulum damping parameters
  const segmentProps: RigidBodyProps = {
    type: 'dynamic',
    canSleep: false,
    colliders: false,
    angularDamping: 2.2,
    linearDamping: 1.6
  };

  const getLerped = (body: LanyardRigidBody): THREE.Vector3 => {
    if (!body.lerped) {
      body.lerped = new THREE.Vector3().copy(body.translation());
    }
    return body.lerped;
  };

  const { nodes, materials } = useGLTF(cardGLB) as any;
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Vibrant Sanskrithi Orange woven lanyard tag texture
  const strapTexture = useMemo(() => {
    if (lanyardImage) return null;
    return createOrangeStrapTexture();
  }, [lanyardImage]);

  // Composite the authentic Sanskrithi School of Engineering ID Card
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    const W = 2048;
    const H = 2048;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;

    // Render Side-by-Side ID Card (QR on left, Profile details on right)
    if (!frontImage && !backImage) {
      drawSSEIdCard(canvas, {
        name: userName || 'N MANIKANTA',
        department: department || 'CSE - B',
        registerNo: registerNo || '23KF1A0591',
        userRole: userRole || 'SENIOR',
        residenceStatus: residenceStatus || 'DAY SCHOLAR',
        bloodGroup: bloodGroup || 'O +VE',
        academicYear: academicYear || '2025 - 2026',
        validUpto: validUpto || 'MAY 2027',
        sLogoImage
      });
    } else {
      const drawFitted = (img: any, rect: typeof FRONT_UV_RECT) => {
        const rx = rect.x * W;
        const ry = rect.y * H;
        const rw = rect.w * W;
        const rh = rect.h * H;
        const pick = imageFit === 'contain' ? Math.min : Math.max;
        const scale = pick(rw / img.width, rh / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = rx + (rw - dw) / 2;
        const dy = ry + (rh - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };

      if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
      if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    if (baseMap) {
      composite.flipY = baseMap.flipY;
    }
    composite.anisotropy = 16;
    composite.needsUpdate = true;

    if (materials.base) {
      materials.base.map = composite;
      materials.base.needsUpdate = true;
    }

    return composite;
  }, [
    frontImage,
    backImage,
    imageFit,
    frontTex,
    backTex,
    materials.base?.map,
    userName,
    department,
    registerNo,
    userRole,
    residenceStatus,
    bloodGroup,
    academicYear,
    validUpto,
    sLogoImage
  ]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ]);

  // Gentle realistic initial release swing on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (card.current) {
        card.current.wakeUp();
        card.current.applyImpulse({ x: 0.02, y: -0.004, z: 0.015 }, true);
        card.current.applyTorqueImpulse({ x: 0.002, y: 0.01, z: -0.005 }, true);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    // Realistic ambient micro-sway when not being dragged
    if (!dragged && card.current) {
      const t = state.clock.getElapsedTime();
      const breezeX = Math.sin(t * 1.3) * 0.0008 + Math.sin(t * 0.6) * 0.0004;
      const breezeZ = Math.cos(t * 0.9) * 0.0006;
      card.current.wakeUp();
      card.current.applyImpulse({ x: breezeX, y: 0, z: breezeZ }, true);
    }

    if (fixed.current) {
      [j1, j2].forEach(ref => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, lerped.distanceTo(ref.current.translation()))
        );
        lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      if (band.current?.geometry) {
        band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      }
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel(
        { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
        true
      );
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation()))
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={0.3}
                clearcoatRoughness={0.15}
                roughness={0.35}
                metalness={0.0}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.2}
              material-metalness={0.9}
            />
            <mesh
              geometry={nodes.clamp.geometry}
              material={materials.metal}
              material-roughness={0.2}
              material-metalness={0.9}
            />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#ffffff"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={strapTexture || undefined}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth * 1.3}
        />
      </mesh>
    </>
  );
}

try {
  useGLTF.preload(cardGLB);
} catch (e) {
  // Graceful fallback if preload fails
}

/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';
import { User } from '../../types';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ── Helper: generate a realistic lanyard strap texture ───────────────
const createStrapTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark navy woven fabric base
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0c1524');
  grad.addColorStop(0.15, '#1a2744');
  grad.addColorStop(0.5, '#162038');
  grad.addColorStop(0.85, '#1a2744');
  grad.addColorStop(1, '#0c1524');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 256);

  // Subtle woven pattern
  ctx.globalAlpha = 0.06;
  for (let x = 0; x < 2048; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(x, 0, 4, 256);
  }
  ctx.globalAlpha = 1;

  // Red accent stripes at edges
  ctx.fillStyle = '#e25134';
  ctx.fillRect(0, 8, 2048, 12);
  ctx.fillRect(0, 236, 2048, 12);

  // Gold thin pinstripes
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 24, 2048, 3);
  ctx.fillRect(0, 229, 2048, 3);

  // Center text - white bold
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';

  const text = '  SANSKRITHI  •  JUNIORCONNECT  •  SANSKRITHI  •  JUNIORCONNECT  ';
  ctx.fillText(text, 1024, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
};

// ── Helper: generate the front face texture of the ID card ───────────
const generateFrontTexture = (user: User | null) => {
  const W = 1200;
  const H = 1800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ─── White PVC card base ───
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Rounded corner clip-through border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(12, 12, W - 24, H - 24, 24);
  ctx.stroke();

  // ─── Top red accent bar ───
  ctx.fillStyle = '#e25134';
  ctx.fillRect(0, 0, W, 18);

  // ─── Lanyard hole punch ───
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(W / 2, 70, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W / 2, 70, 20, 0, Math.PI * 2);
  ctx.fill();

  // ─── Institution header banner ───
  const headerGrad = ctx.createLinearGradient(0, 110, W, 110);
  headerGrad.addColorStop(0, '#0f172a');
  headerGrad.addColorStop(0.5, '#1e293b');
  headerGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = headerGrad;
  ctx.beginPath();
  ctx.roundRect(40, 120, W - 80, 200, 16);
  ctx.fill();

  // Red bottom border on header
  ctx.fillStyle = '#e25134';
  ctx.fillRect(40, 304, W - 80, 6);

  // Institution name
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 56px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SANSKRITHI', W / 2, 190);

  ctx.font = '700 26px Arial, sans-serif';
  ctx.fillStyle = '#f97316';
  ctx.fillText('SCHOOL OF ENGINEERING', W / 2, 240);

  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('AUTONOMOUS  •  JUNIORCONNECT MENTORSHIP', W / 2, 278);

  // ─── Profile photo area (initials or avatar circle) ───
  const avatarCx = W / 2;
  const avatarCy = 510;
  const avatarR = 150;

  // Shadow ring
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR + 12, 0, Math.PI * 2);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();

  // Outer ring
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR + 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#e25134';
  ctx.lineWidth = 6;
  ctx.stroke();

  // White circle base
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Initials
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'S';
  ctx.fillStyle = '#e25134';
  ctx.font = '900 120px "Arial Black", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, avatarCx, avatarCy + 4);

  // ─── Name ───
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 58px "Arial Black", Arial, sans-serif';
  const displayName = user?.name || 'Authorized Member';
  // Truncate long names
  let nameSize = 58;
  while (ctx.measureText(displayName).width > W - 120 && nameSize > 28) {
    nameSize -= 2;
    ctx.font = `900 ${nameSize}px "Arial Black", Arial, sans-serif`;
  }
  ctx.fillText(displayName, W / 2, 740);

  // ─── Role badge pill ───
  const roleText = user?.role ? user.role.replace(/_/g, ' ') : 'STUDENT';
  const roleColor =
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
      ? '#dc2626'
      : user?.role === 'DIRECTOR'
      ? '#d97706'
      : user?.role === 'FACULTY' || user?.role === 'WARDEN'
      ? '#059669'
      : user?.role === 'SENIOR'
      ? '#4f46e5'
      : '#0284c7';

  ctx.font = '800 28px Arial, sans-serif';
  const pillW = Math.max(280, ctx.measureText(roleText).width + 80);
  ctx.fillStyle = roleColor;
  ctx.beginPath();
  ctx.roundRect(W / 2 - pillW / 2, 780, pillW, 56, 28);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleText, W / 2, 808);

  // ─── Department ───
  ctx.textBaseline = 'alphabetic';
  const dept = user?.department || 'Computer Science & Engineering';
  ctx.fillStyle = '#475569';
  ctx.font = '700 30px Arial, sans-serif';
  ctx.fillText(dept.toUpperCase(), W / 2, 900);

  // ─── Year / Batch ───
  const academicYr = user?.year || user?.batch || (user as any)?.academicYear;
  if (academicYr) {
    ctx.fillStyle = '#64748b';
    ctx.font = '600 26px Arial, sans-serif';
    ctx.fillText(`Year: ${academicYr}`, W / 2, 950);
  }

  // ─── Divider line ───
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 990);
  ctx.lineTo(W - 120, 990);
  ctx.stroke();

  // ─── Member ID ───
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 34px "Courier New", monospace';
  const memberId = user?.id ? `SSE-${String(user.id).padStart(5, '0')}` : 'SSE-2026-XXXXX';
  ctx.fillText(memberId, W / 2, 1040);

  // ─── Decorative QR code placeholder ───
  const qrSize = 280;
  const qrX = W / 2 - qrSize / 2;
  const qrY = 1090;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);

  // QR pattern
  const cellSize = qrSize / 10;
  ctx.fillStyle = '#0f172a';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r + c) % 2 === 0 || r === 0 || r === 9 || c === 0 || c === 9) {
        ctx.fillRect(qrX + c * cellSize + 1, qrY + r * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }
  }

  // Center accent in QR
  ctx.fillStyle = '#e25134';
  ctx.beginPath();
  ctx.roundRect(qrX + 3.5 * cellSize, qrY + 3.5 * cellSize, cellSize * 3, cellSize * 3, 8);
  ctx.fill();

  // ─── Verification text ───
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('VERIFIED ACADEMIC CREDENTIAL', W / 2, 1440);

  // ─── Bottom red bar ───
  ctx.fillStyle = '#e25134';
  ctx.fillRect(0, H - 18, W, 18);

  return canvas;
};

// ── Helper: generate the back face texture ───────────────────────────
const generateBackTexture = (user: User | null) => {
  const W = 1200;
  const H = 1800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark gradient background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.5, '#162038');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Red border
  ctx.strokeStyle = '#e25134';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(20, 20, W - 40, H - 40, 16);
  ctx.stroke();

  // Inner gold pinstripe
  ctx.strokeStyle = '#f59e0b44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(32, 32, W - 64, H - 64, 12);
  ctx.stroke();

  ctx.textAlign = 'center';

  // Logo / Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 72px "Arial Black", Arial, sans-serif';
  ctx.fillText('JUNIOR', W / 2, 360);
  ctx.fillStyle = '#e25134';
  ctx.fillText('CONNECT', W / 2, 440);

  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillStyle = '#f97316';
  ctx.fillText('SANSKRITHI MENTORSHIP NETWORK', W / 2, 510);

  // Horizontal divider
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 570);
  ctx.lineTo(W - 200, 570);
  ctx.stroke();

  // Terms
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 24px Arial, sans-serif';
  ctx.fillText('This card is the property of', W / 2, 700);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillText('Sanskrithi School of Engineering', W / 2, 750);
  ctx.fillText('Beedupalli Road, Puttaparthi', W / 2, 790);
  ctx.fillText('Andhra Pradesh - 515134', W / 2, 830);

  // Horizontal divider
  ctx.strokeStyle = '#ffffff22';
  ctx.beginPath();
  ctx.moveTo(200, 900);
  ctx.lineTo(W - 200, 900);
  ctx.stroke();

  // If found
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 22px Arial, sans-serif';
  ctx.fillText('If found, please return to the above address', W / 2, 960);
  ctx.fillText('or contact the administration office.', W / 2, 995);

  // Emergency
  ctx.fillStyle = '#e25134';
  ctx.font = '800 30px Arial, sans-serif';
  ctx.fillText('EMERGENCY / HELPLINE', W / 2, 1150);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px "Courier New", monospace';
  ctx.fillText('+91 94400 00000', W / 2, 1200);

  // Bottom bar
  ctx.fillStyle = '#e25134';
  ctx.fillRect(0, H - 18, W, 18);

  return canvas;
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function Lanyard({
  user = null,
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 25,
  transparent = true,
  onClose,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 2,
}: any) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-generate textures from user profile if no explicit images given
  const generatedTextures = useMemo(() => {
    if (frontImage && backImage) return null;
    if (!user) return null;
    return {
      front: generateFrontTexture(user),
      back: generateBackTexture(user),
    };
  }, [user, frontImage, backImage]);

  return (
    <div className="lanyard-wrapper" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <Canvas
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            generatedTextures={generatedTextures}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

// Also export the texture generator for external usage
export { generateFrontTexture, generateBackTexture };

// ═══════════════════════════════════════════════════════════════════════
// BAND (internal physics component)
// ═══════════════════════════════════════════════════════════════════════
function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 2,
  generatedTextures = null,
}: any) {
  const band = useRef<any>(),
    fixed = useRef<any>(),
    j1 = useRef<any>(),
    j2 = useRef<any>(),
    j3 = useRef<any>(),
    card = useRef<any>();

  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();

  const segmentProps = {
    type: 'dynamic' as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  // ── Lanyard strap texture ──
  const customStrapTex = useTexture(lanyardImage || BLANK_PIXEL);
  const texture = useMemo(() => {
    if (lanyardImage && (customStrapTex as any)?.image) return customStrapTex;
    return createStrapTexture();
  }, [lanyardImage, customStrapTex]);

  // ── Card front/back textures via useTexture for external images ──
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // ── Build card texture atlas (front = left half, back = right half) ──
  const cardMap = useMemo(() => {
    const ATLAS_W = 2400;
    const ATLAS_H = 1800;
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_W;
    atlasCanvas.height = ATLAS_H;
    const ctx = atlasCanvas.getContext('2d')!;

    // Fill white base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, ATLAS_W, ATLAS_H);

    // If we have externally-provided images, composite them
    if (frontImage && (frontTex as any)?.image) {
      ctx.drawImage((frontTex as any).image, 0, 0, ATLAS_W / 2, ATLAS_H);
    } else if (generatedTextures?.front) {
      // Draw from our generated canvas
      ctx.drawImage(generatedTextures.front, 0, 0, ATLAS_W / 2, ATLAS_H);
    }

    if (backImage && (backTex as any)?.image) {
      ctx.drawImage((backTex as any).image, ATLAS_W / 2, 0, ATLAS_W / 2, ATLAS_H);
    } else if (generatedTextures?.back) {
      ctx.drawImage(generatedTextures.back, ATLAS_W / 2, 0, ATLAS_W / 2, ATLAS_H);
    }

    const tex = new THREE.CanvasTexture(atlasCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }, [frontImage, backImage, frontTex, backTex, generatedTextures]);

  // ── Procedural card geometry with proper UV mapping ──
  const cardGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.8, 1.125, 0.02);
    // Three.js BoxGeometry face order (groups):
    // 0: +X right, 1: -X left, 2: +Y top, 3: -Y bottom, 4: +Z front, 5: -Z back
    // Each face has 4 vertices; total = 24 vertices
    // Front face (+Z) vertices: indices 16,17,18,19
    // Back face  (-Z) vertices: indices 20,21,22,23
    const uvs = geo.attributes.uv;

    // Front face -> left half of atlas [0..0.5, 0..1]
    uvs.setXY(16, 0.0, 1.0);
    uvs.setXY(17, 0.5, 1.0);
    uvs.setXY(18, 0.0, 0.0);
    uvs.setXY(19, 0.5, 0.0);

    // Back face -> right half of atlas [0.5..1, 0..1]
    uvs.setXY(20, 1.0, 1.0);
    uvs.setXY(21, 0.5, 1.0);
    uvs.setXY(22, 1.0, 0.0);
    uvs.setXY(23, 0.5, 0.0);

    uvs.needsUpdate = true;
    return geo;
  }, []);

  const clipGeometry = useMemo(() => new THREE.CylinderGeometry(0.04, 0.04, 0.14, 16), []);
  const clampGeometry = useMemo(() => new THREE.BoxGeometry(0.16, 0.06, 0.05), []);
  const metalMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b0b8c8', metalness: 0.95, roughness: 0.15 }),
    []
  );

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([
      new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
    ])
  );
  const [dragged, drag] = useState<any>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      if (band.current?.geometry) {
        band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      }
      if (card.current) {
        ang.copy(card.current.angvel());
        rot.copy(card.current.rotation());
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
      }
    }
  });

  curve.curveType = 'chordal';
  (texture as any).wrapS = (texture as any).wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => ((e.target as HTMLElement).releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (
              (e.target as HTMLElement).setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={cardGeometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
            <mesh geometry={clipGeometry} material={metalMaterial} position={[0, 0.6, 0]} />
            <mesh geometry={clampGeometry} material={metalMaterial} position={[0, 0.54, 0]} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

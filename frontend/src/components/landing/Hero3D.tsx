import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, ContactShadows, Html } from '@react-three/drei';
import { CheckCircle2, Circle, Sparkles, TrendingUp, Calendar, Zap, ShieldCheck } from 'lucide-react';
import * as THREE from 'three';

// -------------------------------------------------------------
// 🖥️ CRISP LIVE REACT LIFEOS UI DISPLAY FOR 3D MONITOR SCREEN
// -------------------------------------------------------------
const MonitorLiveScreenUI: React.FC = () => {
  return (
    <div
      style={{
        width: '680px',
        height: '370px',
        background: '#0B0F19',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '16px 20px',
        borderRadius: '6px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Screen Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            L
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.3px' }}>LifeOS</span>
          <span
            style={{
              fontSize: '10px',
              background: 'rgba(99,102,241,0.2)',
              color: '#818CF8',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            v0.1 Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} color="#6366F1" /> Thu, Aug 21
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
            <ShieldCheck size={12} /> FastAPI Sync OK
          </span>
        </div>
      </div>

      {/* Main Screen Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '14px', flex: 1 }}>
        {/* Left Today's Focus Panel */}
        <div
          style={{
            background: 'rgba(19,27,46,0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#6366F1" /> Today's Focus
            </span>
            <span style={{ fontSize: '10px', color: '#64748B' }}>3 Tasks Remaining</span>
          </div>

          {/* Task Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div
              style={{
                background: 'rgba(30,41,59,0.6)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: '3px solid #10B981',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Complete FastAPI integration</span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(239,68,68,0.2)',
                  color: '#FCA5A5',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                High
              </span>
            </div>

            <div
              style={{
                background: 'rgba(30,41,59,0.6)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: '3px solid #10B981',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>DSA practice session</span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(245,158,11,0.2)',
                  color: '#FCD34D',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Medium
              </span>
            </div>

            <div
              style={{
                background: 'rgba(30,41,59,0.6)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: '3px solid #6366F1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Circle size={14} color="#94A3B8" />
                <span style={{ fontSize: '12px', color: '#CBD5E1' }}>LifeOS UI polish & verification</span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  background: 'rgba(99,102,241,0.2)',
                  color: '#A5B4FC',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                In Progress
              </span>
            </div>
          </div>
        </div>

        {/* Right Analytics Widget */}
        <div
          style={{
            background: 'rgba(19,27,46,0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} color="#8B5CF6" /> Focus Score
          </span>

          {/* Radial Progress Ring */}
          <div
            style={{
              position: 'relative',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'conic-gradient(#8B5CF6 0% 78%, rgba(255,255,255,0.08) 78% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '4px 0',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: '#131B2E',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>78%</span>
              <span style={{ fontSize: '8px', color: '#818CF8' }}>Optimal</span>
            </div>
          </div>

          <div
            style={{
              fontSize: '10px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16,185,129,0.12)',
              padding: '3px 8px',
              borderRadius: '10px',
            }}
          >
            <Sparkles size={10} /> +14% vs yesterday
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 🖥️ BORDERLESS 3D WORKSPACE SCENE (R3F + DREI)
// -------------------------------------------------------------
const WorkspaceScene: React.FC<{ prefersReducedMotion: boolean }> = ({ prefersReducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.22;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 0.22;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  useFrame((_, delta) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        mouse.current.x * 0.25,
        2.5,
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        -mouse.current.y * 0.12,
        2.5,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} position={[0.9, -0.4, 0]} rotation={[0.16, -0.22, 0]}>
      {/* 💡 CINEMATIC STUDIO LIGHTING */}
      <ambientLight intensity={0.7} color="#1E1B4B" />
      <directionalLight position={[4, 7, 5]} intensity={1.6} color="#F8FAFC" castShadow />
      <pointLight position={[0, 1.5, -1.4]} intensity={3.8} color="#8B5CF6" distance={9} />
      <pointLight position={[-3, 2.2, 2]} intensity={2.0} color="#6366F1" distance={9} />

      {/* Ground Contact Shadows - Merging seamlessly into #0B0E14 */}
      <ContactShadows
        position={[0, -0.75, 0]}
        opacity={0.8}
        scale={12}
        blur={3.0}
        far={5}
        color="#000000"
      />

      {/* -------------------------------------------------------------
          1. PHYSICAL DESK & LEATHER MAT
         ------------------------------------------------------------- */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[7.2, 0.15, 3.3]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#141A25" roughness={0.35} metalness={0.25} />
        </RoundedBox>
        <mesh position={[0, -0.065, 1.65]}>
          <boxGeometry args={[7.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Dark Graphite Desk Pad */}
      <RoundedBox args={[3.6, 0.018, 1.65]} radius={0.03} smoothness={4} position={[-0.1, 0.08, 0.18]}>
        <meshStandardMaterial color="#0C101A" roughness={0.8} metalness={0.05} />
      </RoundedBox>

      {/* Desk Base Legs */}
      <group position={[0, -0.75, 0]}>
        <mesh position={[-3.2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.35]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[3.2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.35]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* -------------------------------------------------------------
          2. MONITOR WITH CRISP LIVE REACT LIFEOS UI DISPLAY
         ------------------------------------------------------------- */}
      <group position={[0.1, 0.92, -0.45]}>
        {/* Metal Base Stand */}
        <RoundedBox args={[0.75, 0.03, 0.4]} radius={0.02} position={[0, -0.78, 0]}>
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.15} />
        </RoundedBox>

        {/* Stand Arm */}
        <mesh position={[0, -0.38, -0.04]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.09, 0.78, 0.09]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.15} />
        </mesh>

        {/* Monitor Chassis Frame */}
        <RoundedBox args={[2.7, 1.55, 0.07]} radius={0.035} smoothness={4}>
          <meshStandardMaterial color="#0B0E14" roughness={0.25} metalness={0.7} />
        </RoundedBox>

        {/* 🖥️ LIVE SHARP REACT LIFEOS UI EMBEDDED ON MONITOR SCREEN */}
        <Html
          transform
          wrapperClass="monitor-screen-html-wrapper"
          position={[0, 0, 0.042]}
          scale={0.37}
          distanceFactor={1.5}
        >
          <MonitorLiveScreenUI />
        </Html>
      </group>

      {/* -------------------------------------------------------------
          3. MECHANICAL KEYBOARD WITH ILLUMINATED VIOLET BACKLIGHT
         ------------------------------------------------------------- */}
      <group position={[-0.1, 0.1, 0.55]}>
        <RoundedBox args={[1.38, 0.042, 0.48]} radius={0.015} smoothness={4}>
          <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.65} />
        </RoundedBox>

        <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.3, 0.42]} />
          <meshBasicMaterial color="#6366F1" />
        </mesh>

        {[-0.15, -0.05, 0.05, 0.15].map((zPos, rowIndex) => (
          <group key={rowIndex} position={[0, 0.032, zPos]}>
            {Array.from({ length: 11 }).map((_, keyIdx) => {
              const xPos = -0.56 + keyIdx * 0.112;
              return (
                <RoundedBox
                  key={keyIdx}
                  args={[0.092, 0.02, 0.082]}
                  radius={0.005}
                  position={[xPos, 0, 0]}
                >
                  <meshStandardMaterial color="#0F172A" roughness={0.5} />
                </RoundedBox>
              );
            })}
          </group>
        ))}

        <RoundedBox args={[0.44, 0.02, 0.082]} radius={0.005} position={[0, 0.032, 0.15]}>
          <meshStandardMaterial color="#6366F1" roughness={0.3} emissive="#6366F1" emissiveIntensity={0.2} />
        </RoundedBox>

        <RoundedBox args={[0.16, 0.02, 0.082]} radius={0.005} position={[0.49, 0.032, 0.05]}>
          <meshStandardMaterial color="#8B5CF6" roughness={0.3} emissive="#8B5CF6" emissiveIntensity={0.2} />
        </RoundedBox>
      </group>

      {/* -------------------------------------------------------------
          4. ERGONOMIC MOUSE
         ------------------------------------------------------------- */}
      <group position={[1.05, 0.11, 0.6]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.135, 16, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.065, -0.04]}>
          <boxGeometry args={[0.01, 0.02, 0.12]} />
          <meshStandardMaterial color="#0B0F19" />
        </mesh>
        <mesh position={[0, 0.075, -0.04]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} />
          <meshStandardMaterial color="#6366F1" emissive="#6366F1" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* -------------------------------------------------------------
          5. DESK LAMP WITH WARM SPOTLIGHT
         ------------------------------------------------------------- */}
      <group position={[1.9, 0.1, -0.3]}>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.19, 0.21, 0.03, 32]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.2} />
        </mesh>

        <mesh position={[-0.05, 0.35, 0]} rotation={[0, 0, -0.28]}>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        <mesh position={[-0.28, 0.82, 0.1]} rotation={[0.35, 0, 0.15]}>
          <cylinderGeometry args={[0.018, 0.018, 0.55, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        <mesh position={[-0.42, 1.02, 0.22]} rotation={[0.45, 0, 0]}>
          <coneGeometry args={[0.15, 0.22, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.2} />
        </mesh>

        <mesh position={[-0.42, 0.94, 0.22]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#FFF8E7" />
        </mesh>

        <spotLight
          position={[-0.42, 0.92, 0.22]}
          intensity={3.2}
          color="#FFF8E7"
          angle={0.55}
          penumbra={0.4}
          distance={4.6}
        />
      </group>

      {/* -------------------------------------------------------------
          6. CERAMIC DESK PLANT & COFFEE MUG
         ------------------------------------------------------------- */}
      <group position={[1.85, 0.25, 0.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.12, 0.3, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.1} />
        </mesh>
        <group position={[0, 0.2, 0]}>
          <mesh position={[0.04, 0.05, 0.02]} rotation={[0.4, 0.2, 0.5]}>
            <coneGeometry args={[0.08, 0.26, 8]} />
            <meshStandardMaterial color="#10B981" roughness={0.6} />
          </mesh>
          <mesh position={[-0.05, 0.08, -0.04]} rotation={[-0.5, 0.3, -0.4]}>
            <coneGeometry args={[0.07, 0.24, 8]} />
            <meshStandardMaterial color="#059669" roughness={0.6} />
          </mesh>
        </group>
      </group>

      <group position={[1.65, 0.2, 0.55]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.26, 24]} />
          <meshStandardMaterial color="#1E293B" roughness={0.25} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.115, 0.115, 0.01, 24]} />
          <meshStandardMaterial color="#2C1A0E" roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};

// -------------------------------------------------------------
// 🌟 MAIN HERO3D COMPONENT
// -------------------------------------------------------------
export const Hero3D: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="hero-3d-wrapper" aria-label="Cinematic 3D LifeOS Workspace Environment">
      <Suspense
        fallback={
          <div className="hero-3d-fallback">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  border: '3px solid rgba(99, 102, 241, 0.2)',
                  borderTopColor: '#6366F1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 14px',
                }}
              />
              <span>Loading 3D Command Center...</span>
            </div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [1.3, 1.4, 4.3], fov: 38 }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          dpr={[1, 2]}
        >
          <WorkspaceScene prefersReducedMotion={prefersReducedMotion} />
        </Canvas>
      </Suspense>
    </div>
  );
};

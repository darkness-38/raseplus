'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, RootState } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';

function GlassShard({ position, rotation, scale, color }: any) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state: RootState) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.002;
            mesh.current.rotation.y += 0.003;
            // Subtle float
            mesh.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.002;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh} position={position} rotation={rotation} scale={scale}>
                <octahedronGeometry args={[1, 0]} />
                <meshPhysicalMaterial
                    roughness={0}
                    transmission={1}
                    thickness={2}
                    ior={1.5}
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.2}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>
        </Float>
    );
}

function FloatingShards() {
    const shards = useMemo(() => {
        return new Array(15).fill(0).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10 - 5
            ],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
            scale: Math.random() * 0.5 + 0.2,
            color: i % 2 === 0 ? '#00ffff' : '#ff00ff' // Cyan and Magenta shards
        }));
    }, []);

    return (
        <group>
            {shards.map((shard, i) => (
                <GlassShard key={i} {...shard} />
            ))}
        </group>
    );
}

export default function BackgroundScene() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: '#02020a' }}>
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <color attach="background" args={['#02020a']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <FloatingShards />

                <EffectComposer>
                    <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                    <ChromaticAberration offset={[new THREE.Vector2(0.002, 0.002)]} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}

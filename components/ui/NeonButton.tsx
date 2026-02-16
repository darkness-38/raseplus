'use client';

import { motion } from 'framer-motion';
import React, { ButtonHTMLAttributes } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export default function NeonButton({ children, ...props }: NeonButtonProps) {
    return (
        <motion.button
            {...props as any}
            className="neon-button"
            whileHover={{ scale: 1.05, rotateX: 5, rotateY: -5 }}
            whileTap={{ scale: 0.95 }}
            style={{
                position: 'relative',
                width: '100%',
                padding: '16px 32px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid #00ffff',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                perspective: '1000px',
                transformStyle: 'preserve-3d'
            }}
        >
            <span style={{ position: 'relative', zIndex: 2, textShadow: '0 0 8px rgba(0, 255, 255, 0.8)' }}>
                {children}
            </span>

            {/* Internal Neon Pulse */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
                    zIndex: 1,
                    opacity: 0
                }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Ripple Effect Container (Simplified as global hover glow for now to save complexity) */}
            <style jsx>{`
                .neon-button:hover {
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.2);
                    border-color: #fff;
                    text-shadow: 0 0 16px rgba(255, 255, 255, 1);
                }
            `}</style>
        </motion.button>
    );
}

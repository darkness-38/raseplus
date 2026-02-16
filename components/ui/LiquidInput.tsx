'use client';

import { motion } from 'framer-motion';
import React, { InputHTMLAttributes } from 'react';

interface LiquidInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export default function LiquidInput({ label, ...props }: LiquidInputProps) {
    return (
        <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div style={{ position: 'relative' }}>
                    <input
                        {...props}
                        className="liquid-input"
                        placeholder=" "
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            fontSize: '16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            outline: 'none',
                            backdropFilter: 'blur(50px)',
                            WebkitBackdropFilter: 'blur(50px)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            zIndex: 2
                        }}
                    />
                    {/* Label Float Logic */}
                    <label
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            pointerEvents: 'none',
                            transition: 'all 0.3s ease',
                            zIndex: 2,
                            fontSize: '16px',
                            fontWeight: 300,
                            letterSpacing: '1px'
                        }}
                        className="liquid-label"
                    >
                        {label}
                    </label>

                    {/* Liquid Glow Border Effect */}
                    <motion.div
                        className="glow-border"
                        style={{
                            position: 'absolute',
                            inset: -2,
                            borderRadius: '14px',
                            background: 'linear-gradient(45deg, #00ffff, #ff00ff, #00ffff)',
                            backgroundSize: '400% 400%',
                            opacity: 0,
                            zIndex: 1,
                            filter: 'blur(8px)'
                        }}
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        transition={{
                            duration: 3,
                            ease: "linear",
                            repeat: Infinity
                        }}
                    />
                </div>
            </motion.div>

            <style jsx>{`
        .liquid-input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(0, 255, 255, 0.5);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }

        .liquid-input:focus + .liquid-label,
        .liquid-input:not(:placeholder-shown) + .liquid-label {
            top: -10px;
            left: 10px;
            font-size: 12px;
            color: #00ffff;
            background: rgba(0,0,0,0.8);
            padding: 0 8px;
            border-radius: 4px;
        }

        .liquid-input:focus ~ .glow-border {
            opacity: 0.6;
        }
      `}</style>
        </div>
    );
}

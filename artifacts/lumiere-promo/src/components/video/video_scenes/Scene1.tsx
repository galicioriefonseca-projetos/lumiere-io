import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" {...sceneTransitions.clipCircle}>
      
      {/* Icon Reveal */}
      <motion.div 
        className="w-32 h-32 mb-8 relative"
        initial={{ scale: 0, opacity: 0, rotate: -30 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0, opacity: 0, rotate: -30 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(232,178,58,0.3)]">
          <img src={`${import.meta.env.BASE_URL}lumiere-icon.png`} alt="Lumière Icon" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {/* Brand Name */}
      <div className="overflow-hidden">
        <motion.h1 
          className="text-7xl font-display text-text-primary tracking-widest uppercase font-light"
          initial={{ y: 100, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Lumière
        </motion.h1>
      </div>

      {/* Tagline */}
      <div className="overflow-hidden mt-6">
        <motion.p 
          className="text-xl font-body text-gold tracking-[0.3em] uppercase"
          initial={{ y: 50, opacity: 0 }}
          animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Gestão de Salão Premium
        </motion.p>
      </div>

    </motion.div>
  );
}

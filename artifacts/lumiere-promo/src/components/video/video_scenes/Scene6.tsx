import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center bg-navy" {...sceneTransitions.clipCircle}>
      
      {/* Central glowing orb */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full mix-blend-screen pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,178,58,0.15) 0%, transparent 60%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Brand Name */}
        <div className="overflow-hidden mb-6">
          <motion.h1 
            className="text-8xl font-display text-white tracking-[0.2em] uppercase font-light"
            initial={{ y: 120, opacity: 0, rotateX: -30 }}
            animate={phase >= 1 ? { y: 0, opacity: 1, rotateX: 0 } : { y: 120, opacity: 0, rotateX: -30 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{ transformPerspective: 1000 }}
          >
            Lumière
          </motion.h1>
        </div>

        {/* Divider line */}
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={phase >= 2 ? { width: '80%', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Tagline */}
        <div className="overflow-hidden">
          <motion.p 
            className="text-2xl font-body text-gold-dim tracking-[0.4em] uppercase"
            initial={{ y: -40, opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: -40, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Gestão de Salão Premium
          </motion.p>
        </div>
        
        {/* Call to action text (decorative) */}
        <motion.div
          className="mt-16 bg-white/5 border border-white/10 px-8 py-3 rounded-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-white font-body tracking-widest uppercase text-sm">Disponível em breve</span>
        </motion.div>
      </div>

    </motion.div>
  );
}

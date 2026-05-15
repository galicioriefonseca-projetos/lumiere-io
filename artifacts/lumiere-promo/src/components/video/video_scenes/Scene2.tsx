import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 4200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-between px-[10vw]" {...sceneTransitions.zoomThrough}>
      
      {/* Left side text */}
      <div className="w-[40vw] flex flex-col items-start z-10">
        <div className="overflow-hidden mb-6">
          <motion.p
            className="text-gold font-body tracking-widest uppercase text-sm font-semibold"
            initial={{ y: 20, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Acesso Exclusivo
          </motion.p>
        </div>
        
        <motion.h2 
          className="text-6xl font-display font-light text-white leading-tight mb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Sua marca,<br/>
          <span className="italic text-gold-dim">sua identidade.</span>
        </motion.h2>
        
        <motion.p
          className="text-xl text-text-secondary font-body font-light max-w-md"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          Uma experiência de login sofisticada que reflete o prestígio do seu salão.
        </motion.p>
      </div>

      {/* Right side Phone Mockup */}
      <motion.div 
        className="w-[28vw] h-[80vh] bg-navy-light rounded-[3rem] border-4 border-border shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 z-10"
        initial={{ y: 100, opacity: 0, rotateY: 20, perspective: 1000 }}
        animate={phase >= 1 ? { y: 0, opacity: 1, rotateY: -10 } : { y: 100, opacity: 0, rotateY: 20 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-border rounded-b-2xl"></div>

        {/* Mockup Content */}
        <motion.div 
          className="flex flex-col items-center w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center mb-12 shadow-lg shadow-gold/20">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 20 L20 80 L80 80" stroke="#060c1a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 40 L40 80" stroke="#060c1a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h3 className="text-3xl font-display text-white tracking-wider uppercase mb-16">Lumière</h3>

          <div className="w-full space-y-6">
            <div className="w-full h-14 border-b border-border/50 flex items-center px-4">
              <div className="w-6 h-6 rounded-full border border-text-muted/50 mr-4"></div>
              <div className="w-32 h-3 bg-text-muted/20 rounded-full"></div>
            </div>
            <div className="w-full h-14 border-b border-border/50 flex items-center px-4">
              <div className="w-6 h-6 rounded-full border border-text-muted/50 mr-4"></div>
              <div className="w-24 h-3 bg-text-muted/20 rounded-full"></div>
            </div>
          </div>

          <motion.div 
            className="w-full h-14 bg-gold rounded-xl mt-12 flex items-center justify-center overflow-hidden relative"
            initial={{ opacity: 0.5 }}
            animate={phase >= 4 ? { opacity: 1 } : { opacity: 0.5 }}
          >
            <span className="text-navy font-body font-bold tracking-widest uppercase text-sm">Entrar</span>
            {phase >= 4 && (
              <motion.div 
                className="absolute inset-0 bg-white/30"
                initial={{ x: '-100%', skewX: -20 }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

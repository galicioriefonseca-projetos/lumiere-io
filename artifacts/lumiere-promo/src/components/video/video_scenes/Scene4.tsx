import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const team = [
    { name: "Sofia Silva", role: "Master Hair Stylist", comm: "45%", delay: 2 },
    { name: "Lucas Costa", role: "Colorista", comm: "40%", delay: 3 },
    { name: "Marina Santos", role: "Nail Designer", comm: "50%", delay: 4 },
  ];

  return (
    <motion.div className="absolute inset-0 flex items-center justify-between px-[10vw]" {...sceneTransitions.slideLeft}>
      
      {/* Left side text */}
      <div className="w-[35vw] flex flex-col items-start z-10">
        <motion.p
          className="text-gold font-body tracking-widest uppercase text-sm font-semibold mb-6"
          initial={{ x: -20, opacity: 0 }}
          animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Gestão de Equipe
        </motion.p>
        
        <motion.h2 
          className="text-6xl font-display font-light text-white leading-tight mb-8"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          Comissões<br/>
          <span className="italic text-gold">sem complicação.</span>
        </motion.h2>
        
        <motion.p
          className="text-xl text-text-secondary font-body font-light max-w-md"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Personalize regras, taxas e divisões automaticamente para cada profissional.
        </motion.p>
      </div>

      {/* Right side App UI Mockup */}
      <div className="w-[45vw] flex flex-col space-y-4 z-10 perspective-[1200px]">
        {team.map((member, idx) => (
          <motion.div 
            key={idx}
            className="w-full bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border/50 flex items-center shadow-2xl"
            initial={{ opacity: 0, x: 100, rotateY: 15 }}
            animate={phase >= member.delay ? { opacity: 1, x: 0, rotateY: -5 } : { opacity: 0, x: 100, rotateY: 15 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
          >
            {/* Avatar placeholder */}
            <div className="w-16 h-16 rounded-full bg-navy border-2 border-gold/30 flex items-center justify-center text-gold font-display text-xl mr-6">
              {member.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-display text-white mb-1">{member.name}</h3>
              <p className="text-text-muted font-body text-sm uppercase tracking-wider">{member.role}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="bg-gold/10 px-4 py-2 rounded-full border border-gold/20 mb-2">
                <span className="text-gold font-body font-bold">{member.comm}</span>
              </div>
              <span className="text-text-muted text-xs font-body">Comissão base</span>
            </div>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}

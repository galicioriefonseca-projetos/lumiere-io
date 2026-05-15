import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000), // Bronze
      setTimeout(() => setPhase(3), 1400), // Silver
      setTimeout(() => setPhase(4), 1800), // Gold
      setTimeout(() => setPhase(5), 2400), // Diamond
      setTimeout(() => setPhase(6), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const badges = [
    { level: "Bronze", icon: "B", color: "from-[#cd7f32] to-[#8c5622]", border: "border-[#cd7f32]/50", text: "text-[#cd7f32]", delay: 2, scale: 0.85, zIndex: 10, y: 40 },
    { level: "Prata", icon: "P", color: "from-[#e0e0e0] to-[#888888]", border: "border-[#e0e0e0]/50", text: "text-[#e0e0e0]", delay: 3, scale: 0.9, zIndex: 20, y: 20 },
    { level: "Ouro", icon: "O", color: "from-[#e8b23a] to-[#c49428]", border: "border-gold", text: "text-gold", delay: 4, scale: 1, zIndex: 30, y: 0 },
    { level: "Diamante", icon: "D", color: "from-[#b9f2ff] to-[#51b5cc]", border: "border-[#b9f2ff]/80", text: "text-[#b9f2ff]", delay: 5, scale: 1.15, zIndex: 40, y: -20 },
  ];

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" {...sceneTransitions.perspectiveFlip}>
      
      {/* Title */}
      <div className="absolute top-[15vh] text-center z-50">
        <motion.p
          className="text-gold font-body tracking-widest uppercase text-sm font-semibold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        >
          Gamificação
        </motion.p>
        <motion.h2 
          className="text-5xl font-display font-light text-white"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          Motive sua equipe a <span className="italic text-gold">brilhar mais.</span>
        </motion.h2>
      </div>

      {/* Badges Stack */}
      <div className="relative mt-20 h-[400px] w-full max-w-4xl flex items-end justify-center">
        {badges.map((badge, idx) => (
          <motion.div
            key={badge.level}
            className={`absolute flex flex-col items-center`}
            style={{ zIndex: badge.zIndex }}
            initial={{ y: 200, opacity: 0, scale: 0.5 }}
            animate={phase >= badge.delay ? { y: badge.y, opacity: 1, scale: badge.scale } : { y: 200, opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${badge.color} border-4 ${badge.border} flex items-center justify-center shadow-2xl shadow-black/50 mb-6 relative overflow-hidden`}>
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                animate={phase >= badge.delay ? { x: ['-100%', '200%'] } : {}}
                transition={{ duration: 2, ease: "easeInOut", delay: badge.delay * 0.4 }}
              />
              <span className="text-4xl font-display font-bold text-navy">{badge.icon}</span>
            </div>
            
            <motion.div 
              className={`bg-card px-6 py-2 rounded-full border ${badge.border}`}
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= badge.delay ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`font-body font-bold tracking-widest uppercase text-sm ${badge.text}`}>{badge.level}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}

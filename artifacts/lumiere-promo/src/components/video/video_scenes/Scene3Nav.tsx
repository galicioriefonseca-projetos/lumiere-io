import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TABS = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'Equipe', icon: '⬡' },
  { label: 'Agenda', icon: '◷' },
  { label: 'Conquistas', icon: '◆' },
  { label: 'Config.', icon: '⊙' },
];

export function Scene3Nav() {
  const [phase, setPhase] = useState(0);
  const [activeTab, setActiveTab] = useState(-1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => { setPhase(3); setActiveTab(0); }, 1400),
      setTimeout(() => setActiveTab(1), 1900),
      setTimeout(() => setActiveTab(2), 2300),
      setTimeout(() => setActiveTab(3), 2700),
      setTimeout(() => setActiveTab(4), 3100),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      exit={{ clipPath: 'inset(0 50% 0 50%)' }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Label */}
      <motion.p
        className="text-[1.6vw] tracking-[0.35em] uppercase mb-[5vh] font-light"
        style={{ color: '#e8b23a', fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Navegação Completa
      </motion.p>

      {/* Phone shell */}
      <motion.div
        className="relative"
        style={{ width: '28vw', maxWidth: 340 }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* Phone body */}
        <div
          className="relative rounded-[3vw] overflow-hidden border-2"
          style={{
            background: '#0b1225',
            borderColor: '#1c2840',
            boxShadow: '0 0 60px rgba(232,178,58,0.08), 0 20px 60px rgba(0,0,0,0.6)',
            paddingBottom: '12vw',
          }}
        >
          {/* Screen content area */}
          <div className="px-[4%] pt-[5%] pb-[2%]" style={{ minHeight: '22vw' }}>
            {/* Mini screen label */}
            <motion.div
              className="text-center mb-[2vw]"
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-[1.5vw] font-semibold" style={{ color: '#f9f7f0', fontFamily: 'var(--font-display)' }}>
                Lumière
              </div>
              <div className="text-[0.9vw] mt-[0.3vw]" style={{ color: '#9d9a8c' }}>
                Gestão de Salão
              </div>
            </motion.div>

            {/* Active tab indicator bar */}
            <motion.div
              className="h-[0.25vw] rounded-full mb-[1.5vw]"
              style={{ background: 'linear-gradient(90deg, #e8b23a, #c49428)' }}
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />

            {/* Placeholder screen content lines */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="rounded-md mb-[0.8vw]"
                style={{
                  height: i === 0 ? '1.5vw' : '0.9vw',
                  background: i === 0 ? 'rgba(232,178,58,0.15)' : 'rgba(255,255,255,0.06)',
                  width: ['55%', '80%', '65%'][i],
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              />
            ))}
          </div>

          {/* Tab bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex border-t"
            style={{ borderColor: '#1c2840', background: '#060c1a', height: '10vw', maxHeight: 90 }}
          >
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <motion.div
                  key={tab.label}
                  className="flex-1 flex flex-col items-center justify-center gap-[0.3vw]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 320, damping: 26 }}
                >
                  <motion.div
                    className="text-[1.8vw] leading-none"
                    animate={{ color: isActive ? '#e8b23a' : '#9d9a8c', scale: isActive ? 1.25 : 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {tab.icon}
                  </motion.div>
                  <motion.span
                    className="text-[0.7vw] font-medium tracking-wide leading-none"
                    animate={{ color: isActive ? '#e8b23a' : '#9d9a8c' }}
                    transition={{ duration: 0.25 }}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-[1.2vw] mt-[3vh] tracking-[0.2em] uppercase"
        style={{ color: '#9d9a8c', fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        5 abas — tudo ao alcance
      </motion.p>
    </motion.div>
  );
}

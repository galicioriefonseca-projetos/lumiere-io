import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '../../../lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2500),
      setTimeout(() => setPhase(6), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const kpis = [
    { label: "Equipe", value: "12", unit: "Profissionais", delay: 2 },
    { label: "Avaliações", value: "4.9", unit: "Média", delay: 3 },
    { label: "Agendamentos", value: "148", unit: "Esta semana", delay: 4 },
    { label: "Faturamento", value: "R$ 42k", unit: "+15% vs mês ant.", delay: 5, highlight: true }
  ];

  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]" {...sceneTransitions.splitHorizontal}>
      
      {/* Header */}
      <div className="w-full mb-16 relative z-10 flex flex-col items-center text-center">
        <motion.p
          className="text-gold font-body tracking-widest uppercase text-sm font-semibold mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Visão Geral
        </motion.p>
        
        <motion.h2 
          className="text-6xl font-display font-light text-white"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          Controle total em <span className="italic text-gold">tempo real</span>
        </motion.h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-6 w-full max-w-6xl z-10">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            className={`rounded-2xl p-8 border border-border/50 relative overflow-hidden ${kpi.highlight ? 'bg-gold/10' : 'bg-card'}`}
            initial={{ y: 50, opacity: 0, rotateX: -20 }}
            animate={phase >= kpi.delay ? { y: 0, opacity: 1, rotateX: 0 } : { y: 50, opacity: 0, rotateX: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ transformPerspective: 1000 }}
          >
            {/* Glossy top border effect */}
            <div className={`absolute top-0 left-0 right-0 h-[1px] ${kpi.highlight ? 'bg-gold' : 'bg-white/10'}`}></div>
            
            <p className="text-text-muted font-body text-sm uppercase tracking-wider mb-6">{kpi.label}</p>
            <h3 className={`text-5xl font-display mb-2 ${kpi.highlight ? 'text-gold' : 'text-white'}`}>{kpi.value}</h3>
            <p className="text-text-secondary font-body text-sm">{kpi.unit}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}

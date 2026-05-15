import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3Nav } from './video_scenes/Scene3Nav';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS: Record<string, number> = {
  splash: 4000,
  login: 4500,
  navigation: 4000,
  dashboard: 6000,
  equipe: 5500,
  conquistas: 5500,
  outro: 4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  splash: Scene1,
  login: Scene2,
  navigation: Scene3Nav,
  dashboard: Scene3,
  equipe: Scene4,
  conquistas: Scene5,
  outro: Scene6,
};

const bgGradients = [
  'radial-gradient(circle at 50% 50%, #132760 0%, #060c1a 70%)',
  'radial-gradient(circle at 80% 20%, #132760 0%, #060c1a 80%)',
  'radial-gradient(circle at 35% 60%, #0b1225 0%, #060c1a 65%)',
  'radial-gradient(circle at 20% 80%, #0b1225 0%, #060c1a 60%)',
  'radial-gradient(circle at 50% 0%, #132760 0%, #060c1a 70%)',
  'radial-gradient(circle at 0% 50%, #e8b23a20 0%, #060c1a 60%)',
  'radial-gradient(circle at 50% 50%, #132760 0%, #060c1a 70%)',
];

const lineLeft   = ['0%',  '10%', '30%', '5%',  '20%', '15%', '0%' ];
const lineWidth  = ['100%','80%', '40%', '90%', '60%', '70%', '100%'];
const lineTop    = ['50%', '15%', '70%', '85%', '20%', '80%', '50%' ];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-navy">
      {/* Persistent Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />

        <motion.div
          className="absolute inset-0"
          animate={{ background: bgGradients[sceneIndex] ?? bgGradients[0] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-3xl mix-blend-screen"
          style={{ background: 'radial-gradient(circle, #e8b23a, transparent)' }}
          animate={{ x: ['-20%', '80%', '10%'], y: ['10%', '60%', '20%'], scale: [1, 1.5, 0.8] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.15] blur-3xl mix-blend-screen right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #e8b23a, transparent)' }}
          animate={{ x: ['20%', '-60%', '5%'], y: ['-10%', '-40%', '30%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Persistent gold accent line */}
        <motion.div
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent"
          animate={{
            left:    lineLeft[sceneIndex]  ?? '0%',
            width:   lineWidth[sceneIndex] ?? '100%',
            top:     lineTop[sceneIndex]   ?? '50%',
            opacity: sceneIndex === 0 || sceneIndex === 6 ? 0 : 0.45,
          }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}

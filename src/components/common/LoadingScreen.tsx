import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
}

/** Dong Son Drum sun rays – 12 petals evenly spaced */
const SUN_RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

/** Lac Bird positions – 4 birds at 45°, 135°, 225°, 315° */
const BIRD_ANGLES = [45, 135, 225, 315];

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-primary-container flex items-center justify-center overflow-hidden"
        >
          {/* Background Texture */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black" />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-lg text-center">
            {/* Dong Son Drum Visual */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-xl">
              {/* Outer Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="transparent"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  className="opacity-10"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="transparent"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 8, ease: 'easeInOut' }}
                />
              </svg>

              {/* Drum SVG */}
              <div className="relative w-4/5 h-4/5 flex items-center justify-center">
                <svg
                  className="w-full h-full text-secondary-container"
                  viewBox="0 0 200 200"
                >
                  {/* Central Sun Symbol (Pulse) */}
                  <motion.g
                    animate={{
                      filter: [
                        'drop-shadow(0 0 5px rgba(254, 214, 91, 0.4))',
                        'drop-shadow(0 0 25px rgba(254, 214, 91, 0.8))',
                        'drop-shadow(0 0 5px rgba(254, 214, 91, 0.4))',
                      ],
                      opacity: [1, 0.85, 1],
                    }}
                    transition={{
                      duration: 4,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                  >
                    <circle cx="100" cy="100" r="18" fill="currentColor" />
                    {SUN_RAYS.map((angle) => (
                      <path
                        key={`ray-${angle}`}
                        d="M100 70 L105 85 L100 90 L95 85 Z"
                        fill="currentColor"
                        transform={`rotate(${angle} 100 100)`}
                      />
                    ))}
                  </motion.g>

                  {/* Lac Birds Ring (Clockwise Rotation) */}
                  <motion.g
                    className="origin-center opacity-80"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 60,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                    style={{ transformOrigin: '100px 100px' }}
                  >
                    {BIRD_ANGLES.map((angle) => (
                      <path
                        key={`bird-${angle}`}
                        d="M100 40 Q105 45 115 45 Q110 50 100 50 L100 40"
                        fill="currentColor"
                        transform={`rotate(${angle} 100 100)`}
                      />
                    ))}
                  </motion.g>

                  {/* Inner Geometric Ring (Counter-clockwise) */}
                  <motion.g
                    className="origin-center opacity-40"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 45,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                    style={{ transformOrigin: '100px 100px' }}
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="65"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="2 4"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="10 5"
                    />
                  </motion.g>
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <motion.div
              className="space-y-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="font-headline-lg text-headline-lg text-secondary-fixed tracking-[0.2em] uppercase">
                VietStage
              </h1>
              <p className="font-body-md text-body-md text-on-primary-container/80 tracking-widest italic">
                Gìn giữ nhịp đập dân tộc...
              </p>
            </motion.div>
          </div>

          {/* Bottom Status Bar */}
          <div className="fixed bottom-xl w-full flex justify-center px-lg z-10">
            <motion.div
              className="flex flex-col items-center gap-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="w-32 h-[1px] bg-secondary-container/20 overflow-hidden">
                <motion.div
                  className="h-full bg-secondary-container"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 8, ease: 'easeInOut' }}
                />
              </div>
              <span className="font-label-sm text-label-sm text-secondary-container/50 uppercase tracking-widest">
                Đang khởi tạo
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;

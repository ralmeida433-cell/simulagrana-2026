import React from 'react';
import { motion } from 'motion/react';

export const AnimatedLogo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  const bars = [
    { x: 140, y: 240, h: 60, fill: "#6EE7B7" },
    { x: 200, y: 200, h: 100, fill: "#34D399" },
    { x: 260, y: 170, h: 130, fill: "#059669" },
    { x: 320, y: 140, h: 160, fill: "#064E3B" },
  ];

  const word1 = "Simula".split('');
  const word2 = "Grana".split('');
  const subtitle = "O SEU FUTURO FINANCEIRO".split('');

  return (
    <motion.svg 
      className={className} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial="hidden"
      animate="visible"
    >
      <defs>
        <filter id="arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="5" floodColor="#047857" floodOpacity="0.45" />
        </filter>
        <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="1.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Circular Background */}
      <motion.circle 
        cx="256" 
        cy="180" 
        r="160" 
        fill="#ECFDF5"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: { 
            scale: 1, 
            opacity: 1,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
          }
        }}
        style={{ originX: "256px", originY: "180px" }}
      />

      {/* Bar Chart */}
      {bars.map((bar, i) => (
        <motion.rect 
          key={i}
          x={bar.x} 
          width="40" 
          rx="4" 
          fill={bar.fill}
          variants={{
            hidden: { y: bar.y + bar.h, height: 0 },
            visible: { 
              y: bar.y, 
              height: bar.h,
              transition: { 
                delay: 0.3 + i * 0.15,
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1]
              }
            }
          }}
        />
      ))}

      {/* Upward Arrow Group with floating animation running continuously */}
      <motion.g 
        filter="url(#arrow-shadow)"
        animate={{
          y: [0, -4, 0],
          x: [0, 4, 0]
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        {/* Main Arrow Line */}
        <motion.path 
          d="M110 250 L220 160 L280 190 L390 60" 
          stroke="#FFFFFF" 
          strokeWidth="20" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { 
              pathLength: 1, 
              opacity: 1,
              transition: { 
                pathLength: { delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { delay: 0.5, duration: 0.2 }
              }
            }
          }}
        />
        {/* Arrow Head */}
        <motion.path 
          d="M340 60 L400 60 L400 120" 
          stroke="#FFFFFF" 
          strokeWidth="20" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { 
              pathLength: 1, 
              opacity: 1,
              transition: { 
                pathLength: { delay: 1.5, duration: 0.4, ease: "easeOut" },
                opacity: { delay: 1.5, duration: 0.1 }
              }
            }
          }}
        />
      </motion.g>

      {/* Main Text */}
      <text x="50%" y="380" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="900" fontSize="72">
        {/* Simula part */}
        {word1.map((char, i) => (
          <motion.tspan 
            key={`w1-${i}`}
            fill="#064E3B"
            variants={{
              hidden: { opacity: 0, y: 10, filter: "drop-shadow(0px 0px 0px rgba(16,185,129,0))" },
              visible: { 
                opacity: 1, 
                y: 0,
                filter: [
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))", 
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))", 
                  "drop-shadow(0px 0px 10px rgba(16,185,129,0.8))", 
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))"
                ],
                transition: { 
                  opacity: { delay: 1.8 + i * 0.08, duration: 0.4, ease: "easeOut" },
                  y: { delay: 1.8 + i * 0.08, duration: 0.4, ease: "easeOut" },
                  filter: { 
                    delay: 2.6 + i * 0.08,
                    duration: 0.6,
                    times: [0, 0.1, 0.5, 1],
                    ease: "easeInOut"
                  }
                }
              }
            }}
          >
            {char}
          </motion.tspan>
        ))}
        {/* Grana part */}
        {word2.map((char, i) => (
          <motion.tspan 
            key={`w2-${i}`}
            fill="#10B981"
            variants={{
              hidden: { opacity: 0, y: 10, filter: "drop-shadow(0px 0px 0px rgba(16,185,129,0))" },
              visible: { 
                opacity: 1, 
                y: 0,
                filter: [
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))", 
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))", 
                  "drop-shadow(0px 0px 12px rgba(16,185,129,0.9))", 
                  "drop-shadow(0px 0px 0px rgba(16,185,129,0))"
                ],
                transition: { 
                  opacity: { delay: 1.8 + (word1.length * 0.08) + i * 0.08, duration: 0.4, ease: "easeOut" },
                  y: { delay: 1.8 + (word1.length * 0.08) + i * 0.08, duration: 0.4, ease: "easeOut" },
                  filter: { 
                    delay: 3.1 + i * 0.08,
                    duration: 0.6,
                    times: [0, 0.1, 0.5, 1],
                    ease: "easeInOut"
                  }
                }
              }
            }}
          >
            {char}
          </motion.tspan>
        ))}
      </text>

      {/* Subtitle */}
      <text x="50%" y="430" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="600" fontSize="20" fill="#374151" letterSpacing="4">
        {subtitle.map((char, i) => {
          // Keep spaces empty or render space
          if (char === ' ') return <tspan key={`sub-${i}`}> </tspan>;
          return (
            <motion.tspan 
              key={`sub-${i}`}
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    delay: 2.6 + i * 0.02,
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }
              }}
            >
              {char}
            </motion.tspan>
          );
        })}
      </text>
    </motion.svg>
  );
};

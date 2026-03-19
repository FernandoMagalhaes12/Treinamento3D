import React from 'react';

const GameOverOverlay = () => {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-yellow-300" style={{ opacity: 0, animation: 'flash1 0.15s ease-in-out infinite' }} />
      <div className="absolute inset-0 bg-white" style={{ opacity: 0, animation: 'flash2 0.1s ease-in-out infinite' }} />
      <div className="absolute inset-0 bg-yellow-400" style={{ opacity: 0, animation: 'flash3 0.2s ease-in-out infinite' }} />

      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <filter id="lightningGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="boltGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FFFFAA" />
            <stop offset="70%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>

        <path d="M150,0 L130,80 L170,80 L120,200 L160,160 L140,160 L200,300 L180,240 L200,240 L160,400" stroke="url(#boltGradient)" strokeWidth="12" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.08s ease-in-out infinite alternate', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M350,0 L380,60 L340,60 L390,150 L360,130 L380,130 L320,250 L350,200 L330,200 L380,400" stroke="url(#boltGradient)" strokeWidth="10" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.12s ease-in-out infinite alternate-reverse', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M550,0 L520,100 L560,100 L510,220 L550,180 L530,180 L590,320 L560,260 L580,260 L540,400" stroke="url(#boltGradient)" strokeWidth="11" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.1s ease-in-out infinite alternate', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M750,0 L780,70 L720,70 L790,180 L760,150 L780,150 L710,280 L740,230 L720,230 L780,400" stroke="url(#boltGradient)" strokeWidth="12" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.08s ease-in-out infinite alternate-reverse', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M950,0 L920,90 L980,90 L910,210 L950,170 L930,170 L990,310 L960,250 L980,250 L940,400" stroke="url(#boltGradient)" strokeWidth="11" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.1s ease-in-out infinite alternate', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M1150,0 L1180,60 L1100,60 L1190,170 L1160,140 L1180,140 L1120,270 L1150,220 L1130,220 L1180,400" stroke="url(#boltGradient)" strokeWidth="13" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.07s ease-in-out infinite alternate-reverse', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M1350,0 L1320,80 L1380,80 L1310,200 L1350,160 L1330,160 L1390,290 L1360,240 L1380,240 L1340,400" stroke="url(#boltGradient)" strokeWidth="12" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.09s ease-in-out infinite alternate', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M1550,0 L1580,50 L1500,50 L1590,160 L1560,130 L1580,130 L1520,260 L1550,210 L1530,210 L1580,400" stroke="url(#boltGradient)" strokeWidth="14" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.05s ease-in-out infinite alternate-reverse', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <path d="M170,80 L200,120 L185,120 L220,180" stroke="#FFFFFF" strokeWidth="4" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.15s ease-in-out infinite alternate' }} />
        <path d="M380,130 L410,170 L395,170 L430,230" stroke="#FFFFAA" strokeWidth="3" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.18s ease-in-out infinite alternate-reverse' }} />
        <path d="M730,150 L760,190 L745,190 L780,250" stroke="#FFFFFF" strokeWidth="3" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.16s ease-in-out infinite alternate' }} />
        <path d="M860,210 L890,260 L875,260 L910,320" stroke="#FFFFAA" strokeWidth="3" fill="none" filter="url(#lightningGlow)" style={{ animation: 'boltFlash 0.14s ease-in-out infinite alternate-reverse' }} />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/85 px-16 py-10 rounded-3xl border-6 border-red-600" style={{ animation: 'textPulse 0.3s ease-in-out infinite alternate', boxShadow: '0 0 50px #FF0000, 0 0 100px #FF0000, inset 0 0 30px #330000' }}>
          <h1 className="text-7xl font-black text-red-600 text-center" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '0 0 30px #FF0000, 0 0 60px #FF0000, 0 0 90px #FF0000, 4px 4px 0 #8B0000', letterSpacing: '8px', WebkitTextStroke: '2px white', color: '#FF0000' }}>
            GAME OVER
          </h1>
          <p className="text-yellow-300 text-center mt-6 text-2xl font-bold" style={{ textShadow: '0 0 20px #FFFF00, 0 0 40px #FFD700', letterSpacing: '4px' }}>
            CHOQUE ELETRICO
          </p>
        </div>
      </div>

      <style>{`
        @keyframes flash1 {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
        @keyframes flash2 {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.35; }
        }
        @keyframes flash3 {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.5; }
        }
        @keyframes boltFlash {
          0% {
            opacity: 0.7;
            transform: translateX(-3px) scaleX(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(3px) scaleX(1.05);
          }
        }
        @keyframes textPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default GameOverOverlay;

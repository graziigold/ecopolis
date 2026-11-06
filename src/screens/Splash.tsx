import { useEffect } from 'react';
import EcoLogo from '../components/EcoLogo';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  useEffect(() => {
    const t = setTimeout(onFinish, 2800);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div
      className="h-full flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ background: 'linear-gradient(160deg, #f4f8f4 0%, #e8f5e9 100%)' }}
      onClick={onFinish}
    >
      {/* Subtle ring behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(45,122,58,0.08) 0%, transparent 70%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="flex flex-col items-center animate-splash-in">
        <EcoLogo width={240} />
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-16 flex flex-col items-center gap-3">
        <div className="w-24 h-0.5 bg-eco-200 rounded-full overflow-hidden">
          <div className="h-full bg-eco-600 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
}

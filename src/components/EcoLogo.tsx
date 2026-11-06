import logoSrc from '../assets/logo-ecopolis.png';

/* Só o símbolo: recorta a parte circular da logo */
export function LogoMark({ size = 40 }: { size?: number }) {
  // Original image: 1456×816. Symbol center ≈ 50% x, 34% y.
  const imgW = size * 2.65;
  const imgH = imgW * (816 / 1456);
  const left = size / 2 - imgW * 0.5;
  const top = size / 2 - imgH * 0.34;

  return (
    <div style={{ width: size, height: size, overflow: 'hidden', borderRadius: size * 0.22, position: 'relative', flexShrink: 0 }}>
      <img
        src={logoSrc}
        style={{ position: 'absolute', width: imgW, height: 'auto', left, top }}
        alt="Ecópolis"
        draggable={false}
      />
    </div>
  );
}

/* Logo completa sem o slogan: símbolo + nome "ECÓPOLIS" */
export default function EcoLogo({ width = 160 }: { width?: number }) {
  // Hide bottom ~14% where the slogan lives
  const fullH = width * (816 / 1456);
  const visibleH = fullH * 0.86;

  return (
    <div style={{ width, height: visibleH, overflow: 'hidden', flexShrink: 0 }}>
      <img
        src={logoSrc}
        style={{ width, height: 'auto', display: 'block' }}
        alt="Ecópolis"
        draggable={false}
      />
    </div>
  );
}

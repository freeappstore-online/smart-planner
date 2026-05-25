export interface VisualCard {
  id: string
  title: string
  caption: string
  accent: string
  src: string
}

interface VisualTone {
  primary: string
  secondary: string
  glow: string
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createVisualArt(title: string, caption: string, tone: VisualTone): string {
  const glowColor = tone.glow.replace('#', '')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${tone.primary}"/>
          <stop offset="55%" stop-color="#1a1328"/>
          <stop offset="100%" stop-color="${tone.secondary}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="${tone.glow}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="${tone.glow}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="56" fill="url(#bg)"/>
      <rect width="1200" height="900" rx="56" fill="url(#glow)"/>
      <circle cx="220" cy="170" r="120" fill="#ffffff" opacity="0.08"/>
      <circle cx="980" cy="150" r="160" fill="#ffffff" opacity="0.07"/>
      <circle cx="1020" cy="700" r="200" fill="#ffffff" opacity="0.05"/>
      <rect x="110" y="120" width="620" height="560" rx="40" fill="url(#panel)" stroke="#ffffff" stroke-opacity="0.12"/>
      <rect x="170" y="190" width="520" height="24" rx="12" fill="#ffffff" opacity="0.5"/>
      <rect x="170" y="240" width="410" height="18" rx="9" fill="#ffffff" opacity="0.28"/>
      <rect x="170" y="278" width="460" height="18" rx="9" fill="#ffffff" opacity="0.18"/>
      <rect x="170" y="330" width="470" height="180" rx="32" fill="#ffffff" opacity="0.12"/>
      <path d="M190 470C240 400 290 390 340 430C390 470 445 490 520 446C575 414 620 352 660 320" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M190 520C250 500 315 530 372 556C430 582 495 600 626 548" fill="none" stroke="#${glowColor}" stroke-opacity="0.55" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="140" y="710" width="260" height="110" rx="28" fill="#ffffff" opacity="0.12"/>
      <rect x="430" y="710" width="260" height="110" rx="28" fill="#ffffff" opacity="0.08"/>
      <rect x="720" y="710" width="380" height="110" rx="28" fill="#ffffff" opacity="0.1"/>
      <text x="150" y="784" fill="#ffffff" font-size="48" font-family="ui-serif, Georgia, serif" font-weight="800">${title}</text>
      <text x="150" y="822" fill="#ffffff" fill-opacity="0.72" font-size="24" font-family="ui-sans-serif, system-ui, sans-serif">${caption}</text>
      <rect x="790" y="170" width="260" height="320" rx="36" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.14"/>
      <rect x="845" y="230" width="150" height="150" rx="36" fill="#ffffff" fill-opacity="0.15"/>
      <circle cx="920" cy="305" r="58" fill="none" stroke="#ffffff" stroke-width="10" stroke-opacity="0.55" stroke-dasharray="250 40"/>
      <rect x="835" y="420" width="170" height="16" rx="8" fill="#ffffff" opacity="0.4"/>
      <rect x="835" y="450" width="220" height="16" rx="8" fill="#ffffff" opacity="0.22"/>
    </svg>
  `

  return svgDataUri(svg)
}

export const visualLibrary: VisualCard[] = [
  {
    id: 'workspace',
    title: 'Workspace Flow',
    caption: 'A focus room for plans and priorities',
    accent: '#7c3aed',
    src: createVisualArt('Workspace Flow', 'A focus room for plans and priorities', {
      primary: '#24123d',
      secondary: '#0d1020',
      glow: '#8b5cf6',
    }),
  },
  {
    id: 'planning',
    title: 'Planning Ritual',
    caption: 'Elegant weekly structure',
    accent: '#a855f7',
    src: createVisualArt('Planning Ritual', 'Elegant weekly structure', {
      primary: '#2a183e',
      secondary: '#11131f',
      glow: '#c084fc',
    }),
  },
  {
    id: 'interiors',
    title: 'Calm Interiors',
    caption: 'Soft light and premium materials',
    accent: '#d946ef',
    src: createVisualArt('Calm Interiors', 'Soft light and premium materials', {
      primary: '#271735',
      secondary: '#1a1324',
      glow: '#f472b6',
    }),
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle Balance',
    caption: 'Quiet momentum for daily routines',
    accent: '#7c3aed',
    src: createVisualArt('Lifestyle Balance', 'Quiet momentum for daily routines', {
      primary: '#221735',
      secondary: '#10131f',
      glow: '#7c3aed',
    }),
  },
]

export function visualById(id: string) {
  return visualLibrary.find((visual) => visual.id === id) ?? visualLibrary[0]
}
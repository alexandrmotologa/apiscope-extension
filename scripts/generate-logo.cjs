const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

/**
 * APIScope Logo — The Scope Hawk
 *
 * A low-poly origami hawk with a radar-lens eye,
 * symbolizing vigilant observation of API network traffic.
 * The hawk's gaze scans every request like a raptor hunting from altitude.
 */
function buildLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="slate-body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0b0f19"/>
    </linearGradient>

    <linearGradient id="light-facet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <linearGradient id="dark-facet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <linearGradient id="amber-accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>

    <linearGradient id="wing-gradient-left" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <linearGradient id="wing-gradient-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f5ff" stop-opacity="1"/>
      <stop offset="60%" stop-color="#00f5ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>

    <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.12" />
    </filter>

    <filter id="eye-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Hexagonal Architectural Gateway -->
      <polygon points="
        0,-390
        338,-195
        338,195
        0,390
        -338,195
        -338,-195
      " fill="none" stroke="#0f172a" stroke-width="40" stroke-linejoin="round" />

      <polygon points="
        0,-355
        307,-177
        307,177
        0,355
        -307,177
        -307,-177
      " fill="none" stroke="#00f5ff" stroke-width="4" opacity="0.4" stroke-dasharray="16, 12" />

      <!-- === SCOPE HAWK MASCOT === -->

      <!-- Solid base silhouette (Zero-Leak Rule) -->
      <path d="
        M 0,-280
        L 80,-240
        L 160,-200
        L 240,-100
        L 290,-20
        L 300,40
        L 280,100
        L 240,160
        L 200,200
        L 160,220
        L 100,260
        L 60,280
        L 30,290
        L 0,300
        L -30,290
        L -60,280
        L -100,260
        L -160,220
        L -200,200
        L -240,160
        L -280,100
        L -300,40
        L -290,-20
        L -240,-100
        L -160,-200
        L -80,-240
        Z
      " fill="#0f172a" />

      <!-- Left wing - dark facets -->
      <polygon points="-30,-220 -80,-240 -160,-200 -120,-140" fill="url(#dark-facet)" />
      <polygon points="-120,-140 -160,-200 -240,-100 -200,-60" fill="#0f172a" />
      <polygon points="-200,-60 -240,-100 -290,-20 -260,20" fill="url(#wing-gradient-left)" />
      <polygon points="-260,20 -290,-20 -300,40 -270,80" fill="#1e293b" />
      <polygon points="-270,80 -300,40 -280,100 -240,120" fill="#0f172a" />
      <polygon points="-240,120 -280,100 -240,160 -200,150" fill="url(#dark-facet)" />

      <!-- Right wing - lighter facets -->
      <polygon points="30,-220 80,-240 160,-200 120,-140" fill="url(#light-facet)" />
      <polygon points="120,-140 160,-200 240,-100 200,-60" fill="#1e293b" />
      <polygon points="200,-60 240,-100 290,-20 260,20" fill="url(#wing-gradient-right)" />
      <polygon points="260,20 290,-20 300,40 270,80" fill="#334155" />
      <polygon points="270,80 300,40 280,100 240,120" fill="#1e293b" />
      <polygon points="240,120 280,100 240,160 200,150" fill="url(#light-facet)" />

      <!-- Tail feathers -->
      <polygon points="-100,260 -160,220 -200,200 -140,250" fill="#0f172a" />
      <polygon points="-60,280 -100,260 -140,250 -80,270" fill="#1e293b" />
      <polygon points="100,260 160,220 200,200 140,250" fill="#1e293b" />
      <polygon points="60,280 100,260 140,250 80,270" fill="#0f172a" />
      <polygon points="-30,290 -60,280 -80,270 0,300 80,270 60,280 30,290" fill="#334155" />

      <!-- Head crown - upper facets -->
      <polygon points="0,-280 -30,-220 0,-200 30,-220" fill="#475569" />
      <polygon points="0,-200 -30,-220 -60,-180 -20,-160" fill="#334155" />
      <polygon points="0,-200 30,-220 60,-180 20,-160" fill="#475569" />

      <!-- Face structure - zygomatic cheekbones -->
      <polygon points="-20,-160 -60,-180 -120,-140 -90,-100" fill="#1e293b" />
      <polygon points="20,-160 60,-180 120,-140 90,-100" fill="#334155" />

      <!-- Brow ridge -->
      <polygon points="-20,-160 -90,-100 -40,-100 0,-130 40,-100 90,-100 20,-160" fill="#475569" />

      <!-- Mid-face / eye sockets -->
      <polygon points="-90,-100 -120,-140 -140,-80 -100,-60" fill="#0f172a" />
      <polygon points="90,-100 120,-140 140,-80 100,-60" fill="#1e293b" />

      <!-- Cheek facets -->
      <polygon points="-100,-60 -140,-80 -200,-60 -160,-20" fill="#1e293b" />
      <polygon points="100,-60 140,-80 200,-60 160,-20" fill="#334155" />

      <!-- Chest / torso facets -->
      <polygon points="-40,-100 -90,-100 -100,-60 -60,-30" fill="#1e293b" />
      <polygon points="40,-100 90,-100 100,-60 60,-30" fill="#334155" />
      <polygon points="0,-130 -40,-100 -60,-30 0,-10 60,-30 40,-100" fill="url(#light-facet)" />

      <!-- Lower chest -->
      <polygon points="-60,-30 -100,-60 -160,-20 -120,40" fill="#0f172a" />
      <polygon points="60,-30 100,-60 160,-20 120,40" fill="#1e293b" />
      <polygon points="0,-10 -60,-30 -120,40 0,80 120,40 60,-30" fill="#334155" />

      <!-- Belly facets -->
      <polygon points="-120,40 -160,-20 -260,20 -200,80" fill="#0f172a" />
      <polygon points="120,40 160,-20 260,20 200,80" fill="#1e293b" />
      <polygon points="-120,40 -200,80 -140,140 0,120" fill="#1e293b" />
      <polygon points="120,40 200,80 140,140 0,120" fill="#334155" />
      <polygon points="0,80 -120,40 0,120 120,40" fill="#475569" />

      <!-- Lower body -->
      <polygon points="-200,80 -270,80 -240,120 -180,130" fill="#0f172a" />
      <polygon points="200,80 270,80 240,120 180,130" fill="#1e293b" />
      <polygon points="-140,140 -180,130 -240,120 -200,150" fill="#1e293b" />
      <polygon points="140,140 180,130 240,120 200,150" fill="#334155" />
      <polygon points="0,120 -140,140 -100,200 0,180 100,200 140,140" fill="#1e293b" />

      <!-- Beak - sharp geometric -->
      <polygon points="0,-130 -12,-80 0,-40 12,-80" fill="url(#amber-accent)" />
      <polygon points="-12,-80 0,-40 -8,-70" fill="#ea580c" opacity="0.6" />
      <polygon points="12,-80 0,-40 8,-70" fill="#fbbf24" opacity="0.5" />

      <!-- === RADAR EYE — The Scope === -->

      <!-- Eye glow aura (left) -->
      <circle cx="-65" cy="-105" r="30" fill="url(#eye-glow)" filter="url(#eye-blur)" opacity="0.5" />

      <!-- Eye glow aura (right) -->
      <circle cx="65" cy="-105" r="30" fill="url(#eye-glow)" filter="url(#eye-blur)" opacity="0.5" />

      <!-- Left eye - almond with predatory cant -->
      <path d="M -90,-110 Q -65,-130 -40,-110 Q -65,-90 -90,-110 Z" fill="#0b0f19" />
      <ellipse cx="-65" cy="-108" rx="12" ry="10" fill="url(#cyan-glow)" />
      <ellipse cx="-65" cy="-108" rx="5" ry="8" fill="#0b0f19" />
      <circle cx="-62" cy="-112" r="3" fill="#ffffff" opacity="0.9" />

      <!-- Right eye - almond with predatory cant -->
      <path d="M 40,-110 Q 65,-130 90,-110 Q 65,-90 40,-110 Z" fill="#0b0f19" />
      <ellipse cx="65" cy="-108" rx="12" ry="10" fill="url(#cyan-glow)" />
      <ellipse cx="65" cy="-108" rx="5" ry="8" fill="#0b0f19" />
      <circle cx="68" cy="-112" r="3" fill="#ffffff" opacity="0.9" />

      <!-- Radar scope rings around left eye -->
      <circle cx="-65" cy="-108" r="20" fill="none" stroke="#00f5ff" stroke-width="1.5" opacity="0.3" />
      <circle cx="-65" cy="-108" r="28" fill="none" stroke="#00f5ff" stroke-width="1" opacity="0.15" />

      <!-- Radar scope rings around right eye -->
      <circle cx="65" cy="-108" r="20" fill="none" stroke="#00f5ff" stroke-width="1.5" opacity="0.3" />
      <circle cx="65" cy="-108" r="28" fill="none" stroke="#00f5ff" stroke-width="1" opacity="0.15" />

      <!-- Crosshair scope line (vertical) through each eye -->
      <line x1="-65" y1="-130" x2="-65" y2="-86" stroke="#00f5ff" stroke-width="0.8" opacity="0.25" />
      <line x1="65" y1="-130" x2="65" y2="-86" stroke="#00f5ff" stroke-width="0.8" opacity="0.25" />

      <!-- Crosshair scope line (horizontal) -->
      <line x1="-88" y1="-108" x2="-42" y2="-108" stroke="#00f5ff" stroke-width="0.8" opacity="0.25" />
      <line x1="42" y1="-108" x2="88" y2="-108" stroke="#00f5ff" stroke-width="0.8" opacity="0.25" />

      <!-- Subtle accent lines on wing edges -->
      <line x1="-240" y1="-100" x2="-300" y2="40" stroke="#00f5ff" stroke-width="2" opacity="0.15" />
      <line x1="240" y1="-100" x2="300" y2="40" stroke="#00f5ff" stroke-width="2" opacity="0.15" />

    </g>
  </g>
</svg>`;
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'docs', 'images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svg = buildLogoSvg();
  const svgPath = path.join(outputDir, 'logo.svg');
  const pngPath = path.join(outputDir, 'logo.png');

  fs.writeFileSync(svgPath, svg);
  console.log('✓ Written logo.svg');

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(pngPath, pngData);
  console.log(`✓ Rendered logo.png (${Math.round(pngData.length / 1024)} KB) at 1024x1024`);
}

main().catch(err => { console.error(err); process.exit(1); });

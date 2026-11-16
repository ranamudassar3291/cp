import React, { useMemo, useState } from 'react';

interface MapMarkerPin {
  id: string;
  label: string;
  x: number;
  y: number;
}

const WORLD_MARKERS: MapMarkerPin[] = [
  { id: 'us-west', label: 'Oregon, USA', x: 165, y: 158 },
  { id: 'us-central', label: 'Dallas, USA', x: 222, y: 185 },
  { id: 'ca-north', label: 'Toronto, Canada', x: 256, y: 138 },
  { id: 'us-east', label: 'New York, USA', x: 285, y: 166 },
  { id: 'us-va', label: 'Virginia, USA', x: 268, y: 184 },
  { id: 'br-sp', label: 'São Paulo, Brazil', x: 332, y: 318 },
  { id: 'uk-lon', label: 'London, UK', x: 468, y: 138 },
  { id: 'ie-dub', label: 'Dublin, Ireland', x: 452, y: 134 },
  { id: 'eu-ams', label: 'Amsterdam, NL', x: 492, y: 136 },
  { id: 'eu-fra', label: 'Frankfurt, Germany', x: 505, y: 148 },
  { id: 'eu-par', label: 'Paris, France', x: 480, y: 154 },
  { id: 'eu-sto', label: 'Stockholm, Sweden', x: 526, y: 108 },
  { id: 'eu-zur', label: 'Zurich, Switzerland', x: 500, y: 164 },
  { id: 'me-dxb', label: 'Dubai, UAE', x: 608, y: 214 },
  { id: 'in-bom', label: 'Mumbai, India', x: 662, y: 234 },
  { id: 'in-del', label: 'Delhi, India', x: 676, y: 204 },
  { id: 'sg-sin', label: 'Singapore', x: 742, y: 278 },
  { id: 'hk-hkg', label: 'Hong Kong', x: 774, y: 222 },
  { id: 'jp-tyo', label: 'Tokyo, Japan', x: 836, y: 172 },
  { id: 'kr-icn', label: 'Seoul, Korea', x: 810, y: 168 },
  { id: 'au-mel', label: 'Melbourne, AU', x: 822, y: 368 },
  { id: 'au-syd', label: 'Sydney, Australia', x: 850, y: 356 },
];

const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  [
    [72, 82],
    [130, 62],
    [220, 56],
    [300, 72],
    [328, 96],
    [282, 136],
    [308, 152],
    [284, 184],
    [245, 208],
    [222, 224],
    [194, 240],
    [172, 222],
    [146, 186],
    [118, 146],
    [82, 114],
  ],
  [
    [320, 32],
    [388, 26],
    [398, 66],
    [348, 86],
    [314, 64],
  ],
  [
    [238, 250],
    [294, 248],
    [346, 280],
    [362, 318],
    [332, 376],
    [294, 424],
    [268, 428],
    [258, 372],
    [242, 310],
    [226, 276],
  ],
  [
    [446, 116],
    [474, 112],
    [478, 146],
    [448, 148],
  ],
  [
    [478, 86],
    [548, 72],
    [594, 100],
    [584, 156],
    [542, 168],
    [496, 164],
    [468, 152],
    [476, 118],
  ],
  [
    [462, 182],
    [554, 180],
    [602, 218],
    [612, 262],
    [582, 320],
    [550, 382],
    [514, 386],
    [490, 330],
    [478, 272],
    [440, 242],
    [442, 208],
  ],
  [
    [586, 84],
    [746, 66],
    [868, 92],
    [914, 126],
    [872, 166],
    [818, 192],
    [792, 232],
    [758, 264],
    [722, 248],
    [692, 276],
    [664, 254],
    [636, 224],
    [594, 212],
    [584, 158],
  ],
  [
    [736, 276],
    [768, 274],
    [780, 304],
    [744, 308],
  ],
  [
    [796, 286],
    [838, 284],
    [844, 308],
    [800, 310],
  ],
  [
    [832, 144],
    [856, 138],
    [862, 184],
    [836, 190],
  ],
  [
    [774, 322],
    [864, 316],
    [892, 360],
    [864, 408],
    [798, 404],
    [766, 364],
  ],
];

function pointInPolygon(x: number, y: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const InfrastructureSection: React.FC = () => {
  const [hoveredPinLabel, setHoveredPinLabel] = useState<string | null>(null);

  const worldDots = useMemo(() => {
    const dots: Array<{ cx: number; cy: number }> = [];
    const stepX = 10;
    const stepY = 9;
    for (let y = 24; y <= 432; y += stepY) {
      for (let x = 60; x <= 930; x += stepX) {
        if (CONTINENT_POLYGONS.some((poly) => pointInPolygon(x, y, poly))) {
          dots.push({ cx: x, cy: y });
        }
      }
    }
    return dots;
  }, []);

  return (
    <section
      id="infrastructure"
      className="bg-white py-16 lg:py-20 border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A]"
            style={{ textWrap: 'balance' }}
          >
            Worldwide Data Center Locations
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Experience rapid speeds from our international data centres and CDN
            nodes, regardless of your traffic&rsquo;s origin. CP Cloud Hosting
            Cloud, AWS &amp; Google Cloud.
          </p>
        </div>

        {/* High-End Dotted World Map with Teal Location Marker Pins */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative w-full aspect-[1000/450]">
            <svg
              viewBox="0 0 1000 450"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Dotted world map showing CP Cloud Hosting global datacentre pins"
            >
              <g fill="#475569" fillOpacity="0.68">
                {worldDots.map((dot) => (
                  <circle
                    key={`${dot.cx}-${dot.cy}`}
                    cx={dot.cx}
                    cy={dot.cy}
                    r="1.9"
                  />
                ))}
              </g>

              {WORLD_MARKERS.map((pin) => (
                <g
                  key={pin.id}
                  transform={`translate(${pin.x}, ${pin.y})`}
                  onMouseEnter={() => setHoveredPinLabel(pin.label)}
                  onMouseLeave={() => setHoveredPinLabel(null)}
                  className="cursor-pointer"
                >
                  <path
                    d="M0 0C-5.5 -6.8 -9.5 -12.4 -9.5 -17.5C-9.5 -22.7467 -5.2467 -27 0 -27C5.2467 -27 9.5 -22.7467 9.5 -17.5C9.5 -12.4 5.5 -6.8 0 0Z"
                    fill="#0E6B63"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="-17.5" r="3.8" fill="#FFFFFF" />
                </g>
              ))}
            </svg>

            {hoveredPinLabel && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F172A] text-white text-xs font-semibold absolute top-2 right-2 shadow-md pointer-events-none">
                <span>{hoveredPinLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

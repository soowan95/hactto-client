import { useState } from 'react';
import southKoreaMap from '@svg-maps/south-korea';
import './SouthKoreaMap.css';

interface SouthKoreaMapProps {
  onLocationClick?: (id: string, name: string) => void;
  selectedRegionId?: string | null;
}

const regionNameMap: Record<string, string> = {
  Seoul: '서울',
  Busan: '부산',
  Daegu: '대구',
  Incheon: '인천',
  Gwangju: '광주',
  Daejeon: '대전',
  Ulsan: '울산',
  Sejong: '세종',
  Gyeonggi: '경기',
  Gangwon: '강원',
  'North Chungcheong': '충청북도',
  'South Chungcheong': '충청남도',
  'North Jeolla': '전라북도',
  'South Jeolla': '전라남도',
  'North Gyeongsang': '경상북도',
  'South Gyeongsang': '경상남도',
  Jeju: '제주',
};

export function SouthKoreaMap({
  onLocationClick,
  selectedRegionId,
}: SouthKoreaMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  return (
    <div
      className="map-container"
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <svg
        viewBox={southKoreaMap.viewBox}
        className="korea-svg-map"
        style={{ width: '100%', height: 'auto', maxHeight: '100%' }}
      >
        {southKoreaMap.locations.map((location: any) => (
          <path
            key={location.id}
            id={location.id}
            name={location.name}
            d={location.path}
            className={`map-path ${hoveredLocation === location.id || selectedRegionId === location.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredLocation(location.id)}
            onMouseLeave={() => setHoveredLocation(null)}
            onClick={() => onLocationClick?.(location.id, location.name)}
            style={{
              cursor: 'pointer',
              transition: 'fill 0.3s ease, transform 0.3s ease',
              stroke: 'var(--bg-main)',
              strokeWidth: 1.5,
              fill:
                hoveredLocation === location.id ||
                selectedRegionId === location.id
                  ? 'var(--primary-cyan)'
                  : 'var(--glass-bg)',
            }}
          >
            <title>{regionNameMap[location.name] || location.name}</title>
          </path>
        ))}
      </svg>
      {hoveredLocation && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            pointerEvents: 'none',
            fontSize: '14px',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--primary-cyan)',
            transition: 'opacity 0.2s ease',
          }}
        >
          {regionNameMap[
            southKoreaMap.locations.find(
              (loc: any) => loc.id === hoveredLocation,
            )?.name || ''
          ] ||
            southKoreaMap.locations.find(
              (loc: any) => loc.id === hoveredLocation,
            )?.name}
        </div>
      )}
    </div>
  );
}

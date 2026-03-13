import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function TodayIcon({ color, size = 24 }: Props) {
  const rays = [
    // 0° 상
    { x1: 12, y1: 4, x2: 12, y2: 1.5 },
    // 45° 우상
    { x1: 17.3, y1: 6.7, x2: 19.1, y2: 4.9 },
    // 90° 우
    { x1: 20, y1: 12, x2: 22.5, y2: 12 },
    // 135° 우하
    { x1: 17.3, y1: 17.3, x2: 19.1, y2: 19.1 },
    // 180° 하
    { x1: 12, y1: 20, x2: 12, y2: 22.5 },
    // 225° 좌하
    { x1: 6.7, y1: 17.3, x2: 4.9, y2: 19.1 },
    // 270° 좌
    { x1: 4, y1: 12, x2: 1.5, y2: 12 },
    // 315° 좌상
    { x1: 6.7, y1: 6.7, x2: 4.9, y2: 4.9 },
  ];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={5.5}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {rays.map((ray, i) => (
        <Line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

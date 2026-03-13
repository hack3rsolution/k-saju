import React from 'react';
import Svg, { Polygon } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function FortuneIcon({ color, size = 24 }: Props) {
  // 5-point star: outerR=11, innerR=4.5, center=(12,12), 첫 꼭짓점 -90°
  const points = '12,1 14.4,8.6 22.5,8.6 16.3,13.5 18.7,21.1 12,16.3 5.3,21.1 7.7,13.5 1.5,8.6 9.6,8.6';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points={points}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

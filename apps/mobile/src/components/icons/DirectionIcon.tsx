import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function DirectionIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 외원 */}
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 십자 눈금 (N/S/E/W, 짧게) */}
      <Line x1={12} y1={3}  x2={12} y2={5.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={12} y1={18.5} x2={12} y2={21} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={3}  y1={12} x2={5.5} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={18.5} y1={12} x2={21} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 나침반 바늘 위쪽 (fill) */}
      <Path
        d="M12,5 L14,12 L12,10 L10,12 Z"
        fill={color}
        fillOpacity={0.8}
        stroke={color}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      {/* 나침반 바늘 아래쪽 (outline) */}
      <Path
        d="M12,19 L14,12 L12,14 L10,12 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function MyChartIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 외원 */}
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 수평선 (4주 구분) */}
      <Line
        x1={2}
        y1={12}
        x2={22}
        y2={12}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 수직선 (4주 구분) */}
      <Line
        x1={12}
        y1={2}
        x2={12}
        y2={22}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 내원 */}
      <Circle
        cx={12}
        cy={12}
        r={3.5}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

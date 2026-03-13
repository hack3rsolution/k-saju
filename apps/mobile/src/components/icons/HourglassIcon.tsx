import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function HourglassIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 상단 가로선 */}
      <Line x1={5} y1={3} x2={19} y2={3} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 하단 가로선 */}
      <Line x1={5} y1={21} x2={19} y2={21} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 상단 삼각 */}
      <Path
        d="M5,3 L19,3 L12,12 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 하단 삼각 */}
      <Path
        d="M5,21 L19,21 L12,12 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 모래 (상단 절반 채움) */}
      <Path
        d="M8,6 Q12,10 16,6"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill={color}
        fillOpacity={0.3}
      />
    </Svg>
  );
}

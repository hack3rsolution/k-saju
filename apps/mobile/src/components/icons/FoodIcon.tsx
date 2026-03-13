import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function FoodIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 그릇 */}
      <Path
        d="M5,14 Q5,18 12,18 Q19,18 19,14 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 받침 */}
      <Line x1={4} y1={18} x2={20} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 젓가락 1 */}
      <Line x1={9}  y1={6} x2={7}  y2={13} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 젓가락 2 */}
      <Line x1={12} y1={5} x2={11} y2={13} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

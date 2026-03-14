import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function EditIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 연필 몸통 (반투명 채움) */}
      <Path
        d="M4,20 L8,16 L18,6 Q20,4 18,2 Q16,0 14,2 L4,12 Z"
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 연필 선 (몸통 중앙선) */}
      <Line
        x1="14" y1="2" x2="20" y2="8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 밑줄 */}
      <Line
        x1="4" y1="20" x2="20" y2="20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function NumberIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 주사위 외곽 */}
      <Rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={3}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 대각선 점 3개 */}
      <Circle cx={8}  cy={8}  r={1.5} fill={color} />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
      <Circle cx={16} cy={16} r={1.5} fill={color} />
    </Svg>
  );
}

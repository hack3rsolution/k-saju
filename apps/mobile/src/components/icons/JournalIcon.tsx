import React from 'react';
import Svg, { Rect, Path, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function JournalIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 중앙 직사각형 몸체 */}
      <Rect
        x={6.5}
        y={6}
        width={11}
        height={12}
        rx={1}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 상단 말린 부분 */}
      <Path
        d="M6.5,6 Q6.5,2 12,2 Q17.5,2 17.5,6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 하단 말린 부분 */}
      <Path
        d="M6.5,18 Q6.5,22 12,22 Q17.5,22 17.5,18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 내부 줄 3개 */}
      <Line x1={8.5} y1={10} x2={15.5} y2={10} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={8.5} y1={12} x2={15.5} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={8.5} y1={14} x2={15.5} y2={14} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

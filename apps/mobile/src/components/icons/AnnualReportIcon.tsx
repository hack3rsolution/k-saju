import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function AnnualReportIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 외곽 책 */}
      <Rect
        x={4}
        y={3}
        width={16}
        height={18}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 왼쪽 바인딩 세로선 */}
      <Line x1={7} y1={3} x2={7} y2={21} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* 내부 줄 3개 */}
      <Line x1={10} y1={8}  x2={17} y2={8}  stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={10} y1={12} x2={17} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={10} y1={16} x2={17} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

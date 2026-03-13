import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function ColorIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 원형 팔레트 */}
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 색상 점 4개 */}
      <Circle cx={9}  cy={9}  r={1.5} fill={color} />
      <Circle cx={15} cy={9}  r={1.5} fill={color} />
      <Circle cx={9}  cy={15} r={1.5} fill={color} />
      <Circle cx={15} cy={15} r={1.5} fill={color} />
      {/* 중앙 구멍 */}
      <Circle
        cx={12}
        cy={12}
        r={2}
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

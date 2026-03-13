import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function RelationsIcon({ color, size = 24 }: Props) {
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
      {/* S커브: 상단 반원(오른쪽) → 하단 반원(왼쪽) */}
      <Path
        d="M12,2 C17,2 17,12 12,12 C7,12 7,22 12,22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 위쪽 소원 (음, 반투명 fill) */}
      <Circle
        cx={12}
        cy={7}
        r={2}
        fill={color}
        fillOpacity={0.4}
        stroke="none"
      />
      {/* 아래쪽 소원 (양, stroke only) */}
      <Circle
        cx={12}
        cy={17}
        r={2}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

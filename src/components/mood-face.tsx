import Svg, { Ellipse, Path, Text as SvgText } from "react-native-svg";

import { MoodId } from "@/lib/mood";

export function MoodFace({
  mood,
  width = 220,
}: {
  mood: MoodId;
  width?: number;
}) {
  const height = width * 0.62;

  return (
    <Svg width={width} height={height} viewBox="0 0 220 136">
      <Ellipse cx="38" cy="75" rx="38" ry="42" fill="#F2F2EE" />
      <Ellipse cx="182" cy="75" rx="38" ry="42" fill="#F2F2EE" />
      <Ellipse
        cx="110"
        cy="70"
        rx="75"
        ry="61"
        fill="#FAF9F5"
        stroke="#D8C4B7"
        strokeWidth="2"
      />
      <Ellipse cx="74" cy="91" rx="12" ry="7" fill="#F3B9B5" opacity="0.78" />
      <Ellipse cx="146" cy="91" rx="12" ry="7" fill="#F3B9B5" opacity="0.78" />

      {mood === "happy" ? (
        <>
          <Path
            d="M71 66q9-13 18 0M131 66q9-13 18 0"
            fill="none"
            stroke="#3D302A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M99 80h22q-2 25-11 25T99 80Z"
            fill="#FFFFFF"
            stroke="#3D302A"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {mood === "annoyed" ? (
        <>
          <Path
            d="m67 62 17 7m-16 1 17-8m51 0 17 8m-18-1 17-7"
            fill="none"
            stroke="#3D302A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M96 101q14-18 28 0"
            fill="none"
            stroke="#3D302A"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {mood === "calm" ? (
        <>
          <Path
            d="M68 65h17m51 0h17"
            fill="none"
            stroke="#3D302A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M92 91q9 10 18 0 9 10 18 0"
            fill="none"
            stroke="#3D302A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {mood === "tired" ? (
        <>
          <Path
            d="M69 69q9 8 18 0m47 0q9 8 18 0"
            fill="none"
            stroke="#3D302A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Ellipse cx="111" cy="92" rx="12" ry="8" fill="#3D302A" />
          <Path d="M121 96q9 12 2 19-8-1-6-17" fill="#9BCBF4" />
          <SvgText
            x="160"
            y="35"
            fill="#3567A6"
            fontSize="25"
            fontWeight="700"
            transform="rotate(-12 160 35)"
          >
            z
          </SvgText>
          <SvgText
            x="181"
            y="18"
            fill="#3567A6"
            fontSize="29"
            fontWeight="700"
            transform="rotate(-12 181 18)"
          >
            z
          </SvgText>
        </>
      ) : null}
    </Svg>
  );
}

"use client";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "lg";
  dark?: boolean;
}

export function ScoreRing({ score, size = "lg", dark = false }: ScoreRingProps) {
  const radius = size === "lg" ? 36 : 24;
  const stroke = size === "lg" ? 6 : 4;
  const dim = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const fill = (score / 10) * circumference;
  const gap = circumference - fill;

  const color =
    score >= 7 ? "#22c55e" : score >= 5 ? "#eab308" : "#ef4444";

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className="-rotate-90"
      >
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={dark ? "#333" : "#f1f5f9"}
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${fill} ${gap}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-black"
        style={{
          fontSize: size === "lg" ? 22 : 13,
          color: dark ? "#fff" : "#111",
        }}
      >
        {score}
      </span>
    </div>
  );
}

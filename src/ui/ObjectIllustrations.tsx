/** Small vector illustrations stay sharp in reading windows independently of map pixels. */
export function CakeIllustration() {
  return (
    <svg viewBox="0 0 260 180" aria-label="草莓奶油蛋糕" role="img">
      <ellipse cx="130" cy="148" rx="99" ry="17" fill="#d9cfc2" />
      <ellipse cx="130" cy="143" rx="94" ry="15" fill="#faf4e7" />
      <path d="M64 81h132v50c0 21-132 21-132 0z" fill="#dab278" />
      <path d="M64 103h132v13H64z" fill="#b86872" />
      <path d="M64 91h132v9H64z" fill="#fff1d7" />
      <ellipse cx="130" cy="82" rx="66" ry="19" fill="#fff4dc" />
      <path
        d="M64 80v19q8 13 15 0V88q7-3 13 0v15q9 14 15-1V93q8-3 16 0v15q8 9 15-3V93q9-3 17-1v10q10 11 15-3V89q10-2 17-6v15q6 10 9-1V80"
        fill="#fff4dc"
      />
      <path d="M112 48q-10 22 17 34 27-14 17-34-17-15-34 0" fill="#c65d6d" />
      <path d="m128 47-14-8 15 1 6-9 3 11 13-1-13 9" fill="#718e70" />
      <g fill="#f8d6ab">
        <ellipse cx="120" cy="55" rx="1.5" ry="2" />
        <ellipse cx="131" cy="61" rx="1.5" ry="2" />
        <ellipse cx="138" cy="53" rx="1.5" ry="2" />
        <ellipse cx="128" cy="71" rx="1.5" ry="2" />
      </g>
    </svg>
  );
}

export function FoodIllustration({
  kind,
}: {
  kind: "strawberry" | "mango" | "cake";
}) {
  if (kind === "cake") return <CakeIllustration />;
  return (
    <svg viewBox="0 0 100 90" aria-hidden="true">
      <ellipse cx="50" cy="80" rx="28" ry="4" fill="#78917022" />
      {kind === "strawberry" ? (
        <>
          <path d="M25 33Q18 58 49 78 83 55 74 33 50 11 25 33" fill="#ce7380" />
          <path d="m49 29-22-9 19 1 8-15 3 17 21-3-22 14" fill="#789473" />
          <g fill="#fbe4bf">
            {[
              [34, 39],
              [50, 45],
              [64, 39],
              [39, 55],
              [58, 57],
              [49, 68],
            ].map(([x, y]) => (
              <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.5" ry="2" />
            ))}
          </g>
        </>
      ) : (
        <>
          <path
            d="M66 18C90 31 82 66 46 78 18 85 19 44 42 23q13-11 24-5"
            fill="#e4b759"
          />
          <path
            d="M66 18Q40 35 34 69"
            stroke="#f4d891"
            strokeWidth="9"
            fill="none"
          />
          <path d="M60 18Q58 1 77 8q-2 12-17 10" fill="#7d9974" />
        </>
      )}
    </svg>
  );
}

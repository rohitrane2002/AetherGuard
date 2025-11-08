"use client";
export default function BackgroundGrid() {
  const rows = 16;
  const cols = 28;
  const dots = [];
  for (let i = 0; i < rows * cols; i++) dots.push(i);

  return (
    <div className="absolute inset-0 flex flex-wrap justify-center items-center opacity-[0.07] pointer-events-none z-0">
      {dots.map((i) => (
        <div
          key={i}
          className="w-3 h-3 m-[3px] bg-gradient-to-br from-fuchsia-500 to-cyan-400 rounded-full animate-pulse"
          style={{ animationDelay: `${(i % cols) * 0.05}s` }}
        />
      ))}
    </div>
  );
}
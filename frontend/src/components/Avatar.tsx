export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8e8e8] font-bold text-navy"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initial}
    </div>
  );
}

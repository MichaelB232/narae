export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {initial}
    </div>
  );
}

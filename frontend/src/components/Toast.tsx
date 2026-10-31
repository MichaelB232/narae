export function SuccessToast({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="toast-success">
      <div className="check">✓</div>
      <div>
        <div className="t1">{title}</div>
        <div className="t2">{subtitle}</div>
      </div>
    </div>
  );
}

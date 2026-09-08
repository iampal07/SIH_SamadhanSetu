import { lifecycleStage } from "@/lib/lifecycle";

export function StatusBadge({ status }: { status: string }) {
  const stage = lifecycleStage(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${stage.color}`}
    >
      {stage.label}
    </span>
  );
}

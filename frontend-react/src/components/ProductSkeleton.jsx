export default function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-line bg-white">
      <div className="aspect-[4/3] bg-paper-dim" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-paper-dim" />
        <div className="h-3 w-full rounded bg-paper-dim" />
        <div className="h-3 w-4/5 rounded bg-paper-dim" />
        <div className="h-10 w-full rounded bg-paper-dim" />
      </div>
    </div>
  );
}

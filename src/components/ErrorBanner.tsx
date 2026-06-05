export interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-red-400">⚠</span>
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

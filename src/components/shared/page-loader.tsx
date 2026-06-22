type Props = {
  label?: string;
  fullScreen?: boolean;
};

export function PageLoader({ label = "Loading BundleHub…", fullScreen = true }: Props) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background/90 backdrop-blur-md"
          : "flex min-h-[50vh] flex-col items-center justify-center gap-8 py-16"
      }
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="sphere-loader" aria-hidden="true">
        <div className="sphere-loader__orbit sphere-loader__orbit--outer">
          <div className="sphere-loader__ring" />
        </div>
        <div className="sphere-loader__orbit sphere-loader__orbit--mid">
          <div className="sphere-loader__ring sphere-loader__ring--mid" />
        </div>
        <div className="sphere-loader__orbit sphere-loader__orbit--inner">
          <div className="sphere-loader__ring sphere-loader__ring--inner" />
        </div>
        <div className="sphere-loader__core" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="font-display text-sm font-semibold tracking-wide gradient-brand-text">
          {label}
        </p>
        <div className="flex gap-1">
          <span className="loader-dot" />
          <span className="loader-dot loader-dot--2" />
          <span className="loader-dot loader-dot--3" />
        </div>
      </div>
    </div>
  );
}

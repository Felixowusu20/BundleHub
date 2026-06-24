export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-3.25rem-env(safe-area-inset-bottom,0px))] items-center justify-center px-4 py-8 pb-tab-bar mesh-bg md:min-h-[calc(100dvh-8rem)] md:py-12 md:pb-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-12 mesh-bg">
      {children}
    </div>
  );
}

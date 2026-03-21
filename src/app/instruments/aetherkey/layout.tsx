export default function AetherKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0a] overflow-hidden">
      {children}
    </div>
  );
}

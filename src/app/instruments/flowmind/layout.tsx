export default function FlowMindLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-[#050508] overflow-hidden">
      {children}
    </div>
  );
}

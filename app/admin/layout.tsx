export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-navy-950 overflow-auto">
      {children}
    </div>
  )
}

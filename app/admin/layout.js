export const metadata = {
  title: 'Admin Dashboard | Emporium Capitals',
};

export default function AdminLayout({ children }) {
  return (
    <div className="bg-[#010214] min-h-screen text-white">
      {children}
    </div>
  );
}


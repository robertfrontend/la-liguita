import { SuperAdminRoute } from "@/components/layout/SuperAdminRoute";

export const metadata = {
  title: "Super Admin - La Liguita",
  description: "Panel de control maestro de La Liguita para gestión de torneos y organizadores.",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminRoute>
      <div className="min-h-screen bg-zinc-950 text-white">
        {children}
      </div>
    </SuperAdminRoute>
  );
}

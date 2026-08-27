"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Terminal, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { isSuperAdmin } from "@/lib/auth-helpers";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login?redirect=/superadmin");
      return;
    }

    const authorized = isSuperAdmin(user);

    if (!authorized) {
      setIsAuthorized(false);
      const timer = setTimeout(() => {
        router.push("/");
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  if (loading || isAuthorized === null) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium text-zinc-400">Verificando permisos de Super Administrador...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-bounce">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Acceso No Autorizado</h1>
        <p className="text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
          Esta sección está restringida exclusivamente para el Super Administrador de <strong>La Liguita</strong>.
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Redirigiendo al inicio automáticamente...
        </p>
        <Link 
          href="/" 
          className="mt-6 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
        >
          Volver de Inmediato
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

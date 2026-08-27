"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { verifyAdminAccessCode, claimTournamentWithAccessCode } from "@/lib/db";
import { Tournament } from "@/types/tournament";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { resolveLoginIdentifier } from "@/lib/auth-helpers";
import { 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Lock, 
  Building, 
  Sparkles,
  LogIn,
  UserPlus,
  User,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminGatekeeperProps {
  onSuccess?: (tournament: Tournament) => void;
  title?: string;
  subtitle?: string;
}

export function AdminGatekeeper(props: AdminGatekeeperProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-zinc-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-xs">Cargando acceso administrativo...</span>
          </div>
        </div>
      }
    >
      <AdminGatekeeperInner {...props} />
    </Suspense>
  );
}

function AdminGatekeeperInner({ onSuccess, title, subtitle }: AdminGatekeeperProps) {
  const searchParams = useSearchParams();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [pinCode, setPinCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlockedTournament, setUnlockedTournament] = useState<Tournament | null>(null);

  // Estados de Login / Registro
  const [isLoginView, setIsLoginView] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Auto-detectar PIN desde URL si viene con ?pin=... o ?code=...
  useEffect(() => {
    const urlPin = searchParams.get("pin") || searchParams.get("code");
    if (urlPin) {
      setPinCode(urlPin.trim().toUpperCase());
      handleVerifyPin(urlPin.trim().toUpperCase());
    } else {
      // Verificar si ya fue desbloqueado en la sesión actual
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") : null;
      if (savedPin) {
        setPinCode(savedPin);
        handleVerifyPin(savedPin);
      }
    }
  }, [searchParams]);

  // Si el usuario ya está autenticado y desbloqueó el torneo, asegurar los permisos
  useEffect(() => {
    if (user && user.email && unlockedTournament) {
      claimTournamentWithAccessCode(unlockedTournament.id, user.email);
    }
  }, [user, unlockedTournament]);

  const handleVerifyPin = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || pinCode).trim().toUpperCase();
    if (!targetCode) {
      setPinError("Por favor ingresa un código o PIN de acceso.");
      return;
    }

    setIsVerifying(true);
    setPinError(null);

    const result = await verifyAdminAccessCode(targetCode);
    setIsVerifying(false);

    if (result.valid && result.tournament) {
      setUnlockedTournament(result.tournament);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_unlocked_pin", targetCode);
        sessionStorage.setItem("admin_unlocked_tournament_id", result.tournament.id);
      }
      if (onSuccess) {
        onSuccess(result.tournament);
      }
    } else {
      setPinError(result.message || "Código o PIN inválido. Verifica con el Super Administrador.");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);

    try {
      const resolvedIdentifier = resolveLoginIdentifier(emailOrUsername);
      if (isLoginView) {
        await signInWithEmail(resolvedIdentifier, password);
      } else {
        await signUpWithEmail(resolvedIdentifier, password, name);
      }

      // Si hay un torneo desbloqueado, vincular el email al torneo
      if (unlockedTournament) {
        await claimTournamentWithAccessCode(unlockedTournament.id, resolvedIdentifier);
      }
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/invalid-credential") {
        setAuthError("Credenciales incorrectas. Verifica tu usuario/correo y contraseña.");
      } else if (error.code === "auth/email-already-in-use") {
        setAuthError(t("login.emailInUse"));
      } else if (error.code === "auth/weak-password") {
        setAuthError(t("login.weakPassword"));
      } else {
        setAuthError(t("common.error"));
      }
      console.error(error);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 text-white selection:bg-emerald-500/30">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow decorativo esmeralda */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* PASO 1: GATEKEEPER - INGRESO DE PIN ÚNICO */}
        {!unlockedTournament ? (
          <div className="space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <KeyRound size={32} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 mb-2">
                <Lock size={12} />
                <span>Acceso Restringido</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title || "Consola Administrativa"}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {subtitle || "Para acceder a la administración de un torneo, introduce el Código o PIN Único generado por el Super Administrador."}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-left">
                  Código de Invitación / PIN Único
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej: LGT-8492"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-lg sm:text-xl font-black font-mono tracking-widest text-emerald-400 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all uppercase"
                    autoFocus
                  />
                </div>
              </div>

              {pinError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || !pinCode.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verificando PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Validar Código & Continuar</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500">
              ¿No tienes un código de acceso? Contacta al Super Administrador de la plataforma para recibir tu PIN de invitación.
            </div>
          </div>
        ) : (
          /* PASO 2: LOGIN / REGISTRO DESBLOQUEADO CON EL TORNEO */
          <div className="space-y-6 animate-in fade-in">
            {/* Banner del Torneo Desbloqueado */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                  {unlockedTournament.sport === "soccer" ? "⚽" : "🏀"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    <CheckCircle2 size={12} />
                    <span>Torneo Autorizado</span>
                  </div>
                  <h3 className="font-bold text-white text-sm truncate">{unlockedTournament.name}</h3>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Building size={11} className="text-zinc-500" />
                    <span>{unlockedTournament.organizationName || "Organización Oficial"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUnlockedTournament(null);
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("admin_unlocked_pin");
                    sessionStorage.removeItem("admin_unlocked_tournament_id");
                  }
                }}
                className="text-[10px] font-bold text-zinc-400 hover:text-white underline shrink-0"
              >
                Cambiar
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isLoginView ? "Ingresa a tu Cuenta" : "Crear Perfil de Administrador"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isLoginView 
                  ? "Accede con tus credenciales asignadas para gestionar este torneo."
                  : "Regístrate para vincularte como organizador oficial."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {!isLoginView && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Usuario o Correo Electrónico"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="password"
                  placeholder="Contraseña"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center">
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
              >
                {isSubmittingAuth ? "Procesando..." : (isLoginView ? "Iniciar Sesión en Torneo" : "Registrar & Vincular Administrador")}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition"
              >
                {isLoginView ? (
                  <>¿No tienes cuenta aún? <span className="font-bold text-white underline">Crear cuenta</span></>
                ) : (
                  <>¿Ya tienes una cuenta? <span className="font-bold text-white underline">Inicia sesión</span></>
                )}
              </button>
            </div>

            {/* Separador Google */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-zinc-500">
                <span className="px-2 bg-zinc-900">O también</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              type="button"
              variant="outline"
              className="w-full py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continuar con Google</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

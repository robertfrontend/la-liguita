"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyAdminAccessCode, claimTournamentWithAccessCode } from "@/lib/db";
import { Tournament } from "@/types/tournament";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { resolveLoginIdentifier, isSuperAdmin } from "@/lib/auth-helpers";
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
  AlertCircle,
  Eye,
  EyeOff,
  Trophy
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
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Modo activo: 'login' (Directo con credenciales) o 'pin' (Canjear código de torneo)
  const [authMode, setAuthMode] = useState<"login" | "pin">("login");
  const [isLoginView, setIsLoginView] = useState(true); // true = Login, false = Registro

  // Credenciales
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Estados de PIN & Torneo Desbloqueado
  const [pinCode, setPinCode] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlockedTournament, setUnlockedTournament] = useState<Tournament | null>(null);

  // Ref para asegurar que la verificación de un PIN en URL solo ocurra UNA sola vez y jamás cause bucles
  const processedPinRef = useRef<string | null>(null);

  // Detectar parámetros en la URL (PIN, Código, Usuario pre-llenado)
  useEffect(() => {
    if (!searchParams) return;

    const urlPin = (searchParams.get("pin") || searchParams.get("code"))?.trim().toUpperCase();
    const urlUser = searchParams.get("user") || searchParams.get("username") || searchParams.get("email");

    if (urlUser && !emailOrUsername) {
      setEmailOrUsername(urlUser.trim());
    }

    if (urlPin && processedPinRef.current !== urlPin) {
      processedPinRef.current = urlPin;
      setPinCode(urlPin);
      // Drop the code from the address bar so it is not kept in history or the Referer.
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("pin");
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      executePinVerification(urlPin);
    } else if (!urlPin && !processedPinRef.current) {
      // Verificar si ya había un PIN desbloqueado en la sesión
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") : null;
      if (savedPin && processedPinRef.current !== savedPin) {
        processedPinRef.current = savedPin;
        setPinCode(savedPin);
        executePinVerification(savedPin);
      }
    }
  }, [searchParams]);

  // Si el usuario ya está autenticado y hay un torneo desbloqueado, asegurar vinculación
  useEffect(() => {
    if (user && user.email && unlockedTournament && unlockedTournament.id !== "superadmin-root" && !isSuperAdmin(user)) {
      const savedPin = typeof window !== "undefined" ? sessionStorage.getItem("admin_unlocked_pin") || "" : "";
      claimTournamentWithAccessCode(unlockedTournament.id, user.email, savedPin).then((ok) => {
        if (ok && typeof window !== "undefined") {
          sessionStorage.removeItem("admin_unlocked_pin");
        }
      });
    }
  }, [user, unlockedTournament]);

  // Función segura de verificación de PIN (sin bucles)
  const executePinVerification = async (targetPin: string) => {
    if (!targetPin || targetPin.length < 3) return;

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const result = await verifyAdminAccessCode(targetPin);
      if (result.valid && result.tournament) {
        setUnlockedTournament(result.tournament);
        setAuthMode("login"); // Cambiar automáticamente al formulario de login con el torneo ya autorizado
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_unlocked_pin", targetPin);
          sessionStorage.setItem("admin_unlocked_tournament_id", result.tournament.id);
        }
      } else {
        setPinError(result.message || "El código PIN no es válido o ha expirado.");
      }
    } catch (err: any) {
      console.error("Error al validar PIN:", err);
      setPinError("Error de conexión al validar el código.");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Manejar envío de login / registro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      const resolvedIdentifier = resolveLoginIdentifier(emailOrUsername);
      
      if (isLoginView) {
        await signInWithEmail(resolvedIdentifier, password);
      } else {
        await signUpWithEmail(resolvedIdentifier, password, name);
      }

      // Si había un torneo desbloqueado, vincular el usuario al torneo
      if (unlockedTournament && unlockedTournament.id !== "superadmin-root") {
        await claimTournamentWithAccessCode(unlockedTournament.id, resolvedIdentifier, pinCode);
        if (onSuccess) {
          onSuccess(unlockedTournament);
        } else {
          router.push(`/tournament/${unlockedTournament.id}/games`);
        }
      } else {
        // Redirección general
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Error en autenticación:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setAuthError("Usuario o contraseña incorrectos. Verifica tus credenciales.");
      } else if (err.code === "auth/email-already-in-use") {
        setAuthError(t("login.emailInUse") || "Este correo o usuario ya está en uso.");
      } else if (err.code === "auth/weak-password") {
        setAuthError(t("login.weakPassword") || "La contraseña debe tener al menos 6 caracteres.");
      } else {
        setAuthError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      if (unlockedTournament && unlockedTournament.id !== "superadmin-root") {
        router.push(`/tournament/${unlockedTournament.id}/games`);
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setAuthError(error?.message || "Error al iniciar con Google.");
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-950 text-white selection:bg-emerald-500/30">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow decorativo esmeralda */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER: Indicador de Torneo si vino con PIN */}
        {unlockedTournament ? (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                {unlockedTournament.logoUrl ? (
                  <img src={unlockedTournament.logoUrl} alt={unlockedTournament.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span>{unlockedTournament.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  <CheckCircle2 size={12} />
                  <span>Acceso a Torneo Autorizado</span>
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
                processedPinRef.current = null;
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("admin_unlocked_pin");
                  sessionStorage.removeItem("admin_unlocked_tournament_id");
                }
              }}
              className="text-[11px] font-bold text-zinc-400 hover:text-white underline shrink-0 px-2 py-1"
            >
              Cambiar
            </button>
          </div>
        ) : null}

        {/* SELECTOR DE PESTAÑAS (LOGIN DIRECTO vs CANJEAR PIN) */}
        {!unlockedTournament && (
          <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === "login"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LogIn size={14} />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMode("pin")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === "pin"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <KeyRound size={14} />
              <span>Código de acceso</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODO 1: FORMULARIO DE LOGIN / REGISTRO DIRECTO */}
        {/* ============================================================ */}
        {authMode === "login" && (
          <div className="space-y-5 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isLoginView ? "Consola Administrativa" : "Crear Perfil de Organizador"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {unlockedTournament
                  ? `Ingresa tus credenciales para administrar ${unlockedTournament.name}`
                  : (isLoginView ? "Accede con tu usuario o correo para gestionar torneos." : "Completa tus datos para crear tu cuenta.")}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {!isLoginView && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Usuario o Correo Electrónico</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    placeholder="ej: tbs_peravia o correo@gmail.com"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmittingAuth || !emailOrUsername.trim() || !password.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-[0.98] mt-2"
              >
                {isSubmittingAuth ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <span>{isLoginView ? "Entrar al Panel de Control" : "Crear Perfil y Vincular"}</span>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setAuthError(null);
                }}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition"
              >
                {isLoginView ? (
                  <>¿No tienes cuenta aún? <span className="font-bold text-white underline">Crear cuenta</span></>
                ) : (
                  <>¿Ya tienes credenciales? <span className="font-bold text-white underline">Inicia sesión</span></>
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

        {/* ============================================================ */}
        {/* MODO 2: INGRESO DIRECTO DE CÓDIGO PIN */}
        {/* ============================================================ */}
        {authMode === "pin" && !unlockedTournament && (
          <div className="space-y-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <KeyRound size={28} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Código de acceso del torneo
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Ingresa el PIN único asignado por el Super Administrador para desbloquear la gestión de tu torneo.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executePinVerification(pinCode.trim().toUpperCase());
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-left">
                  Código de Invitación / PIN Único
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: LGT-8492"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-xl font-black font-mono tracking-widest text-emerald-400 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all uppercase"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingPin || !pinCode.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isVerifyingPin ? (
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
          </div>
        )}
      </div>
    </div>
  );
}

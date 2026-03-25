"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/invalid-credential') {
        setError(t("login.invalidCredentials"));
      } else if (error.code === 'auth/email-already-in-use') {
        setError(t("login.emailInUse"));
      } else if (error.code === 'auth/weak-password') {
        setError(t("login.weakPassword"));
      } else {
        setError(t("common.error"));
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null; 

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
             {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          {isLogin ? t("login.welcomeBack") : t("login.createAccount")}
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          {isLogin ? t("login.signInToContinue") : t("login.joinCommunity")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
              <input 
                type="text" 
                placeholder={t("common.name")}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
            <input 
              type="email" 
              placeholder={t("common.email")}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
            <input 
              type="password" 
              placeholder={t("common.password")}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? t("common.loading") : (isLogin ? t("common.signIn") : t("common.signUp"))}
          </Button>
        </form>

        <div className="text-center mb-6">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
          >
            {isLogin ? (
              <>{t("login.dontHaveAccount")} <span className="font-bold">{t("common.signUp")}</span></>
            ) : (
              <>{t("login.alreadyHaveAccount")} <span className="font-bold">{t("common.signIn")}</span></>
            )}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">{t("common.orContinueWith")}</span>
          </div>
        </div>

        <Button 
          onClick={signInWithGoogle}
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium bg-card text-foreground border border-border hover:bg-muted/10 flex items-center justify-center gap-3 shadow-sm transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          {t("common.google")}
        </Button>
      </div>
    </div>
  );
}

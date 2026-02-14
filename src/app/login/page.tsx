"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("Email already in use.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null; 

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
             {isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="text-zinc-500 mb-8 text-center">
          {isSignUp ? "Sign up to start tracking your stats." : "Sign in to continue to La Liguita."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" 
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="email" 
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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
            {isSubmitting ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-zinc-500">Or continue with</span>
          </div>
        </div>

        <Button 
          onClick={signInWithGoogle}
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 flex items-center justify-center gap-3 shadow-sm transition-all mb-6"
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
          Google
        </Button>

        <p className="text-center text-sm text-zinc-500">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }} 
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

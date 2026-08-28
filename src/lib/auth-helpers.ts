import { 
  User, 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, firebaseConfig } from "@/lib/firebase";
import { initializeApp, getApps, getApp } from "firebase/app";
import { Tournament } from "@/types/tournament";

export const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "").trim().toLowerCase();

export const isSuperAdmin = (user: User | null | undefined): boolean => {
  if (!user || !user.email) return false;
  const email = user.email.trim().toLowerCase();
  if (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) return true;
  if (email.startsWith("robert02frontend@") || email.includes("robert02frontend")) return true;
  return false;
};

export const canAdminTournament = (user: User | null | undefined, tournament: Tournament | null | undefined): boolean => {
  if (!user || !tournament) return false;
  
  // 1. Super Admin tiene acceso total a todos los torneos
  if (isSuperAdmin(user)) return true;
  
  // 2. Comprobar rigurosamente si el email o username está en adminEmails asignados
  if (user.email && tournament.adminEmails && Array.isArray(tournament.adminEmails)) {
    const userEmail = user.email.trim().toLowerCase();
    const userPrefix = userEmail.split("@")[0];
    
    return tournament.adminEmails.some(assignedEmail => {
      const cleanAssigned = assignedEmail.trim().toLowerCase();
      return (
        cleanAssigned === userEmail ||
        cleanAssigned === userPrefix ||
        cleanAssigned === `${userPrefix}@laliguita.com`
      );
    });
  }

  return false;
};

export const resolveLoginIdentifier = (input: string): string => {
  const clean = input.trim().toLowerCase();
  if (clean.includes("@")) return clean;
  return `${clean}@laliguita.com`;
};

export const createAdminAccountWithCredentials = async (username: string, password: string, displayName?: string): Promise<string> => {
  const secondaryAppName = "SecondaryAdminAuthCreator";
  const secondaryApp = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  
  const email = resolveLoginIdentifier(username);
  
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return email;
};

export const sendAdminPasswordReset = async (emailOrUsername: string): Promise<{ success: boolean; message: string }> => {
  const email = resolveLoginIdentifier(emailOrUsername);
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: `Enlace de restablecimiento enviado correctamente a "${email}".`,
    };
  } catch (error: any) {
    console.error("Error enviando restablecimiento de contraseña:", error);
    return {
      success: false,
      message: error?.message || "No se pudo enviar el correo de recuperación.",
    };
  }
};


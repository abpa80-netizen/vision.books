import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Headphones,
  ArrowRight,
  AlertCircle,
  LogOut,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const AdminLoginPage: React.FC = () => {
  const { user, isAdmin, loading, error, signInWithGoogle, logout, adminEmail } = useAuth();
  const { navigateTo } = useApp();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLocalError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLocalError(err.message || 'Erreur lors de la connexion Google.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLocalError(err.message || 'Erreur lors du changement de compte.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100 antialiased selection:bg-amber-500 selection:text-neutral-950">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to store link */}
        <button
          onClick={() => navigateTo('/')}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Retour au catalogue VISION BOOKS</span>
        </button>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20">
              <Headphones className="h-7 w-7 stroke-[2.5]" />
            </div>

            <div className="mt-4 flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-amber-400">
              <Lock className="h-3 w-3" />
              <span>Firebase Authentication</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              VISION BOOKS
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Portail d'administration sécurisé
            </p>
          </div>

          {/* Conditional rendering depending on authentication status */}
          {user && !isAdmin ? (
            /* User signed in, but NOT an admin */
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Accès administrateur non autorisé</span>
                </div>
                <p className="leading-relaxed">
                  Vous êtes connecté avec l'adresse :{' '}
                  <strong className="font-mono text-white">{user.email}</strong>. Ce compte n'a pas les droits
                  d'administration requis.
                </p>
                <p className="text-[11px] text-neutral-400">
                  Compte administrateur autorisé : <span className="font-mono text-amber-300">{adminEmail}</span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSwitchAccount}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 px-4 text-xs font-bold text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Changer de compte Google</span>
                </button>

                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-4 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          ) : (
            /* User not signed in */
            <div className="mt-8 space-y-5">
              {(error || localError) && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-3.5 text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error || localError}</span>
                </div>
              )}

              <p className="text-center text-xs text-neutral-300 leading-relaxed">
                Connectez-vous avec votre compte Google vérifié pour administrer le catalogue, les prospects, le Pack VIP et les métriques de conversion.
              </p>

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn || loading}
                className="group w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-white py-3.5 px-4 text-sm font-semibold text-neutral-900 shadow-xl transition-all hover:bg-neutral-100 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {signingIn || loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuer avec Google</span>
                  </>
                )}
              </button>

              {/* Security Notices */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 text-[11px] text-neutral-400">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Règles de sécurité Firestore actives</span>
                </div>
                <p className="leading-relaxed">
                  L'accès public au catalogue et aux pages de capture reste entièrement ouvert sans authentification. Les données privées (leads, liens de téléchargement audio) sont strictement protégées.
                </p>
                <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Admin configuré :</span>
                  <span className="text-amber-400 truncate max-w-[200px]">{adminEmail}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useSearchParams } from 'react-router-dom';
import BackgroundEffects from '../components/login/BackgroundEffects';
import Header from '../components/login/Header';
import HeroSection from '../components/login/HeroSection';
import LoginCard from '../components/login/LoginCard';
import { useAuth } from '../context/AuthContext';
import { getAuthConfig } from '../api/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const signInError = searchParams.get('error');
  const { user, loading } = useAuth();
  const [devAuthBypassEnabled, setDevAuthBypassEnabled] = useState(false);

  // Whether the dev/demo sign-in link should show at all is a server-side setting
  // (DEV_AUTH_BYPASS_ENABLED), not something a production build can know at build time —
  // fetched here instead of relying on import.meta.env.DEV, which is always false in the
  // built bundle (e.g. what nginx serves in Docker) even when the backend has it enabled.
  useEffect(() => {
    getAuthConfig().then((res) => setDevAuthBypassEnabled(!!res.data?.devAuthBypassEnabled)).catch(() => {});
  }, []);

  // A signed-in user who navigates back to /login (bookmark, back button) should land in
  // the app, not see the marketing page again.
  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <BackgroundEffects />
      <Header />

      <div className="min-h-screen flex items-center px-6 py-24 lg:px-[70px] lg:py-28">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-16 items-center">
          <HeroSection />

          {/* Mobile-only compact brand header, shown when the hero column is hidden */}
          <div className="lg:hidden flex items-center justify-center gap-3">
            <img src="/brand/tektalis.png" alt="Tektalis" style={{ height: 26 }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            <LoginCard signInError={signInError} devAuthBypassEnabled={devAuthBypassEnabled} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

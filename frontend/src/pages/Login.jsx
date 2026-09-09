import { motion } from 'framer-motion';
import BackgroundEffects from '../components/login/BackgroundEffects';
import Header from '../components/login/Header';
import HeroSection from '../components/login/HeroSection';
import LoginCard from '../components/login/LoginCard';

export default function Login() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <BackgroundEffects />
      <Header />

      <div className="min-h-screen flex items-center px-6 py-24 lg:px-[70px] lg:py-28">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-16 items-center">
          <HeroSection />

          {/* Mobile-only compact brand header, shown when the hero column is hidden */}
          <div className="lg:hidden flex items-center justify-center gap-3">
            <div
              className="w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1, #22D3EE)' }}
            />
            <p className="text-base font-display font-bold text-premium-text">LMS 2.0</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            <LoginCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ title }) {
  const mainRef = useRef(null);
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Scrolling is scoped to <main> (not the window), so React Router's default
  // scroll-restoration never kicks in here — reset it manually on every
  // navigation, including switching between Administration's sections
  // (a ?section= query-string change on the same route). Also close the
  // mobile nav drawer so a route change doesn't leave it open over the page.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <main ref={mainRef} className="flex-1 h-screen overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-8 py-5 pb-24 md:pb-8 w-full max-w-full">
        <Outlet context={{ title }} />
      </main>
      <BottomNav onOpenMenu={() => setMobileNavOpen(true)} />
    </div>
  );
}

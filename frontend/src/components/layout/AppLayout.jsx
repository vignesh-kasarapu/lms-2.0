import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ title }) {
  const mainRef = useRef(null);
  const location = useLocation();

  // Scrolling is scoped to <main> (not the window), so React Router's default
  // scroll-restoration never kicks in here — reset it manually on every
  // navigation, including switching between Administration's sections
  // (a ?section= query-string change on the same route).
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar />
      <main ref={mainRef} className="flex-1 h-screen overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-8 py-5 pb-24 md:pb-8 w-full max-w-full">
        <Outlet context={{ title }} />
      </main>
      <BottomNav />
    </div>
  );
}

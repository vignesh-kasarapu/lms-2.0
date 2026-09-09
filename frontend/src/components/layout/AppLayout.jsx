import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ title }) {
  return (
    <div className="flex min-h-screen w-full bg-transparent">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
        <Outlet context={{ title }} />
      </main>
      <BottomNav />
    </div>
  );
}

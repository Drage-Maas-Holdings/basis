import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { FAB } from '../help/FAB';

export function Shell() {
  return (
    <div className="min-h-screen flex bg-bg-base">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      <FAB />
    </div>
  );
}

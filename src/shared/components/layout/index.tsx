import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Navbar } from './Navbar';
import { isAuthenticated } from "@/shared/lib/auth";

export function MainLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-[#0A0F1C]">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(170,104,255,0.08) 0%, transparent 50%)', backgroundAttachment: 'fixed' }} />
      <Navbar />
      <main className="flex-1 overflow-y-auto px-8 py-8 lg:px-12 z-10 pt-[60px]">
        <div className="mx-auto max-w-[1200px] pb-16">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0F1C] px-4 py-12 lg:px-8">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(170,104,255,0.08) 0%, transparent 50%)', backgroundAttachment: 'fixed' }} />
      <div className="z-10 w-full max-w-7xl relative flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}

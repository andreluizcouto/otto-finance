import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Navbar } from './Navbar';
import { isAuthenticated } from "@/shared/lib/auth";
import { Toaster } from "sonner";

export function MainLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          },
        }}
      />
      <Navbar />
      <main className="flex-1 z-10 pt-20 md:pt-24 relative">
        {/* Subtle background glow for the active page context */}
        <div className="absolute top-[-200px] right-0 w-[600px] h-[600px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="mx-auto max-w-[1440px] pb-20 px-4 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-black text-white px-4 py-12 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-white/[0.03] blur-[150px] rounded-full"></div>
      </div>
      <div className="z-10 w-full max-w-7xl mx-auto relative">
        <Outlet />
      </div>
    </div>
  );
}

export function ProtectedAuthLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white relative">
      <div className="absolute top-[-200px] right-0 w-[600px] h-[600px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none"></div>
      <Outlet />
    </div>
  );
}

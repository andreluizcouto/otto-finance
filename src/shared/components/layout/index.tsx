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
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 z-10 pt-24">
        <div className="mx-auto max-w-[1440px] pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-12 lg:px-8">
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
    <div className="flex min-h-screen flex-col bg-background">
      <Outlet />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input } from "@/shared/components/ui";
import { Mail, Lock, EyeOff, Eye, Play, Apple } from "lucide-react";
import { apiPost } from "@/shared/lib/api";
import { setToken } from "@/shared/lib/auth";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiPost('/api/auth/login', credentials);
      setToken(data.session.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Access Denied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-4xl font-light tracking-[0.3em] text-white/90 otto-title">OTTO</span>
          <p className="otto-label text-[10px] text-white/40 tracking-[0.2em]">Secure Authentication</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="otto-label text-[9px]">Identity</label>
              <Input
                placeholder="Email Address"
                type="email"
                required
                className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                value={credentials.email}
                onChange={(e) => setCredentials(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="otto-label text-[9px]">Secret</label>
                <button
                  type="button"
                  onClick={() => toast.info('Recovery protocol in development')}
                  className="text-[9px] otto-label text-white/20 hover:text-white transition-all"
                >
                  Forgot?
                </button>
              </div>
              <Input
                placeholder="••••••••"
                type="password"
                required
                className="bg-white/5 border-white/10 rounded-xl py-6 px-4 text-xs font-medium focus:border-white/20 transition-all shadow-none"
                value={credentials.password}
                onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[10px] otto-label text-red-400 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-8 text-xs otto-label tracking-[0.2em] disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Authorize Access'}
          </Button>
        </form>

        <p className="text-center text-[10px] otto-label text-white/20">
          New to OTTO? <button onClick={() => navigate('/onboarding/1')} className="text-white hover:underline transition-all">Request Access</button>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input } from "../components/ui";
import { Mail, Lock, EyeOff, Eye, Play, Apple } from "lucide-react";
import { apiPost } from "../../lib/api";
import { setToken } from "../../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiPost('/api/auth/login', credentials);
      setToken(data.session.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center pt-10">
      <Card className="w-full max-w-md p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#aa68ff] to-[#820ad1] shadow-[0_0_15px_rgba(170,104,255,0.3)]">
            <span className="text-2xl font-bold text-white">⚡</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F5F8]">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-[#8B949E]">Acesse sua conta para continuar</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#F4F5F8]">Email</label>
            <Input
              icon={<Mail className="h-4 w-4" />}
              placeholder="seu@email.com"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#F4F5F8]">Senha</label>
            <div className="relative">
              <Input
                icon={<Lock className="h-4 w-4" />}
                placeholder="••••••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={credentials.password}
                onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#F4F5F8]"
                onClick={() => setShowPassword(p => !p)}
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[#8B949E]">
              <input type="checkbox" className="h-4 w-4 rounded border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] checked:bg-[#aa68ff] focus:ring-[#aa68ff]" />
              Lembrar-me
            </label>
            <a href="#" className="text-xs text-[#8B949E] hover:text-[#F4F5F8] hover:underline">
              Esqueceu a senha?
            </a>
          </div>

          {error && (
            <div className="rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar →'}
          </Button>
        </form>

        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[rgba(255,255,255,0.1)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0A0F1C] px-2 text-[#8B949E]">ou</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="secondary" className="w-full justify-center">
            <Play className="mr-2 h-4 w-4" /> Continuar com Google
          </Button>
          <Button variant="secondary" className="w-full justify-center">
            <Apple className="mr-2 h-4 w-4" /> Continuar com Apple
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-[#8B949E]">
          Não tem uma conta? <button onClick={() => navigate('/onboarding/1')} className="font-semibold text-white hover:underline">Criar conta</button>
        </p>
      </Card>

      <p className="mt-8 text-center text-xs text-[#8B949E] max-w-sm">
        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </p>
    </div>
  );
}

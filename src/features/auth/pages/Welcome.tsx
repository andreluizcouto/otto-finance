import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card } from "@/shared/components/ui";
import { CheckCircle2, Shield, BrainCircuit, Play, Apple } from "lucide-react";
import { toast } from "sonner";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh] gap-20">
      <div className="flex flex-col items-center gap-4">
        <span className="text-6xl font-light tracking-[0.3em] text-white/90 otto-title">OTTO</span>
        <span className="text-[10px] otto-label text-white/40 tracking-[0.5em] mt-4">PRIVATE WEALTH</span>
      </div>

      <div className="w-full flex flex-col gap-6">
        <Button
          size="lg"
          className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-8 text-xs otto-label tracking-[0.2em]"
          onClick={() => navigate('/onboarding/1')}
        >
          Secure Access
        </Button>

        <p className="text-center text-[10px] otto-label text-white/20">
          Already a member? <button onClick={() => navigate('/login')} className="text-white hover:underline transition-all">Sign In</button>
        </p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-3 w-3 text-white/20" />
          <span className="text-[9px] otto-label text-white/20">Institutional Grade Security</span>
        </div>
      </div>
    </div>
  );
}

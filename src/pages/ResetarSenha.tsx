import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ResetarSenha: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token inválido.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL_DEV || ''}/api/usuarios/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
        navigate('/login');
      } else {
        toast.error(data.error || 'Erro ao redefinir senha.');
      }
    } catch (err) {
      toast.error('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Redefinir Senha</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Digite sua nova senha abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nova-senha" className="text-gray-700 font-medium">Nova Senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  placeholder="Nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha" className="text-gray-700 font-medium">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetarSenha; 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useParams } from 'react-router-dom';
import SignupForm from '@/components/SignupForm';
import { toast } from 'sonner';

const Auth = () => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { token } = useParams();
  const [confirmStatus, setConfirmStatus] = useState<'pending' | 'success' | 'error'>('pending');
  
  const { user, signIn, signUp } = useAuth();
  const { toast: useToastToast } = useToast();

  // Redirect if already authenticated
  if (user) {
    console.log('Auth: User already authenticated, redirecting...');
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (token) {
      fetch(`/api/usuarios/confirmar/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.message) setConfirmStatus('success');
          else setConfirmStatus('error');
        })
        .catch(() => setConfirmStatus('error'));
    }
  }, [token]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Auth: Attempting login for:', formData.email);
      await signIn(formData.email, formData.password);
      console.log('Auth: Login successful');
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Auth: Authentication error:', error);
      if (error.message && error.message.includes('Confirme seu e-mail')) {
        toast.error('Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.');
      } else {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL_DEV || ''}/api/usuarios/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      // Sempre exibe mensagem de sucesso
      toast.success('Se o e-mail existir, enviaremos instruções para redefinir a senha.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (err) {
      toast.error('Erro ao solicitar recuperação de senha.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 rounded-2xl shadow-xl bg-white/90 w-full max-w-4xl">
                <img 
                  src="/lovable-uploads/81009293-f25e-4f72-a80a-e150f7665dc2.png" 
                  alt="SIGMus Logo" 
                  className="h-16 w-auto mb-2 sm:mb-0"
                />
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="text-3xl font-bold text-blue-700 tracking-wide">
                    SiGDMus
                  </div>
                  <div className="text-base text-gray-600 leading-tight max-w-[250px] font-bold">
                    Sistema Integrado de Gestão e
                    <br />
                    Documentação Musical
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <SignupForm onBack={() => setView('login')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 rounded-2xl shadow-xl bg-white/90 w-full max-w-4xl">
              <img 
                src="/lovable-uploads/81009293-f25e-4f72-a80a-e150f7665dc2.png" 
                alt="SIGMus Logo" 
                className="h-16 w-auto mb-2 sm:mb-0"
              />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="text-3xl font-bold text-blue-700 tracking-wide">
                  SiGDMus
                </div>
                <div className="text-base text-gray-600 leading-tight max-w-[250px] font-bold">
                  Sistema Integrado de Gestão e
                  <br />
                  Documentação Musical
                </div>
              </div>
            </div>
          </div>
        </div>

        {showForgotPassword ? (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-scale-in">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Recuperar Senha</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Informe seu e-mail para receber instruções de redefinição de senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={forgotLoading}>
                  {forgotLoading ? 'Enviando...' : 'Enviar instruções'}
                </Button>
              </form>
              <Button variant="outline" onClick={() => setShowForgotPassword(false)} className="w-full h-12 mt-2">Voltar</Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Seja bem-vindo</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Acesse ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 group" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-500 bg-white">ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setView('signup')}
              className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                <span className="font-medium">Criar Nova Conta</span>
              </div>
            </Button>

            <Button variant="link" className="w-full text-blue-600 underline mb-2" onClick={() => setShowForgotPassword(true)}>
              Esqueci minha senha
            </Button>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Primeira vez no sistema?</p>
                  <p className="text-amber-700">Solicite seu cadastro clicando no botão acima. Sua solicitação será analisada pelo administrador.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Para acesso administrativo, entre em contato com o suporte
          </p>
        </div>

        {token && confirmStatus === 'pending' && <div>Confirmando cadastro...</div>}
        {token && confirmStatus === 'success' && <div>Cadastro confirmado com sucesso! Você já pode fazer login.</div>}
        {token && confirmStatus === 'error' && <div>Erro ao confirmar cadastro. O link pode estar expirado ou já ter sido usado.</div>}
      </div>
    </div>
  );
};

export default Auth;


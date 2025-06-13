
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import SignupForm from '@/components/SignupForm';

const Auth = () => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    console.log('Auth: User already authenticated, redirecting...');
    return <Navigate to="/" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Auth: Attempting login for:', formData.email);
      await signIn(formData.email, formData.password);
      console.log('Auth: Login successful');
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema.",
      });
    } catch (error: any) {
      console.error('Auth: Authentication error:', error);
      toast({
        title: "Erro na autenticação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-4 p-4 rounded-2xl shadow-xl bg-white/90 w-full max-w-4xl">
                <img 
                  src="/lovable-uploads/81009293-f25e-4f72-a80a-e150f7665dc2.png" 
                  alt="SIGMus Logo" 
                  className="h-16 w-auto"
                />
                <div className="flex flex-col text-left">
                  <div className="text-3xl font-bold text-blue-700 tracking-wide">
                    SiGMus
                  </div>
                  <div className="text-base text-gray-600 leading-tight max-w-[250px] font-sans font-semibold">
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
            <div className="flex items-center space-x-4 p-4 rounded-2xl shadow-xl bg-white/90 transform hover:scale-105 transition-transform duration-300 w-full">
              <img 
                src="/lovable-uploads/81009293-f25e-4f72-a80a-e150f7665dc2.png" 
                alt="SIGMus Logo" 
                className="h-16 w-auto"
              />
              <div className="flex flex-col text-left">
                <div className="text-3xl font-bold text-blue-700 tracking-wide">
                  SiGMus
                </div>
                <div className="text-base text-gray-600 leading-tight max-w-[250px] font-sans font-semibold">
                  Sistema Integrado de Gestão e
                  <br />
                  Documentação Musical
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Acesse sua conta para gerenciar partituras e performances
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
      </div>
    </div>
  );
};

export default Auth;

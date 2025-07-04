import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import InstitutionSelector from './SignupForm/InstitutionSelector';
import SectorSelector from './SignupForm/SectorSelector';
import FunctionInstrumentFields from './SignupForm/FunctionInstrumentFields';
import PersonalInfoFields from './SignupForm/PersonalInfoFields';
import ApprovalNotice from './SignupForm/ApprovalNotice';
import FormFieldInput from '@/components/FormFieldInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SignupFormProps {
  onBack: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instituicao: '',
    setor: '',
    funcao: '',
    instrumento: '',
    role: 'USER'
  });
  const [loading, setLoading] = useState(false);
  const [instituicoes, setInstituicoes] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const { signUp } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  // Funções disponíveis
  const funcoesBase = [
    { value: 'MUSICO', label: 'Músico' },
    { value: 'ESTUDANTE', label: 'Estudante' },
    { value: 'PROFESSOR', label: 'Professor' },
    { value: 'MAESTRO', label: 'Maestro' },
    { value: 'ARQUIVISTA', label: 'Arquivista' },
    { value: 'GERENTE', label: 'Gerente' }
  ];
  const funcoes = hasAdmin === false
    ? [{ value: 'ADMINISTRADOR', label: 'Administrador' }, ...funcoesBase]
    : funcoesBase;

  // Buscar instituições reais da API
  const fetchInstituicoes = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/instituicoes`);
      const data = await res.json();
      setInstituicoes(data);
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
      setInstituicoes([]);
    }
  };

  // Buscar setores reais da API
  const fetchSetores = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/setores`);
      const data = await res.json();
      setSetores(data);
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      setSetores([]);
    }
  };

  // Buscar dados reais ao montar o componente
  useEffect(() => {
    fetchInstituicoes();
    fetchSetores();
    fetch('/api/usuarios/has-admin')
      .then(res => res.json())
      .then(data => setHasAdmin(data.hasAdmin));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Evita submit duplo
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, {
        nome: formData.name,
        instituicao: formData.instituicao,
        setor: formData.setor,
        funcao: formData.funcao,
        instrumento: formData.instrumento,
        role: hasAdmin === false && formData.role === 'ADMINISTRADOR' ? 'ADMIN' : 'USER',
        senha: formData.password
      });
      toast.success('Cadastro realizado com sucesso!');
      onBack();
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm animate-scale-in w-full">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900">Criar Nova Conta</CardTitle>
        <CardDescription className="text-gray-600 text-base">
          Preencha os dados para solicitar seu cadastro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PersonalInfoFields formData={formData} setFormData={setFormData} />
          
          <InstitutionSelector 
            value={formData.instituicao}
            onChange={(value) => setFormData(prev => ({ ...prev, instituicao: value }))}
            instituicoes={instituicoes}
            onInstitutionAdded={fetchInstituicoes}
          />
          
          <SectorSelector
            value={formData.setor}
            onChange={(value) => setFormData(prev => ({ ...prev, setor: value }))}
            setores={setores}
            onSectorAdded={fetchSetores}
          />

          <FunctionInstrumentFields 
            formData={formData}
            setFormData={setFormData}
            funcoes={funcoes}
          />

          <ApprovalNotice />

          {/* Tipo de conta: Administrador */}
          {hasAdmin === false && (
            <div className="form-group">
              <label>
                <input type="radio" name="role" value="ADMIN" checked={formData.role === 'ADMIN'} onChange={() => setFormData(prev => ({ ...prev, role: 'ADMIN' }))} /> Administrador (plenos poderes)
              </label>
            </div>
          )}
          {hasAdmin === true && (
            <div className="alert alert-info">Já existe um administrador cadastrado. Novos usuários serão comuns.</div>
          )}

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
              <span>Solicitar Cadastro</span>
            )}
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex items-center justify-center space-x-2">
            <ArrowLeft className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
            <span className="font-medium">Voltar para Login</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
};

export default SignupForm;

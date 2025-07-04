import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface InstitutionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  instituicoes: Array<{ id: string; nome: string }>;
  onInstitutionAdded: () => void;
}

// Função para obter o token do localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Função para fazer requisições autenticadas
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('auth_token');
      throw new Error('Sessão expirada');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro na requisição');
  }

  return response;
};

const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({ 
  value, 
  onChange, 
  instituicoes, 
  onInstitutionAdded 
}) => {
  const [newInstituicao, setNewInstituicao] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddInstituicao = async () => {
    if (!newInstituicao.trim()) return;

    setIsAdding(true);
    try {
      console.log('Tentando adicionar instituição:', newInstituicao.trim());
      // Usar fetch simples, sem token
      const res = await fetch(`${getApiUrl()}/api/instituicoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newInstituicao.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro na requisição');
      }
      const data = await res.json();
      console.log('Instituição adicionada:', data);
      onInstitutionAdded();
      onChange(newInstituicao.trim());
      setNewInstituicao('');
      toast.success('Instituição adicionada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar instituição:', error);
      if (error.message.includes('duplicate') || error.message.includes('já existe')) {
        toast.error('Esta instituição já existe.');
      } else {
        toast.error(`Erro ao adicionar instituição: ${error.message}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="instituicao">Instituição *</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma instituição" />
          </SelectTrigger>
          <SelectContent>
            {instituicoes.map((inst) => (
              <SelectItem key={inst.id} value={inst.nome}>
                {inst.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Input
            placeholder="Nova instituição"
            value={newInstituicao}
            onChange={(e) => setNewInstituicao(e.target.value)}
            className="w-40"
            disabled={isAdding}
          />
          <Button
            type="button"
            onClick={handleAddInstituicao}
            disabled={!newInstituicao.trim() || isAdding}
            size="sm"
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionSelector;

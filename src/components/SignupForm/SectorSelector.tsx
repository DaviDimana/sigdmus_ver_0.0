import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface SectorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  setores: Array<{ id: string; nome: string }>;
  onSectorAdded: () => void;
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

const SectorSelector: React.FC<SectorSelectorProps> = ({ 
  value, 
  onChange, 
  setores, 
  onSectorAdded 
}) => {
  const [newSetor, setNewSetor] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSetor = async () => {
    if (!newSetor.trim()) return;

    setIsAdding(true);
    try {
      console.log('Tentando adicionar setor:', newSetor.trim());
      
      const res = await authenticatedFetch(`${getApiUrl()}/api/setores`, {
        method: 'POST',
        body: JSON.stringify({ nome: newSetor.trim() }),
      });

      const data = await res.json();
      console.log('Setor adicionado:', data);
      
      onSectorAdded();
      onChange(newSetor.trim());
      setNewSetor('');
      
      toast.success('Setor adicionado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar setor:', error);
      
      // Check for duplicate error
      if (error.message.includes('duplicate') || error.message.includes('já existe')) {
        toast.error('Este setor já existe.');
      } else {
        toast.error(`Erro ao adicionar setor: ${error.message}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="setor">Setor *</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um setor" />
          </SelectTrigger>
          <SelectContent>
            {setores.map((setor) => (
              <SelectItem key={setor.id} value={setor.nome}>
                {setor.nome.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Input
            placeholder="Novo setor"
            value={newSetor}
            onChange={(e) => setNewSetor(e.target.value)}
            className="w-40"
            disabled={isAdding}
          />
          <Button
            type="button"
            onClick={handleAddSetor}
            disabled={!newSetor.trim() || isAdding}
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

export default SectorSelector;

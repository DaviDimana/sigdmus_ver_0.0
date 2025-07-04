import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

const PasswordSettings: React.FC = () => {
  const { user, authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar senhas
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      if (formData.newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Atualizar senha via API REST
      const response = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          senha: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar senha');
      }

      toast.success('Senha atualizada com sucesso!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Senha Atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Digite sua senha atual"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova Senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Digite sua nova senha"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirme sua nova senha"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Atualizando...</span>
          </div>
        ) : (
          'Atualizar Senha'
        )}
      </Button>
    </form>
  );
};

export default PasswordSettings;

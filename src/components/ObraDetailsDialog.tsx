import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Music, Calendar, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/utils/apiConfig';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ObraDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  obra: string;
  arquivos: any[];
  formatFileSize: (bytes: number) => string;
  onDeleteAllArquivos?: () => void;
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

const ObraDetailsDialog: React.FC<ObraDetailsDialogProps> = ({
  isOpen,
  onClose,
  obra,
  arquivos,
  formatFileSize,
  onDeleteAllArquivos,
}) => {
  const { profile } = useAuth();
  // Removendo verificação de role - qualquer usuário pode editar/deletar
  const canEditOrDelete = true;
  console.log('ObraDetailsDialog.tsx - profile:', profile, 'canEditOrDelete:', canEditOrDelete);
  // Removendo verificação de role - qualquer usuário vê todos os arquivos
  const isMusico = false;
  const userInstrument = profile?.instrumento;

  // Função para normalizar nomes de instrumento
  const normalize = (str: string) => str?.toLowerCase().replace(/[^a-z0-9]/gi, '');

  // Removendo filtro por instrumento - qualquer usuário vê todos os arquivos
  const arquivosFiltrados = arquivos;

  // Buscar partituras relacionadas à obra
  const { data: partituras = [] } = useQuery({
    queryKey: ['partituras-obra', obra],
    queryFn: async () => {
      console.log('Fetching partituras for obra:', obra);
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras?titulo=${encodeURIComponent(obra)}`);
      const data = await res.json();
      return data || [];
    },
    enabled: isOpen && !!obra,
  });

  const totalSize = arquivos.reduce((sum, arquivo) => sum + arquivo.tamanho, 0);
  const totalDownloads = arquivos.reduce((sum, arquivo) => sum + (arquivo.downloads || 0), 0);
  const categorias = [...new Set(arquivos.map(a => a.categoria))];
  const hasRestrictedFiles = arquivos.some(arquivo => arquivo.restricao_download);

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (tipo.includes('audio') || tipo.includes('midi')) return <Music className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const [isArquivosOpen, setIsArquivosOpen] = React.useState(true);

  // Função de download com tratamento de erro amigável
  const handleDownload = async (arquivo: any) => {
    try {
      if (!arquivo.arquivo_url) {
        toast.error('Arquivo não disponível para download.');
        return;
      }
      const response = await fetch(arquivo.arquivo_url);
      if (!response.ok) {
        toast.error('Arquivo não encontrado ou acesso não autorizado.');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = arquivo.nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erro ao baixar arquivo. Tente novamente ou contate o administrador.');
    }
  };

  if (profile === null) {
    return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Obra</DialogTitle>
          <DialogDescription>Veja as informações completas da obra selecionada.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{arquivos.length}</div>
              <div className="text-sm text-blue-600">Arquivos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{formatFileSize(totalSize)}</div>
              <div className="text-sm text-green-600">Tamanho Total</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{totalDownloads}</div>
              <div className="text-sm text-purple-600">Downloads</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{categorias.length}</div>
              <div className="text-sm text-orange-600">Categorias</div>
            </div>
          </div>

          {/* Informações das Partituras Cadastradas */}
          {partituras.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Partituras Cadastradas</h3>
              <div className="space-y-4">
                {partituras.map((partitura) => (
                  <div key={partitura.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{partitura.setor}</Badge>
                      {partitura.digitalizado && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Digital
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-lg">{partitura.titulo}</h4>
                    <p className="text-gray-600 mb-3">{partitura.compositor}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Instrumentação:</span> {partitura.instrumentacao}
                      </div>
                      {partitura.tonalidade && (
                        <div>
                          <span className="font-medium">Tonalidade:</span> {partitura.tonalidade}
                        </div>
                      )}
                      {partitura.genero && (
                        <div>
                          <span className="font-medium">Gênero:</span> {partitura.genero}
                        </div>
                      )}
                      {partitura.edicao && (
                        <div>
                          <span className="font-medium">Edição:</span> {partitura.edicao}
                        </div>
                      )}
                      {partitura.ano_edicao && (
                        <div>
                          <span className="font-medium">Ano da Edição:</span> {partitura.ano_edicao}
                        </div>
                      )}
                      {partitura.numero_armario && (
                        <div>
                          <span className="font-medium">Armário:</span> {partitura.numero_armario}
                        </div>
                      )}
                      {partitura.numero_prateleira && (
                        <div>
                          <span className="font-medium">Prateleira:</span> {partitura.numero_prateleira}
                        </div>
                      )}
                      {partitura.numero_pasta && (
                        <div>
                          <span className="font-medium">Pasta:</span> {partitura.numero_pasta}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorias */}
          {categorias.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Categorias de Arquivos</h3>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <Badge key={categoria} variant="outline" className="bg-gray-50">
                    {categoria}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Arquivos */}
          <Collapsible open={isArquivosOpen} onOpenChange={setIsArquivosOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <h3 className="text-lg font-semibold">Arquivos ({arquivosFiltrados.length})</h3>
                {isArquivosOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-4">
              {arquivosFiltrados.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum arquivo disponível.</p>
              ) : (
                <div className="space-y-2">
                  {arquivosFiltrados.map((arquivo) => (
                    <div key={arquivo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(arquivo.tipo)}
                        <div>
                          <p className="font-medium">{arquivo.nome}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(arquivo.tamanho)} • {arquivo.downloads || 0} downloads
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {arquivo.restricao_download && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Restrito
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(arquivo)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Baixar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Aviso sobre arquivos restritos */}
          {hasRestrictedFiles && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Atenção:</strong> Alguns arquivos têm restrição de download e podem requerer autorização.
              </p>
            </div>
          )}

          {/* Botão para deletar todos os arquivos (apenas para admins) */}
          {canEditOrDelete && arquivosFiltrados.length > 0 && onDeleteAllArquivos && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={onDeleteAllArquivos}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Deletar Todos os Arquivos</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObraDetailsDialog;

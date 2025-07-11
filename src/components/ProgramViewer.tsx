import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Image, File } from 'lucide-react';

interface ProgramViewerProps {
  isOpen: boolean;
  onClose: () => void;
  performance: {
    titulo_obra: string;
    programa_arquivo_url?: string;
  };
}

const ProgramViewer: React.FC<ProgramViewerProps> = ({
  isOpen,
  onClose,
  performance
}) => {
  if (!performance) return null;

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || '';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-600" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDownload = async () => {
    if (!performance.programa_arquivo_url) return;

    try {
      const response = await fetch(performance.programa_arquivo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileType = getFileType(performance.programa_arquivo_url);
      link.download = `programa-${performance.titulo_obra.replace(/[^a-zA-Z0-9]/g, '_')}.${fileType}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const renderFilePreview = () => {
    if (!performance.programa_arquivo_url) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <File className="h-16 w-16 mb-4" />
          <p className="text-lg mb-2">Programa não disponível</p>
          <p className="text-sm text-center">
            O programa do concerto não foi encontrado ou ainda não foi carregado.
          </p>
        </div>
      );
    }

    const fileType = getFileType(performance.programa_arquivo_url);

    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full h-[70vh]">
            <iframe
              src={performance.programa_arquivo_url}
              className="w-full h-full border rounded"
              title={`Programa do Concerto - ${performance.titulo_obra}`}
            />
          </div>
        );
      
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <div className="w-full h-[70vh] flex items-center justify-center">
            <img
              src={performance.programa_arquivo_url}
              alt={`Programa do Concerto - ${performance.titulo_obra}`}
              className="max-w-full max-h-full object-contain rounded"
            />
          </div>
        );
      
      case 'doc':
      case 'docx':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <File className="h-16 w-16 mb-4 text-blue-600" />
            <p className="text-lg mb-2">Documento Word</p>
            <p className="text-sm text-center mb-4">
              Para visualizar este documento, faça o download
            </p>
            <Button
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <File className="h-16 w-16 mb-4" />
            <p className="text-lg mb-2">Arquivo não suportado para visualização</p>
            <p className="text-sm text-center mb-4">
              Faça o download do arquivo para visualizá-lo
            </p>
            <Button
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        );
    }
  };

  const fileType = performance.programa_arquivo_url ? getFileType(performance.programa_arquivo_url) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualização de Programa</DialogTitle>
          <DialogDescription>Veja o programa de concerto anexado à performance.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Programa do Concerto</span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {renderFilePreview()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramViewer;

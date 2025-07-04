import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, FileSpreadsheet, Printer, Tags } from 'lucide-react';
import { generateReport } from '@/utils/reportGenerator';
import { generateLabels } from '@/utils/labelGenerator';
import { toast } from 'sonner';
import { usePartituras } from '@/hooks/usePartituras';
import { usePerformances } from '@/hooks/usePerformances';

const Relatorios = () => {
  const [selectedType, setSelectedType] = useState<'partituras' | 'performances'>('partituras');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'word' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  // Hooks para dados em tempo real
  const { partituras } = usePartituras();
  const { performances } = usePerformances();

  const partiturasFields = [
    { id: 'instituicao', label: 'Instituição' },
    { id: 'setor', label: 'Setor' },
    { id: 'titulo', label: 'Título' },
    { id: 'compositor', label: 'Compositor' },
    { id: 'instrumentacao', label: 'Instrumentação' },
    { id: 'tonalidade', label: 'Tonalidade' },
    { id: 'genero', label: 'Gênero/Forma' },
    { id: 'edicao', label: 'Edição' },
    { id: 'ano_edicao', label: 'Ano da Edição' },
    { id: 'digitalizado', label: 'Digitalizado' },
    { id: 'numero_armario', label: 'N° Armário' },
    { id: 'numero_prateleira', label: 'N° Prateleira' },
    { id: 'numero_pasta', label: 'N° Pasta' },
    { id: 'observacoes', label: 'Observações' },
  ];

  const performancesFields = [
    { id: 'titulo_obra', label: 'Título da Obra' },
    { id: 'nome_compositor', label: 'Nome do Compositor' },
    { id: 'local', label: 'Local' },
    { id: 'data', label: 'Data' },
    { id: 'horario', label: 'Horário' },
    { id: 'maestros', label: 'Maestro(s)' },
    { id: 'interpretes', label: 'Intérprete(s)' },
    { id: 'release', label: 'Release' },
  ];

  const currentFields = selectedType === 'partituras' ? partiturasFields : performancesFields;

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === currentFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(currentFields.map(field => field.id));
    }
  };

  const handleGenerateReport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para gerar o relatório');
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport({
        type: selectedType,
        fields: selectedFields,
        format: outputFormat
      });
      toast.success('Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      if (error.message === 'Token não encontrado' || error.message === 'Sessão expirada') {
        toast.error('Sessão expirada. Faça login novamente.');
        // Redirecionar para login se necessário
        window.location.href = '/login';
      } else {
        toast.error(`Erro ao gerar relatório: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLabels = async () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para gerar as etiquetas');
      return;
    }

    setIsGenerating(true);
    try {
      await generateLabels({
        type: selectedType,
        fields: selectedFields
      });
      toast.success('Etiquetas geradas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar etiquetas:', error);
      if (error.message === 'Token não encontrado' || error.message === 'Sessão expirada') {
        toast.error('Sessão expirada. Faça login novamente.');
        // Redirecionar para login se necessário
        window.location.href = '/login';
      } else {
        toast.error(`Erro ao gerar etiquetas: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">
              Gere relatórios e etiquetas personalizados
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Relatório</CardTitle>
            <CardDescription>
              Selecione o tipo de dados e campos para incluir no relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Tipo de Dados</label>
              <Select value={selectedType} onValueChange={(value: 'partituras' | 'performances') => {
                setSelectedType(value);
                setSelectedFields([]);
              }}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partituras">Partituras</SelectItem>
                  <SelectItem value="performances">Performances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Campos Selecionados</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedFields.length === currentFields.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {currentFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => handleFieldToggle(field.id)}
                    />
                    <label htmlFor={field.id} className="text-sm cursor-pointer">
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
              
              {selectedFields.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Campos selecionados:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFields.map(fieldId => {
                      const field = currentFields.find(f => f.id === fieldId);
                      return (
                        <Badge key={fieldId} variant="secondary" className="text-xs">
                          {field?.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerar Arquivos</CardTitle>
            <CardDescription>
              Escolha o formato de saída e gere o relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Formato de Saída</label>
              <Select value={outputFormat} onValueChange={(value: 'pdf' | 'word' | 'excel') => setOutputFormat(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="word">Word (DOCX)</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleGenerateReport}
                disabled={selectedFields.length === 0 || isGenerating}
              >
                <Download className="h-4 w-4" />
                <span>{isGenerating ? 'Gerando...' : 'Gerar Relatório'}</span>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleGenerateLabels}
                disabled={selectedFields.length === 0 || isGenerating}
              >
                <Tags className="h-4 w-4" />
                <span>{isGenerating ? 'Gerando...' : 'Gerar Etiquetas'}</span>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Formatos Disponíveis:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3 text-red-500" />
                  <span>PDF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span>Word</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileSpreadsheet className="h-3 w-3 text-green-500" />
                  <span>Excel</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Etiquetas para Pastas</CardTitle>
          <CardDescription>
            Gere etiquetas personalizadas para colar nas pastas físicas do material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Printer className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium">Configurações de Etiqueta</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              As etiquetas incluirão os campos selecionados acima em formato otimizado para impressão.
              Tamanho padrão: 5x2,5 cm (compatível com etiquetas Pimaco).
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <strong>Formato:</strong> PDF para impressão
              </div>
              <div>
                <strong>Layout:</strong> 3 colunas por página
              </div>
              <div>
                <strong>Tamanho:</strong> 5x2,5 cm
              </div>
              <div>
                <strong>Orientação:</strong> Retrato
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;

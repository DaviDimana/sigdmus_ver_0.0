import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Music, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePerformances } from '@/hooks/usePerformances';
import { Skeleton } from '@/components/ui/skeleton';
import PerformanceCard from '@/components/PerformanceCard';
import PerformancePageHeader from '@/components/PerformancePageHeader';
import ProgramViewer from '@/components/ProgramViewer';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

const Performances = () => {
  const navigate = useNavigate();
  const { performances, isLoading, error, deletePerformance } = usePerformances();
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);
  const [sharedProgramUrl, setSharedProgramUrl] = useState<string | undefined>(undefined);

  // Filtros multi-select
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedTitulo, setSelectedTitulo] = useState('');
  const [selectedCompositor, setSelectedCompositor] = useState('');
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHorario, setSelectedHorario] = useState('');
  const [selectedMaestros, setSelectedMaestros] = useState('');
  const [selectedInterpretes, setSelectedInterpretes] = useState('');
  const [selectedRelease, setSelectedRelease] = useState('');

  useEffect(() => {
    if (error?.message === 'JWT expired') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      signOut();
      navigate('/auth');
    }
  }, [error, signOut, navigate]);

  const filterOptions = [
    { label: 'Título da Obra', value: 'Título' },
    { label: 'Compositor', value: 'Compositor' },
    { label: 'Local', value: 'Local' },
    { label: 'Data', value: 'Data' },
    { label: 'Horário', value: 'Horário' },
    { label: 'Maestros', value: 'Maestros' },
    { label: 'Intérpretes', value: 'Intérpretes' },
    { label: 'Release', value: 'Release' },
  ];

  const handleFilterToggle = (value: string) => {
    setSelectedFilters((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  const handleClearFilters = () => {
    setSelectedTitulo('');
    setSelectedCompositor('');
    setSelectedLocal('');
    setSelectedData('');
    setSelectedHorario('');
    setSelectedMaestros('');
    setSelectedInterpretes('');
    setSelectedRelease('');
    setSearchTerm('');
    setSelectedFilters([]);
  };

  const filteredPerformances = performances?.filter(performance => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      performance.titulo_obra?.toLowerCase().includes(searchTermLower) ||
      performance.nome_compositor?.toLowerCase().includes(searchTermLower) ||
      performance.local?.toLowerCase().includes(searchTermLower) ||
      performance.data?.toLowerCase().includes(searchTermLower) ||
      performance.horario?.toLowerCase().includes(searchTermLower) ||
      performance.maestros?.toLowerCase().includes(searchTermLower) ||
      performance.interpretes?.toLowerCase().includes(searchTermLower) ||
      performance.release?.toLowerCase().includes(searchTermLower);

    const matchesTitulo = selectedTitulo ? performance.titulo_obra?.toLowerCase().includes(selectedTitulo.toLowerCase()) : true;
    const matchesCompositor = selectedCompositor ? performance.nome_compositor?.toLowerCase().includes(selectedCompositor.toLowerCase()) : true;
    const matchesLocal = selectedLocal ? performance.local?.toLowerCase().includes(selectedLocal.toLowerCase()) : true;
    const matchesData = selectedData ? performance.data === selectedData : true;
    const matchesHorario = selectedHorario ? performance.horario === selectedHorario : true;
    const matchesMaestros = selectedMaestros ? performance.maestros?.toLowerCase().includes(selectedMaestros.toLowerCase()) : true;
    const matchesInterpretes = selectedInterpretes ? performance.interpretes?.toLowerCase().includes(selectedInterpretes.toLowerCase()) : true;
    const matchesRelease = selectedRelease ? performance.release?.toLowerCase().includes(selectedRelease.toLowerCase()) : true;

    return matchesSearch && matchesTitulo && matchesCompositor && matchesLocal && matchesData && matchesHorario && matchesMaestros && matchesInterpretes && matchesRelease;
  }) || [];

  const handleViewProgram = (performance: any, sharedUrl?: string) => {
    setSelectedPerformance(performance);
    setSharedProgramUrl(sharedUrl);
  };

  const handleEdit = (performance: any) => {
    navigate(`/performances/nova?id=${performance.id}`);
  };

  const handleDelete = async (performance: any) => {
    if (window.confirm('Tem certeza que deseja deletar esta performance?')) {
      try {
        await deletePerformance.mutateAsync(performance.id);
        toast.success('Performance deletada com sucesso!');
      } catch (error: any) {
        toast.error('Erro ao deletar performance: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  if (error && error.message !== 'JWT expired') {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <PerformancePageHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewPerformance={() => navigate('/performances/nova')}
          />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600">Erro ao carregar performances: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <PerformancePageHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewPerformance={() => navigate('/performances/nova')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <PerformancePageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewPerformance={() => navigate('/performances/nova')}
        />
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
        {/* Campo de busca aprimorado */}
        <div className="relative flex items-center w-full md:w-96 min-w-[320px]">
          <span className="absolute left-3 text-gray-400">
            <Search className="h-5 w-5" />
          </span>
          <Input
            type="search"
            placeholder="Buscar por qualquer campo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-10 pr-20 text-base shadow-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            style={{ minWidth: 0 }}
          />
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="absolute right-2">
              Limpar
            </Button>
          )}
        </div>

        {/* Dropdown multi-select de filtros */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-center md:w-auto min-w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 space-y-2">
            <div className="font-medium mb-2">Escolha os critérios:</div>
            {filterOptions.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 mb-1">
                <Checkbox
                  checked={selectedFilters.includes(opt.value)}
                  onCheckedChange={() => handleFilterToggle(opt.value)}
                  id={`filter-${opt.value}`}
                />
                <label htmlFor={`filter-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
              </div>
            ))}
            <Button variant="secondary" onClick={handleClearFilters} className="w-full mt-2">
              Limpar Filtros
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Campos de filtro dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {selectedFilters.includes('Título') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Título da Obra</h4>
            <Input
              type="text"
              placeholder="Filtrar por título da obra"
              value={selectedTitulo}
              onChange={(e) => setSelectedTitulo(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Compositor') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Compositor</h4>
            <Input
              type="text"
              placeholder="Filtrar por compositor"
              value={selectedCompositor}
              onChange={(e) => setSelectedCompositor(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Local') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Local da Performance</h4>
            <Input
              type="text"
              placeholder="Filtrar por local"
              value={selectedLocal}
              onChange={(e) => setSelectedLocal(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Data') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Data da Performance</h4>
            <Input
              type="date"
              placeholder="Filtrar por data"
              value={selectedData}
              onChange={(e) => setSelectedData(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Horário') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Horário</h4>
            <Input
              type="time"
              placeholder="Filtrar por horário"
              value={selectedHorario}
              onChange={(e) => setSelectedHorario(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Maestros') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Maestros</h4>
            <Input
              type="text"
              placeholder="Filtrar por maestros"
              value={selectedMaestros}
              onChange={(e) => setSelectedMaestros(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Intérpretes') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Intérpretes</h4>
            <Input
              type="text"
              placeholder="Filtrar por intérpretes"
              value={selectedInterpretes}
              onChange={(e) => setSelectedInterpretes(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        {selectedFilters.includes('Release') && (
          <div>
            <h4 className="text-sm font-medium mb-2">Release</h4>
            <Input
              type="text"
              placeholder="Filtrar por release"
              value={selectedRelease}
              onChange={(e) => setSelectedRelease(e.target.value)}
              className="h-10"
            />
          </div>
        )}
      </div>

      {/* Grid dos cards de performance padrão */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPerformances.map((performance) => (
          <PerformanceCard 
            key={performance.id} 
            performance={performance} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            allPerformances={filteredPerformances}
          />
        ))}
      </div>

      {filteredPerformances.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma performance encontrada
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm 
                ? "Tente ajustar os termos de busca ou limpar os filtros."
                : "Comece registrando sua primeira performance."
              }
            </p>
            <Button onClick={() => navigate('/performances/nova')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Performance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para visualizar programa */}
      <ProgramViewer
        isOpen={!!selectedPerformance}
        onClose={() => { setSelectedPerformance(null); setSharedProgramUrl(undefined); }}
        performance={{ ...(selectedPerformance || {}), programa_arquivo_url: sharedProgramUrl || (selectedPerformance?.programa_arquivo_url ?? '') }}
      />
    </div>
  );
};

export default Performances;

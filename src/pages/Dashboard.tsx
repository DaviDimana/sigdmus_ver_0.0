import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileMusic, Calendar, Users, Download, Settings, Image, FileText } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import { usePartituras } from '@/hooks/usePartituras';
import { usePerformances } from '@/hooks/usePerformances';
import { useUsers } from '@/hooks/useUsers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  // Estados para configuração dos gráficos
  const [chartConfigs, setChartConfigs] = useState({
    partiturasPorCompositor: { type: 'bar', theme: 'blue' },
    partiturasPorSetor: { type: 'pie', theme: 'mixed' },
    performancesPorMes: { type: 'line', theme: 'blue' },
    digitalizacaoStatus: { type: 'pie', theme: 'status' }
  });

  // Refs para capturar os gráficos
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Hooks para dados reais
  const { partituras, isLoading: isLoadingPartituras } = usePartituras();
  const { performances, isLoading: isLoadingPerformances } = usePerformances();
  const { users, isLoading: isLoadingUsers } = useUsers();

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedConfigs = localStorage.getItem('dashboard-chart-configs');
    if (savedConfigs) {
      try {
        setChartConfigs(JSON.parse(savedConfigs));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-chart-configs', JSON.stringify(chartConfigs));
  }, [chartConfigs]);

  // Processar dados reais das partituras
  const partiturasPorCompositor = React.useMemo(() => {
    if (!partituras.length) return [];
    
    const compositoresCount = partituras.reduce((acc, partitura) => {
      const compositor = partitura.compositor || 'Desconhecido';
      acc[compositor] = (acc[compositor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(compositoresCount)
      .map(([compositor, quantidade]) => ({ compositor, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); // Top 10
  }, [partituras]);

  const partiturasPorSetor = React.useMemo(() => {
    if (!partituras.length) return [];
    
    const setoresCount = partituras.reduce((acc, partitura) => {
      const setor = partitura.setor || 'Outros';
      acc[setor] = (acc[setor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    
    return Object.entries(setoresCount).map(([setor, quantidade], index) => ({
      setor,
      quantidade,
      fill: colors[index % colors.length]
    }));
  }, [partituras]);

  const performancesPorMes = React.useMemo(() => {
    if (!performances.length) return [];
    
    const mesesCount = performances.reduce((acc, performance) => {
      const data = new Date(performance.data);
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      acc[mesAno] = (acc[mesAno] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(mesesCount)
      .map(([mes, performances]) => ({ mes, performances }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [performances]);

  const digitalizacaoStatus = React.useMemo(() => {
    if (!partituras.length) return [];
    
    const digitalizado = partituras.filter(p => p.digitalizado).length;
    const naoDigitalizado = partituras.length - digitalizado;
    
    return [
      { status: 'Digitalizado', quantidade: digitalizado, fill: '#10b981' },
      { status: 'Não Digitalizado', quantidade: naoDigitalizado, fill: '#ef4444' }
    ];
  }, [partituras]);

  const chartConfig = {
    quantidade: {
      label: "Quantidade",
      color: "#2563eb",
    },
    performances: {
      label: "Performances",
      color: "#2563eb",
    },
  };

  // Função para atualizar configuração de gráfico
  const updateChartConfig = (chartId: string, config: any) => {
    setChartConfigs(prev => ({
      ...prev,
      [chartId]: { ...prev[chartId as keyof typeof prev], ...config }
    }));
  };

  // Função para fazer download do gráfico
  const downloadChart = async (chartId: string, format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    try {
      const chartElement = chartRefs.current[chartId];
      if (!chartElement) {
        toast.error('Gráfico não encontrado');
        return;
      }

      toast.info('Preparando download...');

      if (format === 'svg') {
        const svgElement = chartElement.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `grafico-${chartId}.svg`;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });

        if (format === 'pdf') {
          const pdf = new jsPDF();
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 190;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          pdf.save(`grafico-${chartId}.pdf`);
        } else {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `grafico-${chartId}.${format}`;
              link.click();
              URL.revokeObjectURL(url);
            }
          }, `image/${format}`);
        }
      }

      toast.success(`Gráfico baixado em formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Erro ao baixar gráfico:', error);
      toast.error('Erro ao baixar gráfico');
    }
  };

  // Componente para renderizar gráfico com base na configuração
  const renderChart = (chartId: string, data: any[], title: string) => {
    const config = chartConfigs[chartId as keyof typeof chartConfigs];
    
    switch (config.type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartId === 'partiturasPorCompositor' ? 'compositor' : 'setor'} 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="quantidade" 
              fill={config.theme === 'blue' ? '#2563eb' : '#10b981'} 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartId === 'partiturasPorCompositor' ? 'compositor' : 'setor'} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="quantidade" 
              stroke={config.theme === 'blue' ? '#2563eb' : '#10b981'}
              fill={config.theme === 'blue' ? '#2563eb' : '#10b981'}
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      
      case 'pie':
      default:
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="quantidade"
              label={({ [chartId === 'partiturasPorCompositor' ? 'compositor' : chartId === 'partiturasPorSetor' ? 'setor' : 'status']: label, quantidade }) => 
                `${label}: ${quantidade}`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || '#2563eb'} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        );
    }
  };

  // Componente para configuração de gráfico
  const ChartConfigDialog = ({ chartId, title, data }: { chartId: string, title: string, data: any[] }) => {
    const config = chartConfigs[chartId as keyof typeof chartConfigs];
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes</DialogTitle>
            <DialogDescription>Veja ou edite os detalhes deste item.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Gráfico</label>
              <Select 
                value={config.type} 
                onValueChange={(value) => updateChartConfig(chartId, { type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  {(chartId === 'partiturasPorSetor' || chartId === 'digitalizacaoStatus') && (
                    <SelectItem value="pie">Pizza</SelectItem>
                  )}
                  {chartId === 'performancesPorMes' && (
                    <SelectItem value="line">Linha</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tema de Cores</label>
              <Select 
                value={config.theme} 
                onValueChange={(value) => updateChartConfig(chartId, { theme: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Azul</SelectItem>
                  <SelectItem value="green">Verde</SelectItem>
                  <SelectItem value="mixed">Multicolorido</SelectItem>
                  {chartId === 'digitalizacaoStatus' && (
                    <SelectItem value="status">Status (Verde/Vermelho)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Download</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartId, 'png')}
                  className="flex items-center space-x-1"
                >
                  <Image className="h-3 w-3" />
                  <span>PNG</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartId, 'jpg')}
                  className="flex items-center space-x-1"
                >
                  <Image className="h-3 w-3" />
                  <span>JPG</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartId, 'svg')}
                  className="flex items-center space-x-1"
                >
                  <FileText className="h-3 w-3" />
                  <span>SVG</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartId, 'pdf')}
                  className="flex items-center space-x-1"
                >
                  <FileText className="h-3 w-3" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Atividades Recentes (últimas 3 de cada tipo)
  const recentPartituras = [...partituras].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
  const recentPerformances = [...performances].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3);
  const recentUsers = [...users].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 3);

  // Próximos Eventos (performances futuras)
  const now = new Date();
  const upcomingPerformances = [...performances]
    .filter(p => new Date(p.data) > now)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3);

  // Contagem real de usuários
  const usuariosAtivos = users.length;
  // Relatórios: 0 (ou implementar lógica real se houver tabela)
  const relatoriosGerados = 0;

  const isLoading = isLoadingPartituras || isLoadingPerformances || isLoadingUsers;

  // Cards de resumo
  const summaryCards = [
    { 
      title: "Total de Partituras", 
      value: partituras.length, 
      icon: FileMusic, 
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      isLoading: isLoadingPartituras
    },
    { 
      title: "Total de Performances", 
      value: performances.length, 
      icon: Calendar, 
      color: "text-green-600",
      bgColor: "bg-green-50",
      isLoading: isLoadingPerformances
    },
    { 
      title: "Total de Usuários", 
      value: users.length, 
      icon: Users, 
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      isLoading: isLoadingUsers
    },
    { 
      title: "Downloads Totais", 
      value: 'N/A', 
      icon: Download, 
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isLoading: false // Placeholder
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-1 sm:p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 min-w-0 w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 text-muted-foreground ${card.color}`} />
            </CardHeader>
            <CardContent>
              {card.isLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {card.title === 'Total de Partituras' ? 'Cadastradas no sistema' : 
                  card.title === 'Total de Performances' ? 'Registradas no sistema' :
                  card.title === 'Total de Usuários' ? 'Registrados na plataforma' : 
                  'Desde o início'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-2 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mt-6">
        {/* Gráfico de Partituras por Compositor */}
        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Partituras por Compositor</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {chartConfigs.partiturasPorCompositor.type === 'bar' ? 'Barras' : 
                   chartConfigs.partiturasPorCompositor.type === 'area' ? 'Área' : 'Pizza'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChartConfigDialog 
                chartId="partiturasPorCompositor" 
                title="Partituras por Compositor"
                data={partiturasPorCompositor}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadChart('partiturasPorCompositor', 'png')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[400px] w-full">
                {partiturasPorCompositor.length > 0 ? (
                  renderChart('partiturasPorCompositor', partiturasPorCompositor, 'Partituras por Compositor')
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Nenhuma partitura cadastrada
                  </div>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Distribuição por Setor</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {chartConfigs.partiturasPorSetor.type === 'bar' ? 'Barras' : 
                   chartConfigs.partiturasPorSetor.type === 'area' ? 'Área' : 'Pizza'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChartConfigDialog 
                chartId="partiturasPorSetor" 
                title="Distribuição por Setor"
                data={partiturasPorSetor}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadChart('partiturasPorSetor', 'png')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[400px] w-full">
                {partiturasPorSetor.length > 0 ? (
                  renderChart('partiturasPorSetor', partiturasPorSetor, 'Distribuição por Setor')
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Nenhuma partitura cadastrada
                  </div>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Performances por Mês</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {chartConfigs.performancesPorMes.type === 'line' ? 'Linha' : 
                   chartConfigs.performancesPorMes.type === 'bar' ? 'Barras' : 
                   chartConfigs.performancesPorMes.type === 'area' ? 'Área' : 'Pizza'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChartConfigDialog 
                chartId="performancesPorMes" 
                title="Performances por Mês"
                data={performancesPorMes}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadChart('performancesPorMes', 'png')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[400px] w-full">
                {performancesPorMes.length > 0 ? (
                  chartConfigs.performancesPorMes.type === 'line' ? (
                    <LineChart data={performancesPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="performances" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  ) : (
                    renderChart('performancesPorMes', performancesPorMes, 'Performances por Mês')
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Nenhuma performance cadastrada
                  </div>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Status de Digitalização</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {chartConfigs.digitalizacaoStatus.type === 'bar' ? 'Barras' : 
                   chartConfigs.digitalizacaoStatus.type === 'area' ? 'Área' : 'Pizza'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChartConfigDialog 
                chartId="digitalizacaoStatus" 
                title="Status de Digitalização"
                data={digitalizacaoStatus}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadChart('digitalizacaoStatus', 'png')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[400px] w-full">
                {digitalizacaoStatus.length > 0 && digitalizacaoStatus.some(item => item.quantidade > 0) ? (
                  renderChart('digitalizacaoStatus', digitalizacaoStatus, 'Status de Digitalização')
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Nenhuma partitura cadastrada
                  </div>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção existente de atividades e eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPartituras.map((p) => (
                <div key={p.id} className="flex items-center space-x-4">
                <FileMusic className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nova partitura adicionada</p>
                    <p className="text-xs text-gray-500">{p.titulo} - {p.compositor}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('pt-BR')}</span>
                </div>
              ))}
              {recentPerformances.map((perf) => (
                <div key={perf.id} className="flex items-center space-x-4">
                <Calendar className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Performance agendada</p>
                    <p className="text-xs text-gray-500">{perf.titulo_obra || perf.titulo || 'Sem título'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(perf.data).toLocaleString('pt-BR')}</span>
                </div>
              ))}
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center space-x-4">
                <Users className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo usuário registrado</p>
                    <p className="text-xs text-gray-500">{u.nome} - {u.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(u.created_at || '').toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg min-w-0 w-full">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPerformances.length === 0 && (
                <div className="text-xs text-gray-500">Nenhum evento futuro agendado.</div>
              )}
              {upcomingPerformances.map((perf) => (
                <div key={perf.id} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-sm font-medium">{perf.titulo_obra || perf.titulo || 'Sem título'}</h4>
                  <p className="text-xs text-gray-500">{new Date(perf.data).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-400">{perf.local || ''}</p>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

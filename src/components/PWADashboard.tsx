import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  Database, 
  Bell, 
  Star, 
  Clock, 
  TrendingUp,
  Settings,
  Trash2,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { usePartituraCache } from '../hooks/usePartituraCache';
import { useDynamicShortcuts } from '../hooks/useDynamicShortcuts';
import { usePWAAnalytics } from '../hooks/usePWAAnalytics';
export const PWADashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cache' | 'sync' | 'analytics'>('overview');
  
  const { isOnline, isInstalled, installPWA, updatePWA, updateAvailable } = usePWA();
  const { syncStatus, offlineData, syncOfflineData, clearOfflineData } = useOfflineSync();
  const { cacheStats, cachedPartituras, clearAllCache } = usePartituraCache();
  const { shortcuts, getMostUsedShortcuts, clearAllShortcuts } = useDynamicShortcuts();
  const { metrics, userBehavior, getMetricsReport, clearMetrics } = usePWAAnalytics();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'cache', label: 'Cache', icon: Database },
    { id: 'sync', label: 'Sincronização', icon: RefreshCw },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard PWA</h2>
          <p className="text-muted-foreground">
            Gerencie funcionalidades avançadas do SiGDMus
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {isInstalled && (
            <Badge variant="secondary">
              <Smartphone className="h-3 w-3 mr-1" />
              Instalado
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status PWA */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status PWA</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Instalado</span>
                  <Badge variant={isInstalled ? "default" : "secondary"}>
                    {isInstalled ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Atualização</span>
                  <Badge variant={updateAvailable ? "destructive" : "secondary"}>
                    {updateAvailable ? "Disponível" : "Atualizado"}
                  </Badge>
                </div>
                {!isInstalled && (
                  <Button onClick={installPWA} className="w-full mt-2">
                    Instalar App
                  </Button>
                )}
                {updateAvailable && (
                  <Button onClick={updatePWA} variant="destructive" className="w-full mt-2">
                    Atualizar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cache Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache de Partituras</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Partituras</span>
                  <span className="font-medium">{cacheStats.itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Espaço usado</span>
                  <span className="font-medium">{formatBytes(cacheStats.totalSize)}</span>
                </div>
                <Progress 
                  value={(cacheStats.totalSize / (cacheStats.availableSpace + cacheStats.totalSize)) * 100} 
                  className="h-2"
                />
                <Button onClick={clearAllCache} variant="outline" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronização</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pendentes</span>
                  <span className="font-medium">{syncStatus.pendingItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={syncStatus.isSyncing ? "default" : "secondary"}>
                    {syncStatus.isSyncing ? "Sincronizando" : "Idle"}
                  </Badge>
                </div>
                {syncStatus.lastSync && (
                  <div className="text-xs text-muted-foreground">
                    Última sincronização: {new Date(syncStatus.lastSync).toLocaleString()}
                  </div>
                )}
                <Button onClick={syncOfflineData} disabled={syncStatus.pendingItems === 0} className="w-full">
                  Sincronizar Agora
                </Button>
              </div>
            </CardContent>
          </Card>



          {/* Analytics Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sessões</span>
                  <span className="font-medium">{metrics.sessionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo total</span>
                  <span className="font-medium">{formatTime(metrics.totalUsageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atalhos usados</span>
                  <span className="font-medium">{metrics.shortcutsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache hit rate</span>
                  <span className="font-medium">
                    {metrics.cacheHits + metrics.cacheMisses > 0 
                      ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivo</CardTitle>
              {userBehavior.deviceType === 'mobile' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
              {userBehavior.deviceType === 'desktop' && <Monitor className="h-4 w-4 text-muted-foreground" />}
              {userBehavior.deviceType === 'tablet' && <Tablet className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tipo</span>
                  <span className="font-medium capitalize">{userBehavior.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Navegador</span>
                  <span className="font-medium">{userBehavior.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sistema</span>
                  <span className="font-medium">{userBehavior.os}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Features */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionalidades Mais Usadas</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(userBehavior.mostUsedFeatures)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([feature, count]) => (
                    <div key={feature} className="flex justify-between">
                      <span className="text-sm">{feature}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'cache' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partituras em Cache</CardTitle>
              <CardDescription>
                Gerencie as partituras salvas para uso offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cachedPartituras.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma partitura em cache</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cachedPartituras.map((partitura) => (
                    <div key={partitura.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{partitura.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {partitura.composer} • {partitura.instrument}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Último acesso: {new Date(partitura.lastAccessed).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatBytes(partitura.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Offline</CardTitle>
              <CardDescription>
                Gerencie dados salvos offline que serão sincronizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offlineData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado offline pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offlineData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.action} • {new Date(item.timestamp).toLocaleString()}
                        </p>
                        {item.retryCount > 0 && (
                          <p className="text-xs text-orange-600">
                            Tentativas: {item.retryCount}
                          </p>
                        )}
                      </div>
                      <Badge variant={item.retryCount > 0 ? "destructive" : "secondary"}>
                        {item.retryCount > 0 ? "Erro" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado</CardTitle>
              <CardDescription>
                Métricas detalhadas de uso do PWA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.sessionCount}</div>
                  <div className="text-sm text-muted-foreground">Sessões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(metrics.totalUsageTime)}</div>
                  <div className="text-sm text-muted-foreground">Tempo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.shortcutsUsed}</div>
                  <div className="text-sm text-muted-foreground">Atalhos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.pushNotificationsReceived}</div>
                  <div className="text-sm text-muted-foreground">Notificações</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Horários Preferidos</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(userBehavior.preferredTimes)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([timeSlot, count]) => (
                    <div key={timeSlot} className="flex justify-between py-2">
                      <span>{timeSlot}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => getMetricsReport()} variant="outline" className="w-full">
                  Gerar Relatório
                </Button>
                <Button onClick={clearMetrics} variant="destructive" className="w-full">
                  Limpar Métricas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}; 
import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Database,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import { cn } from '@/lib/utils';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'warning';
  message: string;
  responseTime?: number;
  configured?: boolean;
}

interface HealthData {
  status: string;
  timestamp: number;
  database: ServiceHealth;
  ai: ServiceHealth;
}

export function HealthIndicators() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      setHealth(data);
      setLastRefresh(new Date());
      console.log('[HealthIndicators] Health check:', data);
    } catch (err) {
      console.error('[HealthIndicators] Failed to fetch health status:', err);
      setHealth({
        status: 'unhealthy',
        timestamp: Date.now(),
        database: {
          status: 'unhealthy',
          message: 'Failed to fetch health status',
        },
        ai: { status: 'unhealthy', message: 'Failed to fetch health status' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10';
      case 'degraded':
        return 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10';
      case 'unhealthy':
        return 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10';
      default:
        return 'border-border bg-card';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'warning':
        return 'Warning';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card
      className={cn(
        'border transition-all duration-300',
        getStatusColor(health.status),
      )}
    >
      <CardContent className="pt-4 pb-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              System Health
            </h3>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh health status"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Overall Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(health.status)}
            <span className="text-xs font-medium text-muted-foreground">
              Overall:{' '}
              <span className="text-foreground">
                {getStatusText(health.status)}
              </span>
            </span>
          </div>

          {/* Services */}
          <div className="space-y-2">
            {/* Database */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 min-w-0">
                <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">Database</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {health.database.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {health.database.responseTime !== undefined && (
                  <span className="text-[10px] text-muted-foreground">
                    {health.database.responseTime}ms
                  </span>
                )}
                {getStatusIcon(health.database.status)}
              </div>
            </div>

            {/* AI Service */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">AI Service</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {health.ai.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {getStatusIcon(health.ai.status)}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastRefresh && (
            <p className="text-[10px] text-muted-foreground text-center">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

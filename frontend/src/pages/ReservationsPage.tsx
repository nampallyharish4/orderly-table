import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CalendarDays } from 'lucide-react';

type ReservationRow = Record<string, unknown>;
type ReservationStatus = 'waitlist' | 'confirmed';

interface ReservationResponse {
  count: number;
  items: ReservationRow[];
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }

  return String(value);
}

export default function ReservationsPage() {
  const [items, setItems] = useState<ReservationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingRowKey, setUpdatingRowKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    items.forEach((item) => {
      Object.keys(item).forEach((key) => keys.add(key));
    });
    return Array.from(keys).filter((key) => key !== 'party_size');
  }, [items]);

  const fetchReservations = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const response = await api.get<ReservationResponse>('/api/reservations');
      setItems(response.data.items ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reservations'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getRowKey = (item: ReservationRow, rowIndex: number): string => {
    const visibleId = item.visible_id;
    if (typeof visibleId === 'string' && visibleId.trim()) {
      return visibleId;
    }

    const id = item.id;
    if (id !== null && id !== undefined) {
      return String(id);
    }

    return `row-${rowIndex}`;
  };

  const getReservationIdentifier = (
    item: ReservationRow,
    rowIndex: number,
  ): string => {
    const visibleId = item.visible_id;
    if (typeof visibleId === 'string' && visibleId.trim()) {
      return visibleId;
    }

    const id = item.id;
    if (id !== null && id !== undefined) {
      return String(id);
    }

    return String(rowIndex);
  };

  const getStatusValue = (item: ReservationRow): '' | ReservationStatus => {
    const status =
      typeof item.status === 'string' ? item.status.toLowerCase() : '';
    if (status === 'waitlist' || status === 'confirmed') {
      return status;
    }

    return '';
  };

  const updateReservationStatus = async (
    item: ReservationRow,
    rowIndex: number,
    status: ReservationStatus,
  ) => {
    const rowKey = getRowKey(item, rowIndex);
    const reservationIdentifier = getReservationIdentifier(item, rowIndex);

    setUpdatingRowKey(rowKey);
    setError(null);

    try {
      await api.patch(
        `/api/reservations/${encodeURIComponent(reservationIdentifier)}/status`,
        {
          status,
        },
      );

      setItems((prevItems) =>
        prevItems.map((row, idx) => {
          if (idx !== rowIndex) return row;
          return {
            ...row,
            status,
          };
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update reservation status'));
    } finally {
      setUpdatingRowKey(null);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">
            Reservations
          </h1>
          <p className="text-muted-foreground mt-1">
            Live reservation records from Supabase
          </p>
        </div>
        <Button
          onClick={() => fetchReservations(true)}
          disabled={isRefreshing || isLoading}
          className="sm:w-auto"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Reservation Records
          </CardTitle>
          <Badge variant="secondary">{items.length} total</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading reservations...
              </span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-border/70 p-8 text-center text-muted-foreground">
              No reservations found in the Supabase reservations table.
            </div>
          ) : (
            <div className="rounded-lg border border-border/70 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="text-left px-4 py-3 font-semibold whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Status Update
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, rowIndex) => (
                    <tr
                      key={getRowKey(item, rowIndex)}
                      className="border-t border-border/60 hover:bg-muted/30"
                    >
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column}`}
                          className="px-4 py-3 align-top"
                        >
                          <span className="break-words">
                            {formatCellValue(item[column])}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <select
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            value={getStatusValue(item)}
                            disabled={
                              updatingRowKey === getRowKey(item, rowIndex)
                            }
                            onChange={(event) => {
                              const nextStatus = event.target
                                .value as ReservationStatus;
                              if (
                                nextStatus === 'waitlist' ||
                                nextStatus === 'confirmed'
                              ) {
                                updateReservationStatus(
                                  item,
                                  rowIndex,
                                  nextStatus,
                                );
                              }
                            }}
                          >
                            <option value="" disabled>
                              Select
                            </option>
                            <option value="waitlist">waitlist</option>
                            <option value="confirmed">confirmed</option>
                          </select>
                          {updatingRowKey === getRowKey(item, rowIndex) && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

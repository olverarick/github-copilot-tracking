import React, {
  createContext, useContext, useState, useCallback, useEffect,
} from 'react';
import api from '../services/api';
import type {
  Summary, UserMetrics, TeamMetrics, ModelMetrics,
  DailyTrend, AvailablePeriod, LastUpload, Filters, Period, UploadResult,
} from '../types';

// ─── Context shape ────────────────────────────────────────────────────────────

interface DataContextValue {
  summary:          Summary | null;
  previousSummary:  Summary | null;
  users:            UserMetrics[];
  previousUsers:    UserMetrics[];
  currentQuota:     number | null;
  currentQuotaLabel: string | null;
  teams:            TeamMetrics[];
  models:           ModelMetrics[];
  dailyTrend:       DailyTrend[];
  lastUpload:       LastUpload | null;
  availablePeriods: AvailablePeriod[];
  loading:          boolean;
  error:            string | null;
  filters:          Filters;
  loadData:         (period: Period | null) => Promise<void>;
  uploadPremiumRequests: (file: File) => Promise<UploadResult>;
  uploadTeamCsv:    (file: File, teamName: string, year: number) => Promise<UploadResult>;
  getFilteredUsers: () => UserMetrics[];
  updateFilters:    (f: Partial<Filters>) => void;
  clearFilters:     () => void;
  setPeriod:        (period: Period | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const useData = (): DataContextValue => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary,          setSummary]          = useState<Summary | null>(null);
  const [previousSummary,  setPreviousSummary]  = useState<Summary | null>(null);
  const [users,            setUsers]            = useState<UserMetrics[]>([]);
  const [previousUsers,    setPreviousUsers]    = useState<UserMetrics[]>([]);
  const [teams,            setTeams]            = useState<TeamMetrics[]>([]);
  const [models,           setModels]           = useState<ModelMetrics[]>([]);
  const [dailyTrend,       setDailyTrend]       = useState<DailyTrend[]>([]);
  const [lastUpload,       setLastUpload]        = useState<LastUpload | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [filters,          setFilters]          = useState<Filters>({
    teamFilter:     '',
    categoryFilter: '',
    searchQuery:    '',
    selectedPeriod: null,
  });

  const loadData = useCallback(async (period: Period | null) => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData, usersData, teamsData, modelsData,
        trendData, uploadData, periodsData,
      ] = await Promise.all([
        api.getSummary(period),
        api.getUsers(period),
        api.getTeams(period),
        api.getModels(period),
        api.getDailyTrend(period),
        api.getLastUpload(),
        api.getAvailablePeriods(),
      ]);
      setSummary(summaryData);
      setUsers(usersData);
      setTeams(teamsData);
      setModels(modelsData);
      setDailyTrend(trendData);
      setLastUpload(uploadData);
      setAvailablePeriods(periodsData);

      // Fetch previous period for KPI comparison
      if (period) {
        const prevMonth = period.month === 1 ? 12 : period.month - 1;
        const prevYear  = period.month === 1 ? period.year - 1 : period.year;
        const prevExists = periodsData.some(
          (p: AvailablePeriod) => p.year === prevYear && p.month === prevMonth,
        );
        if (prevExists) {
          try {
            const prevP = { year: prevYear, month: prevMonth };
            const [pSum, pUsr] = await Promise.all([
              api.getSummary(prevP),
              api.getUsers(prevP),
            ]);
            setPreviousSummary(pSum);
            setPreviousUsers(pUsr);
          } catch { setPreviousSummary(null); setPreviousUsers([]); }
        } else { setPreviousSummary(null); setPreviousUsers([]); }
      } else { setPreviousSummary(null); setPreviousUsers([]); }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: fetch periods, determine best period, then load data directly.
  // Priority: URL params → most recent period from API → null (all periods).
  // Calling loadData directly (not via useEffect) avoids any race between
  // setting selectedPeriod and the data-loading effect firing with null.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const periods = await api.getAvailablePeriods();
        setAvailablePeriods(periods);

        let period: Period | null = null;

        // Try to restore period from URL query params first
        const params = new URLSearchParams(window.location.search);
        const urlYear  = params.get('year');
        const urlMonth = params.get('month');
        if (urlYear && urlMonth) {
          const y = parseInt(urlYear, 10);
          const m = parseInt(urlMonth, 10);
          if (!isNaN(y) && !isNaN(m)) period = { year: y, month: m };
        }

        // Fall back to most recent period (backend returns newest-first)
        if (!period && periods.length > 0) {
          period = { year: periods[0].year, month: periods[0].month };
        }

        if (period) setFilters(prev => ({ ...prev, selectedPeriod: period }));
        await loadData(period);
      } catch {
        // periods fetch failed — loadData handles its own error state
        await loadData(null);
      }
    };
    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setPeriod = useCallback((period: Period | null) => {
    // Never allow null — always stay on a specific month
    const resolved = period ?? (availablePeriods[0] ? { year: availablePeriods[0].year, month: availablePeriods[0].month } : null);
    setFilters(prev => ({ ...prev, selectedPeriod: resolved }));
    // Load data immediately — do not rely on useEffect watching selectedPeriod
    loadData(resolved);
  }, [availablePeriods, loadData]);

  const uploadPremiumRequests = async (file: File): Promise<UploadResult> => {
    const result = await api.uploadPremiumRequests(file);
    await loadData(filters.selectedPeriod);
    return result;
  };

  const uploadTeamCsv = async (file: File, teamName: string, year: number): Promise<UploadResult> => {
    const result = await api.uploadTeamCsvWithYear(file, teamName, year);
    await loadData(filters.selectedPeriod);
    return result;
  };

  const getFilteredUsers = useCallback((): UserMetrics[] => {
    let filtered = [...users];
    if (filters.teamFilter) {
      filtered = filtered.filter(u => u.equipo === filters.teamFilter);
    }
    if (filters.categoryFilter) {
      filtered = filtered.filter(u => u.categoriaUso === filters.categoryFilter);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.username.toLowerCase().includes(q));
    }
    return filtered;
  }, [users, filters]);

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    // Preserve selectedPeriod — the analysis is always scoped to a month
    setFilters(prev => ({ teamFilter: '', categoryFilter: '', searchQuery: '', selectedPeriod: prev.selectedPeriod }));
  };

  const currentQuota = users[0]?.monthlyQuota ?? null;
  const currentQuotaLabel = users[0]?.quotaLabel ?? null;

  return (
    <DataContext.Provider value={{
      summary, previousSummary, users, previousUsers,
      currentQuota, currentQuotaLabel,
      teams, models, dailyTrend, lastUpload,
      availablePeriods, loading, error, filters,
      loadData, uploadPremiumRequests, uploadTeamCsv,
      getFilteredUsers, updateFilters, clearFilters, setPeriod,
    }}>
      {children}
    </DataContext.Provider>
  );
};

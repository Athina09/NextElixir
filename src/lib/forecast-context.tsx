import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  predictForecast,
  generateInsights,
  INITIAL_BUDGET,
  type BudgetAllocation,
  type ForecastResult,
  type Horizon,
  type Insights,
  type Level,
} from "./forecast";

interface State {
  budget: BudgetAllocation;
  horizon: Horizon;
  level: Level;
  channelFilter: string;
}

type Action =
  | { type: "SET_BUDGET"; payload: Partial<BudgetAllocation> }
  | { type: "SET_HORIZON"; payload: Horizon }
  | { type: "SET_LEVEL"; payload: Level }
  | { type: "SET_CHANNEL"; payload: string }
  | { type: "RESET" };

const initialState: State = {
  budget: INITIAL_BUDGET,
  horizon: 60,
  level: "aggregate",
  channelFilter: "all",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_BUDGET":
      return { ...state, budget: { ...state.budget, ...action.payload } };
    case "SET_HORIZON":
      return { ...state, horizon: action.payload };
    case "SET_LEVEL":
      return { ...state, level: action.payload };
    case "SET_CHANNEL":
      return { ...state, channelFilter: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  forecast: ForecastResult | null;
  insights: Insights | null;
  loading: boolean;
  insightsLoading: boolean;
  runAt: number;
  refresh: () => void;
}

const ForecastContext = createContext<Ctx | null>(null);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [runAt, setRunAt] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const execute = useCallback(() => {
    const id = ++runIdRef.current;
    const totalBudget =
      state.budget.google + state.budget.meta + state.budget.microsoft;

    // Clear the previous series so the chart remounts empty, then redraws from
    // scratch when the new response arrives (slider / horizon changes).
    setForecast(null);
    setInsights(null);
    setLoading(true);
    setInsightsLoading(true);
    setRunAt(Date.now());

    if (totalBudget <= 0) {
      setLoading(false);
      setInsightsLoading(false);
      return;
    }

    predictForecast(state.budget, state.horizon)
      .then((r) => {
        if (id !== runIdRef.current) return;
        setForecast(r);
        setLoading(false);
        setRunAt(Date.now());
        generateInsights(r)
          .then((ins) => {
            if (id !== runIdRef.current) return;
            setInsights(ins);
            setInsightsLoading(false);
          })
          .catch((err) => {
            if (id !== runIdRef.current) return;
            // AI insights are best-effort (e.g. GROQ_API_KEY not configured yet) —
            // the forecast itself already rendered, so degrade quietly rather than hang.
            console.warn("AI insights unavailable:", err instanceof Error ? err.message : err);
            setInsights(null);
            setInsightsLoading(false);
          });
      })
      .catch((err) => {
        if (id !== runIdRef.current) return;
        console.error("Forecast request failed:", err instanceof Error ? err.message : err);
        setLoading(false);
        setInsightsLoading(false);
      });
  }, [state.budget, state.horizon]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(execute, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [execute]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      forecast,
      insights,
      loading,
      insightsLoading,
      runAt,
      refresh: execute,
    }),
    [state, forecast, insights, loading, insightsLoading, runAt, execute],
  );

  return <ForecastContext.Provider value={value}>{children}</ForecastContext.Provider>;
}

export function useForecast() {
  const ctx = useContext(ForecastContext);
  if (!ctx) throw new Error("useForecast must be used inside ForecastProvider");
  return ctx;
}

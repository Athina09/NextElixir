import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useForecast } from "@/lib/forecast-context";
import { generateResponse, type AssistantPayload, type MessageKind } from "@/services/chatService";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  kind: MessageKind;
  text: string;
  createdAt: number;
  status?: "pending" | "streaming" | "done" | "error";
  payload?: AssistantPayload;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  bucket: "today" | "yesterday" | "week";
  messages: ChatMessage[];
  /** The backend ChatSession id this conversation maps to, once the first
   * real reply comes back — keeps every turn in one server-side history. */
  backendSessionId?: number;
}

interface Ctx {
  conversations: Conversation[];
  activeId: string;
  active: Conversation;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  newConversation: () => void;
  selectConversation: (id: string) => void;
}

const ChatContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

const DAY = 24 * 60 * 60 * 1000;

function seedConversations(): Conversation[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "Q3 budget rebalance",
      createdAt: now,
      updatedAt: now,
      bucket: "today",
      messages: [],
    },
    {
      id: uid(),
      title: "Meta ROAS decline",
      createdAt: now - DAY,
      updatedAt: now - DAY,
      bucket: "yesterday",
      messages: [
        {
          id: uid(),
          role: "user",
          kind: "user",
          text: "Why is Meta ROAS trending down?",
          createdAt: now - DAY,
          status: "done",
        },
        {
          id: uid(),
          role: "assistant",
          kind: "assistant",
          text: "Meta ROAS has softened due to attribution signal decay and a compressed conversion window on iOS traffic. The model expects partial recovery over the next 14 days.",
          createdAt: now - DAY + 5000,
          status: "done",
        },
      ],
    },
    {
      id: uid(),
      title: "Search share of revenue",
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
      bucket: "week",
      messages: [],
    },
  ];
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const forecast = useForecast();
  const [conversations, setConversations] = useState<Conversation[]>(() => seedConversations());
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastPromptRef = useRef<string>("");

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const patchConversation = useCallback((id: string, mut: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? mut(c) : c)));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || loading) return;
      lastPromptRef.current = clean;
      const now = Date.now();
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        kind: "user",
        text: clean,
        createdAt: now,
        status: "done",
      };
      const pendingId = uid();
      const pendingMsg: ChatMessage = {
        id: pendingId,
        role: "assistant",
        kind: "assistant",
        text: "",
        createdAt: now + 1,
        status: "pending",
      };

      patchConversation(active.id, (c) => ({
        ...c,
        title:
          c.messages.length === 0 ? clean.slice(0, 48) + (clean.length > 48 ? "…" : "") : c.title,
        updatedAt: now,
        messages: [...c.messages, userMsg, pendingMsg],
      }));
      setLoading(true);

      try {
        const payload = await generateResponse(clean, {
          budget: forecast.state.budget,
          forecast: forecast.forecast,
          insights: forecast.insights,
          horizon: forecast.state.horizon,
          level: forecast.state.level,
          channel: forecast.state.channelFilter,
          sessionId: active.backendSessionId,
        });
        patchConversation(active.id, (c) => ({
          ...c,
          backendSessionId: payload.sessionId ?? c.backendSessionId,
          updatedAt: Date.now(),
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  kind: payload.kind,
                  text: payload.markdown,
                  payload,
                  status: "done",
                }
              : m,
          ),
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Request failed. Retry to regenerate the response.";
        patchConversation(active.id, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId ? { ...m, status: "error", text: message } : m,
          ),
        }));
      } finally {
        setLoading(false);
      }
    },
    [active, forecast, loading, patchConversation],
  );

  const retry = useCallback(async () => {
    if (!lastPromptRef.current) return;
    // Trim the last assistant error/pending message before retrying.
    patchConversation(active.id, (c) => {
      const msgs = [...c.messages];
      if (msgs.length && msgs[msgs.length - 1].role === "assistant") msgs.pop();
      return { ...c, messages: msgs };
    });
    await send(lastPromptRef.current);
  }, [active, patchConversation, send]);

  const newConversation = useCallback(() => {
    const now = Date.now();
    const c: Conversation = {
      id: uid(),
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      bucket: "today",
      messages: [],
    };
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }, []);

  const selectConversation = useCallback((id: string) => setActiveId(id), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const value = useMemo<Ctx>(
    () => ({
      conversations,
      activeId: active.id,
      active,
      loading,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      send,
      retry,
      newConversation,
      selectConversation,
    }),
    [
      conversations,
      active,
      loading,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      send,
      retry,
      newConversation,
      selectConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}

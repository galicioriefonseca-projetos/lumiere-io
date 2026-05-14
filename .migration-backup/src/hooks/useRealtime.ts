import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName =
  | "achievements"
  | "evaluations"
  | "salon_goals"
  | "badges"
  | "client_records"
  | "commissions"
  | "service_categories"
  | "professionals"
  | "appointments"
  | "services";

type Subscription = {
  table: TableName;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  /** Optional handler — called for each change */
  onChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** React Query keys to invalidate when changes happen (string prefix or full key) */
  invalidate?: (string | unknown[])[];
};

/**
 * Centralized realtime hook scoped to a salon.
 * Creates ONE channel per (channelName + salonId) and multiplexes table subscriptions.
 */
export const useRealtime = (
  channelName: string,
  salonId: string | null | undefined,
  subs: Subscription[],
) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!salonId) return;
    const instanceId = Math.random().toString(36).substring(7);
    const ch = supabase.channel(`${channelName}-${salonId}-${instanceId}`);

    subs.forEach((s) => {
      (ch as unknown as {
        on: (
          ev: "postgres_changes",
          cfg: { event: string; schema: string; table: string; filter: string },
          cb: (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
        ) => unknown;
      }).on(
        "postgres_changes",
        { event: s.event ?? "*", schema: "public", table: s.table, filter: `salon_id=eq.${salonId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          s.onChange?.(payload);
          (s.invalidate ?? []).forEach((k) => {
            if (Array.isArray(k)) qc.invalidateQueries({ queryKey: k });
            else qc.invalidateQueries({ queryKey: [k] });
          });
        },
      );
    });

    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, channelName]);
};

/**
 * Presence helper for "who's online now" — used by Modo TV.
 */
export const usePresence = (
  channelName: string,
  salonId: string | null | undefined,
  identity: { id: string; name: string; role?: string } | null,
  onSync?: (state: Record<string, Array<{ id: string; name: string; role?: string }>>) => void,
) => {
  useEffect(() => {
    if (!salonId || !identity) return;
    const instanceId = Math.random().toString(36).substring(7);
    const ch = supabase.channel(`${channelName}-${salonId}-${instanceId}`, {
      config: { presence: { key: identity.id } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<
        string,
        Array<{ id: string; name: string; role?: string }>
      >;
      onSync?.(state);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ id: identity.id, name: identity.name, role: identity.role });
      }
    });

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId, identity?.id, channelName]);
};

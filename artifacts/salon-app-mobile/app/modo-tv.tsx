import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

type Appointment = {
  id: string;
  client_name?: string;
  professional_name?: string;
  service_name?: string;
  scheduled_at?: string;
  status?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Aguardando", color: "#f4c430", bg: "#2a2000" },
  confirmed: { label: "Confirmado",  color: "#6ea8fe", bg: "#001a2a" },
  completed: { label: "Concluído",   color: "#5fc97c", bg: "#0e2a14" },
  cancelled: { label: "Cancelado",   color: "#df2b2b", bg: "#2b0a0a" },
  pendente:  { label: "Aguardando", color: "#f4c430", bg: "#2a2000" },
  confirmado:{ label: "Confirmado",  color: "#6ea8fe", bg: "#001a2a" },
  concluido: { label: "Concluído",   color: "#5fc97c", bg: "#0e2a14" },
  cancelado: { label: "Cancelado",   color: "#df2b2b", bg: "#2b0a0a" },
};

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function AppCard({ item }: { item: Appointment }) {
  const sc = STATUS_CONFIG[item.status ?? ""] ?? { label: item.status ?? "—", color: C.mutedForeground, bg: C.muted };
  return (
    <View style={[styles.card, { borderLeftColor: sc.color }]}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(item.scheduled_at)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.clientName}>{item.client_name ?? "Cliente"}</Text>
        <View style={styles.metaRow}>
          {item.professional_name && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={11} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.professional_name}</Text>
            </View>
          )}
          {item.service_name && (
            <View style={styles.metaItem}>
              <Ionicons name="cut-outline" size={11} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.service_name}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
        <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
      </View>
    </View>
  );
}

export default function ModoTvScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = now.toISOString().slice(0, 10);

  const { data, refetch } = useQuery({
    queryKey: ["tv-appointments", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, client_name, service_name, scheduled_at, status, professionals(name)")
        .gte("scheduled_at", `${today}T00:00:00`)
        .lte("scheduled_at", `${today}T23:59:59`)
        .order("scheduled_at");
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        professional_name: a.professionals?.name,
      })) as Appointment[];
    },
    refetchInterval: 30_000,
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[C.accent + "18", "transparent"]}
        style={styles.glowOverlay}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.logoRow}>
            <Ionicons name="diamond-outline" size={18} color={C.accent} />
            <Text style={styles.brand}>Lumière</Text>
          </View>
          <Text style={styles.dateText}>
            {now.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </Text>
        </View>

        <View style={styles.clockBox}>
          <Text style={styles.clock}>
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {["pending", "confirmed", "completed"].map((s) => {
          const count = (data ?? []).filter(
            (a) => a.status === s || a.status === { pending: "pendente", confirmed: "confirmado", completed: "concluido" }[s]
          ).length;
          const sc = STATUS_CONFIG[s];
          return (
            <View key={s} style={[styles.statChip, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statCount, { color: sc.color }]}>{count}</Text>
              <Text style={[styles.statLabel, { color: sc.color }]}>{sc.label}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AppCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="calendar-outline" size={40} color={C.border} />
            <Text style={styles.emptyText}>Nenhum agendamento para hoje</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    bottom: "70%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerCenter: { flex: 1 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.accent,
    letterSpacing: 1.2,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
    textTransform: "capitalize",
    marginTop: 2,
  },
  clockBox: {
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clock: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.foreground,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statChip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  statCount: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: "center",
  },
  timeCol: { minWidth: 46 },
  time: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.accent },
  cardBody: { flex: 1, gap: 4 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground },
  metaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  centered: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
});

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

type Goal = {
  id: string;
  title?: string;
  description?: string;
  target_revenue?: number;
  current_revenue?: number;
  target_appointments?: number;
  current_appointments?: number;
  period?: string;
  status?: string;
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.max(0, max > 0 ? value / max : 0), 1);
  return (
    <View style={progStyles.track}>
      <View style={[progStyles.fill, { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

const progStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: C.muted, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  fill: { height: 6, borderRadius: 3 },
});

function GoalCard({ item }: { item: Goal }) {
  const hasRevGoal = item.target_revenue != null;
  const hasApptGoal = item.target_appointments != null;
  const revPct = hasRevGoal ? Math.min(1, (item.current_revenue ?? 0) / (item.target_revenue ?? 1)) : 0;
  const apptPct = hasApptGoal ? Math.min(1, (item.current_appointments ?? 0) / (item.target_appointments ?? 1)) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.title}>{item.title ?? item.period ?? "Meta"}</Text>
        {item.status && (
          <View style={[styles.statusPill, item.status === "completed" && styles.statusCompleted]}>
            <Text style={styles.statusText}>
              {item.status === "completed" ? "Concluída" : "Em andamento"}
            </Text>
          </View>
        )}
      </View>
      {item.description && <Text style={styles.desc}>{item.description}</Text>}
      {hasRevGoal && (
        <View style={styles.metricBlock}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Receita</Text>
            <Text style={styles.metricValue}>
              R$ {Number(item.current_revenue ?? 0).toLocaleString("pt-BR")} /
              R$ {Number(item.target_revenue).toLocaleString("pt-BR")}
            </Text>
          </View>
          <ProgressBar value={item.current_revenue ?? 0} max={item.target_revenue ?? 1} color={C.accent} />
          <Text style={styles.pctText}>{Math.round(revPct * 100)}%</Text>
        </View>
      )}
      {hasApptGoal && (
        <View style={styles.metricBlock}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Atendimentos</Text>
            <Text style={styles.metricValue}>
              {item.current_appointments ?? 0} / {item.target_appointments}
            </Text>
          </View>
          <ProgressBar value={item.current_appointments ?? 0} max={item.target_appointments ?? 1} color="#6ea8fe" />
          <Text style={styles.pctText}>{Math.round(apptPct * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

export default function MetasScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["salon-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salon_goals")
        .select("id, title, description, target_revenue, current_revenue, target_appointments, current_appointments, period, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Metas</Text>
        <Text style={styles.count}>{data ? `${data.length}` : ""}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar metas</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GoalCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="flag-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhuma meta cadastrada</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.foreground, flex: 1 },
  count: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.foreground, flex: 1 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#1a2a3a",
  },
  statusCompleted: { backgroundColor: "#0e2a14" },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#6ea8fe" },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground },
  metricBlock: { gap: 4 },
  metricRow: { flexDirection: "row", justifyContent: "space-between" },
  metricLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  metricValue: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.foreground },
  pctText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground, textAlign: "right" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  retryText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.accent },
});

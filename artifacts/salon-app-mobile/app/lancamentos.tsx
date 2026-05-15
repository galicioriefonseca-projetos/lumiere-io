import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type Entry = {
  id: string;
  description?: string;
  amount: number;
  type?: "income" | "expense" | "entrada" | "saida";
  category?: string;
  created_at: string;
  professional_name?: string;
};

const FILTERS = ["Todos", "Entradas", "Saídas"];

function EntryCard({ item }: { item: Entry }) {
  const isIncome = item.type === "income" || item.type === "entrada";
  const color = isIncome ? "#5fc97c" : "#df2b2b";
  const bg = isIncome ? "#0e2a14" : "#2b0a0a";
  const sign = isIncome ? "+" : "-";

  return (
    <View style={styles.card}>
      <View style={[styles.typeIcon, { backgroundColor: bg }]}>
        <Ionicons
          name={isIncome ? "arrow-down-circle" : "arrow-up-circle"}
          size={22}
          color={color}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.desc}>{item.description ?? item.category ?? "Lançamento"}</Text>
          <Text style={[styles.amount, { color }]}>
            {sign} R$ {Math.abs(Number(item.amount)).toLocaleString("pt-BR")}
          </Text>
        </View>
        <View style={styles.meta}>
          {item.category && item.description && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={11} color={C.mutedForeground} />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          {item.professional_name && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={11} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.professional_name}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function LancamentosScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const [filter, setFilter] = useState("Todos");

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["lancamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("id, description, amount, type, category, created_at, professionals(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((l: any) => ({
        ...l,
        professional_name: l.professionals?.name,
      })) as Entry[];
    },
  });

  const filtered = (data ?? []).filter((e) => {
    if (filter === "Entradas") return e.type === "income" || e.type === "entrada";
    if (filter === "Saídas") return e.type === "expense" || e.type === "saida";
    return true;
  });

  const totalIncome = (data ?? [])
    .filter((e) => e.type === "income" || e.type === "entrada")
    .reduce((s, e) => s + e.amount, 0);
  const totalExpense = (data ?? [])
    .filter((e) => e.type === "expense" || e.type === "saida")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Lançamentos</Text>
      </View>

      {data && data.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Ionicons name="arrow-down-circle" size={14} color="#5fc97c" />
            <Text style={styles.summaryLabel}>Entradas</Text>
            <Text style={[styles.summaryValue, { color: "#5fc97c" }]}>
              R$ {totalIncome.toLocaleString("pt-BR")}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="arrow-up-circle" size={14} color="#df2b2b" />
            <Text style={styles.summaryLabel}>Saídas</Text>
            <Text style={[styles.summaryValue, { color: "#df2b2b" }]}>
              R$ {totalExpense.toLocaleString("pt-BR")}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="swap-vertical" size={14} color={C.accent} />
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[styles.summaryValue, { color: C.accent }]}>
              R$ {(totalIncome - totalExpense).toLocaleString("pt-BR")}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar lançamentos</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EntryCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="receipt-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
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
  summary: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryDivider: { width: 1, backgroundColor: C.border },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.foreground },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.accent + "22", borderColor: C.accent },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.mutedForeground },
  filterTextActive: { color: C.accent },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  desc: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.foreground, flex: 1, marginRight: 8 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  tag: {
    backgroundColor: C.muted,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
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

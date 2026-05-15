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

type Commission = {
  id: string;
  professional_name?: string;
  amount?: number;
  percentage?: number;
  period?: string;
  status?: string;
  service_name?: string;
  created_at?: string;
};

function CommissionCard({ item }: { item: Commission }) {
  const isPaid = item.status === "paid" || item.status === "pago";
  return (
    <View style={styles.card}>
      <View style={[styles.cardLeft, { backgroundColor: isPaid ? "#5fc97c22" : "#fb923c22" }]}>
        <Ionicons
          name={isPaid ? "checkmark-circle" : "hourglass-outline"}
          size={20}
          color={isPaid ? "#5fc97c" : "#fb923c"}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.profName}>{item.professional_name ?? "Profissional"}</Text>
          {item.amount != null && (
            <Text style={[styles.amount, isPaid && { color: "#5fc97c" }]}>
              R$ {Number(item.amount).toLocaleString("pt-BR")}
            </Text>
          )}
        </View>
        <View style={styles.meta}>
          {item.service_name && (
            <View style={styles.metaItem}>
              <Ionicons name="cut-outline" size={12} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.service_name}</Text>
            </View>
          )}
          {item.percentage != null && (
            <View style={styles.metaItem}>
              <Ionicons name="percent-outline" size={12} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.percentage}%</Text>
            </View>
          )}
          {item.period && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.period}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusPill, { backgroundColor: isPaid ? "#0e2a14" : "#2a1800" }]}>
          <Text style={[styles.statusText, { color: isPaid ? "#5fc97c" : "#fb923c" }]}>
            {isPaid ? "Pago" : "Pendente"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ComissoesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, amount, percentage, period, status, service_name, created_at, professionals(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        professional_name: c.professionals?.name,
      })) as Commission[];
    },
  });

  const total = (data ?? []).reduce((s, c) => s + (c.amount ?? 0), 0);
  const paid = (data ?? []).filter((c) => c.status === "paid" || c.status === "pago")
    .reduce((s, c) => s + (c.amount ?? 0), 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Comissões</Text>
      </View>

      {data && data.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>R$ {Number(total).toLocaleString("pt-BR")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pago</Text>
            <Text style={[styles.summaryValue, { color: "#5fc97c" }]}>
              R$ {Number(paid).toLocaleString("pt-BR")}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pendente</Text>
            <Text style={[styles.summaryValue, { color: "#fb923c" }]}>
              R$ {Number(total - paid).toLocaleString("pt-BR")}
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar comissões</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommissionCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="cash-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhuma comissão registrada</Text>
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
    paddingVertical: 14,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryDivider: { width: 1, backgroundColor: C.border },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.foreground },
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
  cardLeft: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  profName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground, flex: 1 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.foreground },
  meta: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 11 },
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

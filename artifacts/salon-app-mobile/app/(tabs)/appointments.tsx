import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
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
const TAB_BAR_H = Platform.OS === "web" ? 84 : 70;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> =
  {
    pending: { label: "Pendente", color: "#f4c430", bg: "#2a2000" },
    confirmed: { label: "Confirmado", color: "#5fc97c", bg: "#0e2a14" },
    completed: { label: "Concluído", color: "#6ea8fe", bg: "#0b1a33" },
    cancelled: { label: "Cancelado", color: "#df2b2b", bg: "#2b0a0a" },
  };

type Appointment = {
  id: string;
  client_name?: string;
  service_name?: string;
  scheduled_at?: string;
  status?: string;
  professional_name?: string;
  value?: number;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AppointmentCard({ item }: { item: Appointment }) {
  const statusInfo = STATUS_MAP[item.status ?? ""] ?? {
    label: item.status ?? "—",
    color: C.mutedForeground,
    bg: C.card,
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.clientName}>
            {item.client_name ?? "Cliente"}
          </Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusInfo.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        {item.service_name && (
          <Text style={styles.service}>{item.service_name}</Text>
        )}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={C.mutedForeground} />
            <Text style={styles.metaText}>{formatDate(item.scheduled_at)}</Text>
          </View>
          {item.professional_name && (
            <View style={styles.metaItem}>
              <Ionicons
                name="person-outline"
                size={12}
                color={C.mutedForeground}
              />
              <Text style={styles.metaText}>{item.professional_name}</Text>
            </View>
          )}
          {item.value != null && (
            <View style={styles.metaItem}>
              <Ionicons
                name="cash-outline"
                size={12}
                color={C.mutedForeground}
              />
              <Text style={styles.metaText}>
                R$ {Number(item.value).toLocaleString("pt-BR")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const FILTERS = ["Todos", "Pendente", "Confirmado", "Concluído", "Cancelado"];
const STATUS_KEYS: Record<string, string | undefined> = {
  Todos: undefined,
  Pendente: "pending",
  Confirmado: "confirmed",
  Concluído: "completed",
  Cancelado: "cancelled",
};

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState("Todos");

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, client_name, service_name, scheduled_at, status, value, professionals(name)"
        )
        .order("scheduled_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        professional_name: a.professionals?.name,
      })) as Appointment[];
    },
  });

  const statusKey = STATUS_KEYS[filter];
  const filtered = statusKey
    ? (data ?? []).filter((a) => a.status === statusKey)
    : (data ?? []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.heading}>Agenda</Text>
        <Text style={styles.sub}>
          {data ? `${filtered.length} agendamentos` : ""}
        </Text>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={C.accent}
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.errorText}>Erro ao carregar agendamentos</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AppointmentCard item={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: TAB_BAR_H + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="calendar-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum agendamento</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.foreground,
    marginBottom: 2,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  filterRow: { borderBottomWidth: 1, borderBottomColor: C.border },
  filterList: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.accent + "22",
    borderColor: C.accent,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.mutedForeground,
  },
  filterTextActive: { color: C.accent },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  cardLeft: {
    width: 4,
    backgroundColor: C.border,
  },
  statusDot: {
    width: 4,
    flex: 1,
  },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.foreground,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  service: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 60,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
  },
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

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

type Salon = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  active?: boolean;
  professional_count?: number;
};

function SalonCard({ item }: { item: Salon }) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[C.accent + "12", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.cardTop}>
        <View style={styles.salonIcon}>
          <Ionicons name="business" size={20} color={C.accent} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.salonName}>{item.name}</Text>
          {(item.city || item.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={C.mutedForeground} />
              <Text style={styles.location}>
                {[item.city, item.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.active !== false ? "#5fc97c" : C.mutedForeground },
          ]}
        />
      </View>
      <View style={styles.cardMeta}>
        {item.phone && (
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={12} color={C.mutedForeground} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
        )}
        {item.professional_count != null && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={C.mutedForeground} />
            <Text style={styles.metaText}>{item.professional_count} profissionais</Text>
          </View>
        )}
      </View>
    </View>
  );
}

type AdminKpiProps = {
  label: string;
  value: string;
  color: string;
};

function AdminKpi({ label, value, color }: AdminKpiProps) {
  return (
    <View style={[styles.kpi, { borderTopColor: color }]}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function MasterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const { isMaster } = useAuth();

  const { data: salons, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["master-salons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salons")
        .select("id, name, city, state, phone, active")
        .order("name");
      if (error) throw error;
      return data as Salon[];
    },
    enabled: isMaster,
  });

  const { data: userCount } = useQuery({
    queryKey: ["master-user-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: isMaster,
  });

  if (!isMaster) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={40} color={C.border} />
        <Text style={styles.emptyText}>Acesso restrito ao Master Admin</Text>
        <Pressable style={styles.backBtn2} onPress={() => router.back()}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Master Admin</Text>
          <View style={styles.masterBadge}>
            <Ionicons name="shield-checkmark" size={12} color={C.accent} />
            <Text style={styles.masterBadgeText}>Painel exclusivo</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <AdminKpi label="Salões" value={String(salons?.length ?? "—")} color={C.accent} />
        <AdminKpi label="Profissionais" value={String(userCount ?? "—")} color="#6ea8fe" />
        <AdminKpi
          label="Ativos"
          value={String(salons?.filter((s) => s.active !== false).length ?? "—")}
          color="#5fc97c"
        />
      </View>

      <Text style={styles.sectionTitle}>Salões Cadastrados</Text>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={salons ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SalonCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="business-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum salão cadastrado</Text>
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
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  backBtn: { padding: 4, marginLeft: -4, marginTop: 2 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.foreground },
  masterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: C.accent + "22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  masterBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.accent,
  },
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  kpi: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 2,
    padding: 12,
    alignItems: "center",
    gap: 3,
  },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.mutedForeground,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    overflow: "hidden",
    gap: 8,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  salonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  salonName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 40 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
  backBtn2: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.foreground },
});

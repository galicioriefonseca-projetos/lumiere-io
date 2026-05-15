import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

type InsightData = {
  totalProfessionals: number;
  totalClients: number;
  totalEvaluations: number;
  avgScore: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  topProfessional?: string;
};

type KpiCardProps = {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
};

function KpiCard({ icon, label, value, sub, color }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <LinearGradient
        colors={[color + "22", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.kpiIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const [
        { count: profCount },
        { count: clientCount },
        evalsRes,
        { count: apptCount },
        completedRes,
        goalsRes,
      ] = await Promise.all([
        supabase.from("professionals").select("*", { count: "exact", head: true }),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("evaluations").select("score"),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("salon_goals").select("current_revenue").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const evals = evalsRes.data ?? [];
      const avgScore =
        evals.length > 0
          ? evals.reduce((s: number, e: any) => s + (e.score ?? 0), 0) / evals.length
          : 0;

      return {
        totalProfessionals: profCount ?? 0,
        totalClients: clientCount ?? 0,
        totalEvaluations: evals.length,
        avgScore,
        totalAppointments: apptCount ?? 0,
        completedAppointments: completedRes.count ?? 0,
        totalRevenue: goalsRes.data?.current_revenue ?? 0,
      } as InsightData;
    },
  });

  const conversionRate =
    data && data.totalAppointments > 0
      ? Math.round((data.completedAppointments / data.totalAppointments) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Insights</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <View style={styles.kpiGrid}>
            <KpiCard icon="people" label="Profissionais" value={String(data?.totalProfessionals ?? 0)} color={C.accent} />
            <KpiCard icon="person" label="Clientes" value={String(data?.totalClients ?? 0)} color="#6ea8fe" />
            <KpiCard icon="star" label="Nota Média" value={data ? data.avgScore.toFixed(1) : "—"} color="#f4c430" />
            <KpiCard icon="chatbubbles" label="Avaliações" value={String(data?.totalEvaluations ?? 0)} color="#22d3ee" />
          </View>

          <Text style={styles.sectionTitle}>Agendamentos</Text>
          <View style={styles.kpiGrid}>
            <KpiCard
              icon="calendar"
              label="Total"
              value={String(data?.totalAppointments ?? 0)}
              color="#fb923c"
            />
            <KpiCard
              icon="checkmark-circle"
              label="Concluídos"
              value={String(data?.completedAppointments ?? 0)}
              sub={`${conversionRate}% de conclusão`}
              color="#5fc97c"
            />
          </View>

          {(data?.totalRevenue ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitle}>Financeiro</Text>
              <View style={styles.revenueCard}>
                <View style={styles.revenueIcon}>
                  <Ionicons name="trending-up" size={24} color={C.accent} />
                </View>
                <View>
                  <Text style={styles.revenueLabel}>Receita Atual</Text>
                  <Text style={styles.revenueValue}>
                    R$ {Number(data?.totalRevenue ?? 0).toLocaleString("pt-BR")}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.mutedForeground,
    marginBottom: 10,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 6,
    overflow: "hidden",
  },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.foreground },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  kpiSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  revenueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.accent + "44",
    padding: 16,
    gap: 14,
  },
  revenueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  revenueValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.accent },
});

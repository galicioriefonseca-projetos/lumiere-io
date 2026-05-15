import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { type ComponentProps } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const C = colors.dark;
const TAB_BAR_H = Platform.OS === "web" ? 84 : 70;

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type Stat = { label: string; value: string; icon: IoniconName; color: string };

function StatCard({ stat }: { stat: Stat }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + "22" }]}>
        <Ionicons name={stat.icon} size={22} color={stat.color} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );
}

function EvalItem({
  eval: e,
}: {
  eval: {
    id: string;
    score: number;
    comment?: string;
    created_at: string;
    professional_name?: string;
  };
}) {
  const stars = Math.round(e.score ?? 0);
  return (
    <View style={styles.evalItem}>
      <View style={styles.evalHeader}>
        <Text style={styles.evalName}>
          {e.professional_name ?? "Profissional"}
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= stars ? "star" : "star-outline"}
              size={12}
              color={s <= stars ? C.accent : C.border}
            />
          ))}
        </View>
      </View>
      {!!e.comment && (
        <Text style={styles.evalComment} numberOfLines={2}>
          {e.comment}
        </Text>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topPad =
    Platform.OS === "web" ? 67 : insets.top;

  const {
    data: stats,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [{ count: profCount }, { count: evalCount }, evalsRes, goalRes] =
        await Promise.all([
          supabase
            .from("professionals")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("evaluations")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("evaluations")
            .select("score, comment, created_at, professionals(name)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("salon_goals")
            .select("target_revenue, current_revenue")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      const evals = (evalsRes.data ?? []).map((e: any) => ({
        id: e.id ?? String(Math.random()),
        score: e.score ?? 0,
        comment: e.comment,
        created_at: e.created_at,
        professional_name: e.professionals?.name,
      }));

      const avgScore =
        evals.length > 0
          ? (evals.reduce((a: number, e: any) => a + e.score, 0) / evals.length).toFixed(1)
          : "—";

      const revenue = goalRes?.data?.current_revenue
        ? `R$ ${Number(goalRes.data.current_revenue).toLocaleString("pt-BR")}`
        : "—";

      return {
        profCount: profCount ?? 0,
        evalCount: evalCount ?? 0,
        avgScore,
        revenue,
        recentEvals: evals,
      };
    },
  });

  const statCards: Stat[] = [
    {
      label: "Profissionais",
      value: String(stats?.profCount ?? "—"),
      icon: "people",
      color: C.accent,
    },
    {
      label: "Avaliações",
      value: String(stats?.evalCount ?? "—"),
      icon: "chatbubbles",
      color: "#6ea8fe",
    },
    {
      label: "Nota Média",
      value: String(stats?.avgScore ?? "—"),
      icon: "star",
      color: "#f4c430",
    },
    {
      label: "Receita",
      value: stats?.revenue ?? "—",
      icon: "cash",
      color: "#5fc97c",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topPad + 16,
            paddingBottom: TAB_BAR_H + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.accent}
          />
        }
      >
        <LinearGradient
          colors={[C.accent + "22", "transparent"]}
          style={styles.headerGlow}
          pointerEvents="none"
        />

        <Text style={styles.greeting}>
          Olá{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </Text>
        <Text style={styles.heading}>Dashboard</Text>

        {isLoading ? (
          <ActivityIndicator
            color={C.accent}
            size="large"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View style={styles.statsGrid}>
              {statCards.map((s) => (
                <StatCard key={s.label} stat={s} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Avaliações Recentes</Text>
            {stats?.recentEvals?.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={32} color={C.border} />
                <Text style={styles.emptyText}>Nenhuma avaliação ainda</Text>
              </View>
            )}
            {stats?.recentEvals?.map((e) => (
              <EvalItem key={e.id} eval={e} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.foreground,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.foreground,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.foreground,
    marginBottom: 12,
  },
  evalItem: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 6,
  },
  evalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  evalName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.foreground,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  evalComment: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
  },
});

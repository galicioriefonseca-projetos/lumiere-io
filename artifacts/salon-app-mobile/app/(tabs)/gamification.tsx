import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { type ComponentProps } from "react";
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

type Achievement = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  level?: string;
  points?: number;
  earned?: boolean;
  professional_name?: string;
};

const LEVEL_COLORS: Record<string, { from: string; to: string; text: string }> =
  {
    gold: { from: "#e8b23a", to: "#c49428", text: "#060c1a" },
    silver: { from: "#c0c0c0", to: "#909090", text: "#060c1a" },
    bronze: { from: "#cd7f32", to: "#a05f22", text: "#f9f7f0" },
    diamond: { from: "#a8d8ea", to: "#6ea8fe", text: "#060c1a" },
  };

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const VALID_ACHIEVEMENT_ICONS: IoniconName[] = [
  "trophy",
  "star",
  "medal",
  "ribbon",
  "flame",
  "diamond",
  "heart",
  "flash",
  "thumbs-up",
  "gift",
  "sparkles",
];

function resolveAchievementIcon(raw: string | undefined): IoniconName {
  const candidate = raw as IoniconName;
  return VALID_ACHIEVEMENT_ICONS.includes(candidate) ? candidate : "trophy";
}

function AchievementCard({ item }: { item: Achievement }) {
  const level = (item.level ?? "bronze").toLowerCase();
  const levelColor =
    LEVEL_COLORS[level] ?? LEVEL_COLORS.bronze;
  const iconName = resolveAchievementIcon(item.icon);

  return (
    <View style={[styles.card, !item.earned && styles.cardLocked]}>
      <LinearGradient
        colors={
          item.earned
            ? [levelColor.from + "33", "transparent"]
            : ["transparent", "transparent"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: item.earned
              ? levelColor.from + "22"
              : C.muted,
            borderColor: item.earned ? levelColor.from : C.border,
          },
        ]}
      >
        <Ionicons
          name={
            item.earned
              ? iconName
              : "lock-closed-outline"
          }
          size={24}
          color={item.earned ? levelColor.from : C.border}
        />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text
            style={[
              styles.title,
              !item.earned && { color: C.mutedForeground },
            ]}
          >
            {item.title}
          </Text>
          {item.earned && (
            <View
              style={[
                styles.levelPill,
                { backgroundColor: levelColor.from + "22" },
              ]}
            >
              <Text
                style={[styles.levelText, { color: levelColor.from }]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.cardMeta}>
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
          {item.points != null && item.earned && (
            <View style={styles.metaItem}>
              <Ionicons name="flash" size={12} color={C.accent} />
              <Text style={[styles.metaText, { color: C.accent }]}>
                {item.points} pts
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function GamificationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select(
          "id, title, description, icon, level, points, earned, professionals(name)"
        )
        .order("earned", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        professional_name: a.professionals?.name,
      })) as Achievement[];
    },
  });

  const earned = (data ?? []).filter((a) => a.earned);
  const totalPoints = earned.reduce((s, a) => s + (a.points ?? 0), 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Conquistas</Text>
          {totalPoints > 0 && (
            <View style={styles.pointsBadge}>
              <Ionicons name="flash" size={14} color={C.accentForeground} />
              <Text style={styles.pointsText}>{totalPoints} pts</Text>
            </View>
          )}
        </View>
        <Text style={styles.sub}>
          {data
            ? `${earned.length} de ${data.length} desbloqueadas`
            : ""}
        </Text>
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
          <Text style={styles.errorText}>Erro ao carregar conquistas</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AchievementCard item={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: TAB_BAR_H + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="trophy-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhuma conquista disponível</Text>
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
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.foreground,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.accentForeground,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    overflow: "hidden",
  },
  cardLocked: { opacity: 0.6 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.foreground,
    flex: 1,
    marginRight: 8,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  cardMeta: { flexDirection: "row", gap: 12 },
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

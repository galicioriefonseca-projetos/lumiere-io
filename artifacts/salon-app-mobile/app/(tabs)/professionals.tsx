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
const TAB_BAR_H = Platform.OS === "web" ? 84 : 70;

type Professional = {
  id: string;
  name: string;
  specialty?: string;
  active?: boolean;
  commission_percentage?: number;
  phone?: string;
  email?: string;
};

function ProfessionalCard({ item }: { item: Professional }) {
  const router = useRouter();
  const initials = item.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/profissional/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        {item.specialty ? (
          <Text style={styles.specialty}>{item.specialty}</Text>
        ) : null}
        <View style={styles.badges}>
          {item.active !== false && (
            <View style={styles.badge}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>Ativo</Text>
            </View>
          )}
          {item.commission_percentage != null && (
            <View style={[styles.badge, styles.commBadge]}>
              <Text style={styles.commText}>
                {item.commission_percentage}% comissão
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.border} />
    </Pressable>
  );
}

export default function ProfessionalsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, name, specialty, active, commission_percentage, phone, email")
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16 },
        ]}
      >
        <Text style={styles.heading}>Equipe</Text>
        <Text style={styles.sub}>
          {data ? `${data.length} profissionais` : ""}
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
          <Text style={styles.emptyText}>Erro ao carregar profissionais</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProfessionalCard item={item} />}
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
              <Ionicons name="people-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum profissional cadastrado</Text>
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
    paddingBottom: 16,
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
  list: { paddingHorizontal: 20, paddingTop: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.accent + "22",
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.accent,
  },
  cardInfo: { flex: 1, gap: 3 },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.foreground,
  },
  specialty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  badges: { flexDirection: "row", gap: 6, marginTop: 2, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0e2a14",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#5fc97c",
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#5fc97c",
  },
  commBadge: { backgroundColor: C.accent + "22" },
  commText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.accent,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 60,
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
  retryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.accent,
  },
});

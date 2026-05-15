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

type Service = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  category?: string;
  active?: boolean;
};

function ServiceCard({ item }: { item: Service }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name="cut" size={18} color="#a78bfa" />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        {item.category && <Text style={styles.category}>{item.category}</Text>}
        <View style={styles.meta}>
          {item.price != null && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>R$ {Number(item.price).toLocaleString("pt-BR")}</Text>
            </View>
          )}
          {item.duration_minutes != null && (
            <View style={[styles.pill, styles.pillMuted]}>
              <Ionicons name="time-outline" size={11} color={C.mutedForeground} />
              <Text style={[styles.pillText, { color: C.mutedForeground }]}>{item.duration_minutes} min</Text>
            </View>
          )}
          {item.active === false && (
            <View style={[styles.pill, styles.pillInactive]}>
              <Text style={[styles.pillText, { color: C.mutedForeground }]}>Inativo</Text>
            </View>
          )}
        </View>
        {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
      </View>
    </View>
  );
}

export default function ServicosScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, category, active")
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Serviços</Text>
        <Text style={styles.count}>{data ? `${data.length}` : ""}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar serviços</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ServiceCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="cut-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum serviço cadastrado</Text>
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
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: "flex-start",
  },
  cardLeft: {},
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#a78bfa22",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground },
  category: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  meta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a78bfa22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  pillMuted: { backgroundColor: C.muted },
  pillInactive: { backgroundColor: C.muted },
  pillText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#a78bfa" },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
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

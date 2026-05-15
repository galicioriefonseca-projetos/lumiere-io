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

type Category = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  service_count?: number;
};

const PALETTE = ["#6ea8fe", "#a78bfa", "#f472b6", "#fb923c", "#5fc97c", "#22d3ee", "#f4c430", C.accent];

function CategoryCard({ item, index }: { item: Category; index: number }) {
  const tint = item.color ?? PALETTE[index % PALETTE.length];
  return (
    <View style={[styles.card, { borderLeftColor: tint, borderLeftWidth: 3 }]}>
      <View style={[styles.iconCircle, { backgroundColor: tint + "22" }]}>
        <Ionicons name="grid" size={20} color={tint} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        )}
        {item.service_count != null && (
          <View style={styles.countRow}>
            <Ionicons name="cut-outline" size={12} color={C.mutedForeground} />
            <Text style={styles.countText}>{item.service_count} serviços</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function CategoriasScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description, color")
        .order("name");
      if (error) {
        const { data: fallback, error: fallbackErr } = await supabase
          .from("categories")
          .select("id, name, description, color")
          .order("name");
        if (fallbackErr) throw fallbackErr;
        return fallback as Category[];
      }
      return data as Category[];
    },
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Categorias</Text>
        <Text style={styles.count}>{data ? `${data.length}` : ""}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar categorias</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <CategoryCard item={item} index={index} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="grid-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhuma categoria cadastrada</Text>
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
    overflow: "hidden",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground },
  countRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  countText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
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

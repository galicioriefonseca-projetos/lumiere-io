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

type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  category?: string;
  due_date?: string;
  assigned_to?: string;
};

function CheckCard({ item }: { item: ChecklistItem }) {
  return (
    <View style={styles.card}>
      <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
        {item.completed && <Ionicons name="checkmark" size={14} color={C.accentForeground} />}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.title, item.completed && styles.titleDone]}>{item.title}</Text>
        {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
        <View style={styles.meta}>
          {item.category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
          )}
          {item.assigned_to && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={11} color={C.mutedForeground} />
              <Text style={styles.metaText}>{item.assigned_to}</Text>
            </View>
          )}
          {item.due_date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={11} color={C.mutedForeground} />
              <Text style={styles.metaText}>
                {new Date(item.due_date).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ChecklistsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("id, title, description, completed, category, due_date, assigned_to")
        .order("completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChecklistItem[];
    },
  });

  const done = (data ?? []).filter((c) => c.completed).length;
  const total = data?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Checklists</Text>
          {total > 0 && (
            <Text style={styles.progress}>{done}/{total} concluídos</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar checklists</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CheckCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="checkbox-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhum checklist encontrado</Text>
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
  progress: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground, marginTop: 2 },
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: C.accent, borderColor: C.accent },
  cardBody: { flex: 1, gap: 4 },
  title: { fontFamily: "Inter_500Medium", fontSize: 15, color: C.foreground },
  titleDone: { textDecorationLine: "line-through", color: C.mutedForeground },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground },
  meta: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  tag: {
    backgroundColor: "#f472b622",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#f472b6" },
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

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

type Evaluation = {
  id: string;
  score: number;
  comment?: string;
  created_at: string;
  client_name?: string;
  professional_name?: string;
  service_name?: string;
};

function Stars({ score }: { score: number }) {
  const stars = Math.round(score);
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= stars ? "star" : "star-outline"}
          size={14}
          color={s <= stars ? C.accent : C.border}
        />
      ))}
    </View>
  );
}

function EvalCard({ item }: { item: Evaluation }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.clientName}>{item.client_name ?? "Cliente"}</Text>
        <Stars score={item.score} />
      </View>
      {item.professional_name && (
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="person-outline" size={11} color={C.accent} />
            <Text style={styles.tagText}>{item.professional_name}</Text>
          </View>
          {item.service_name && (
            <View style={styles.tag}>
              <Ionicons name="cut-outline" size={11} color={C.mutedForeground} />
              <Text style={[styles.tagText, { color: C.mutedForeground }]}>{item.service_name}</Text>
            </View>
          )}
        </View>
      )}
      {item.comment && (
        <Text style={styles.comment} numberOfLines={3}>{item.comment}</Text>
      )}
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </Text>
    </View>
  );
}

export default function AvaliacoesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, score, comment, created_at, client_name, service_name, professionals(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        ...e,
        professional_name: e.professionals?.name,
      })) as Evaluation[];
    },
  });

  const avg =
    data && data.length > 0
      ? (data.reduce((s, e) => s + e.score, 0) / data.length).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Avaliações</Text>
          {avg && (
            <View style={styles.avgRow}>
              <Ionicons name="star" size={14} color={C.accent} />
              <Text style={styles.avgText}>{avg} média geral</Text>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={32} color={C.destructive} />
          <Text style={styles.emptyText}>Erro ao carregar avaliações</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EvalCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(data && data.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accent} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="star-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>Nenhuma avaliação</Text>
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
  avgRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  avgText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.accent },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.foreground },
  tagRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.accent },
  comment: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.mutedForeground },
  date: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.border },
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

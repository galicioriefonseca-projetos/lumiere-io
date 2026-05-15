import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { type ComponentProps } from "react";
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

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Professional = {
  id: string;
  name: string;
  specialty?: string;
  active?: boolean;
  commission_percentage?: number;
  phone?: string;
  email?: string;
  bio?: string;
  hire_date?: string;
  total_appointments?: number;
  total_revenue?: number;
  avg_score?: number;
};

type InfoRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={C.accent} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  icon: IoniconName;
  color: string;
};

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function ProfissionalDetailScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: prof, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select(
          "id, name, specialty, active, commission_percentage, phone, email, bio, hire_date, total_appointments, total_revenue, avg_score"
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Professional;
    },
    enabled: !!id,
  });

  const initials = prof
    ? prof.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "??";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading} numberOfLines={1}>
          {prof?.name ?? "Profissional"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 40 }} />
      ) : !prof ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={36} color={C.destructive} />
          <Text style={styles.emptyText}>Profissional não encontrado</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[C.accent + "22", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.heroName}>{prof.name}</Text>
            {prof.specialty && (
              <Text style={styles.heroSpecialty}>{prof.specialty}</Text>
            )}
            <View style={styles.heroBadges}>
              <View
                style={[
                  styles.badge,
                  prof.active !== false ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: prof.active !== false ? "#5fc97c" : C.mutedForeground },
                  ]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: prof.active !== false ? "#5fc97c" : C.mutedForeground },
                  ]}
                >
                  {prof.active !== false ? "Ativo" : "Inativo"}
                </Text>
              </View>
              {prof.commission_percentage != null && (
                <View style={[styles.badge, styles.badgeComm]}>
                  <Text style={styles.badgeCommText}>
                    {prof.commission_percentage}% comissão
                  </Text>
                </View>
              )}
            </View>
          </View>

          {(prof.total_appointments != null ||
            prof.total_revenue != null ||
            prof.avg_score != null) && (
            <View style={styles.kpiGrid}>
              {prof.total_appointments != null && (
                <KpiCard
                  label="Atendimentos"
                  value={String(prof.total_appointments)}
                  icon="calendar"
                  color="#6ea8fe"
                />
              )}
              {prof.total_revenue != null && (
                <KpiCard
                  label="Receita"
                  value={`R$ ${Number(prof.total_revenue).toLocaleString("pt-BR")}`}
                  icon="cash"
                  color="#5fc97c"
                />
              )}
              {prof.avg_score != null && (
                <KpiCard
                  label="Avaliação"
                  value={Number(prof.avg_score).toFixed(1)}
                  icon="star"
                  color="#f4c430"
                />
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoCard}>
            {prof.phone && (
              <>
                <InfoRow icon="call-outline" label="Telefone" value={prof.phone} />
                <View style={styles.separator} />
              </>
            )}
            {prof.email && (
              <>
                <InfoRow icon="mail-outline" label="E-mail" value={prof.email} />
                <View style={styles.separator} />
              </>
            )}
            {prof.hire_date && (
              <>
                <InfoRow
                  icon="calendar-outline"
                  label="Data de contratação"
                  value={new Date(prof.hire_date).toLocaleDateString("pt-BR")}
                />
                <View style={styles.separator} />
              </>
            )}
            <InfoRow
              icon="briefcase-outline"
              label="Status"
              value={prof.active !== false ? "Ativo" : "Inativo"}
            />
          </View>

          {prof.bio && (
            <>
              <Text style={styles.sectionTitle}>Bio</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{prof.bio}</Text>
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
  heading: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.foreground, flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  heroCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    gap: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accent + "22",
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 26, color: C.accent },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.foreground },
  heroSpecialty: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
  heroBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  badgeActive: { backgroundColor: "#0e2a14" },
  badgeInactive: { backgroundColor: C.muted },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  badgeComm: { backgroundColor: C.accent + "22" },
  badgeCommText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.accent },
  kpiGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 4,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.foreground },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.mutedForeground },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.mutedForeground,
    marginBottom: 8,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.mutedForeground },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.foreground, marginTop: 1 },
  separator: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  bioCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.foreground, lineHeight: 22 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
});

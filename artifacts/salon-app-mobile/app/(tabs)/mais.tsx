import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import React, { type ComponentProps } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.dark;
const TAB_BAR_H = Platform.OS === "web" ? 84 : 70;

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Section = {
  icon: IoniconName;
  label: string;
  sub: string;
  route: Href<string>;
  color: string;
};

const SECTIONS: { title: string; items: Section[] }[] = [
  {
    title: "Operacional",
    items: [
      { icon: "people-circle-outline", label: "Clientes", sub: "Gestão de clientes", route: "/clientes", color: "#6ea8fe" },
      { icon: "cut-outline", label: "Serviços", sub: "Catálogo de serviços", route: "/servicos", color: "#a78bfa" },
      { icon: "grid-outline", label: "Categorias", sub: "Categorias de serviços", route: "/categorias", color: "#22d3ee" },
      { icon: "receipt-outline", label: "Lançamentos", sub: "Entradas e saídas", route: "/lancamentos", color: "#5fc97c" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { icon: "flag-outline", label: "Metas", sub: "Metas do salão", route: "/metas", color: C.accent },
      { icon: "cash-outline", label: "Comissões", sub: "Comissões da equipe", route: "/comissoes", color: "#fb923c" },
      { icon: "checkbox-outline", label: "Checklists", sub: "Listas de tarefas", route: "/checklists", color: "#f472b6" },
    ],
  },
  {
    title: "Análise",
    items: [
      { icon: "star-half-outline", label: "Avaliações", sub: "Notas dos clientes", route: "/avaliacoes", color: "#f4c430" },
      { icon: "trending-up-outline", label: "Insights", sub: "Relatórios e análises", route: "/insights", color: "#22d3ee" },
    ],
  },
];

function SectionRow({ item }: { item: Section }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={() => router.push(item.route)}
    >
      <View style={[styles.rowIcon, { backgroundColor: item.color + "1a" }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowSub}>{item.sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.border} />
    </Pressable>
  );
}

export default function MaisScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, isMaster, signOut } = useAuth();
  const router = useRouter();

  const initials = (user?.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: TAB_BAR_H + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Mais</Text>

        <Pressable
          style={({ pressed }) => [styles.profile, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/configuracoes")}
        >
          <LinearGradient
            colors={[C.accent, C.goldDim]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
            {isMaster && (
              <View style={styles.masterBadge}>
                <Ionicons name="shield-checkmark" size={11} color={C.accent} />
                <Text style={styles.masterText}>Master Admin</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.border} />
        </Pressable>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <View key={String(item.route)}>
                  <SectionRow item={item} />
                  {idx < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={C.destructive} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.foreground,
    marginBottom: 20,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: C.accentForeground,
  },
  profileInfo: { flex: 1 },
  profileEmail: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.foreground,
    marginBottom: 4,
  },
  masterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: C.accent + "22",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  masterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.accent,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.foreground,
    marginBottom: 2,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.mutedForeground,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2b0a0a",
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.destructive + "44",
    padding: 14,
    marginBottom: 8,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.destructive,
  },
});

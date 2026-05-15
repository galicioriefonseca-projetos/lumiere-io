import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { type ComponentProps } from "react";
import {
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

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type RowProps = {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
};

function Row({ icon, label, value, onPress, chevron = true }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: C.muted }]}>
        <Ionicons name={icon} size={18} color={C.accent} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {chevron && onPress && (
          <Ionicons name="chevron-forward" size={16} color={C.border} />
        )}
      </View>
    </Pressable>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ConfiguracoesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, isMaster } = useAuth();
  const router = useRouter();

  const initials = (user?.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.foreground} />
        </Pressable>
        <Text style={styles.heading}>Configurações</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <LinearGradient colors={[C.accent, C.goldDim]} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{user?.email ?? "—"}</Text>
            {isMaster && (
              <View style={styles.masterBadge}>
                <Ionicons name="shield-checkmark" size={12} color={C.accent} />
                <Text style={styles.masterText}>Master Admin</Text>
              </View>
            )}
          </View>
        </View>

        <Section title="Conta">
          <Row icon="mail-outline" label="E-mail" value={user?.email ?? "—"} chevron={false} />
          <View style={styles.separator} />
          <Row icon="shield-outline" label="Perfil" value={isMaster ? "Master Admin" : "Usuário"} chevron={false} />
          <View style={styles.separator} />
          <Row icon="key-outline" label="Alterar senha" onPress={() => {}} />
        </Section>

        <Section title="Salão">
          <Row icon="business-outline" label="Dados do Salão" onPress={() => {}} />
          <View style={styles.separator} />
          <Row icon="color-palette-outline" label="Personalização" onPress={() => {}} />
          <View style={styles.separator} />
          <Row icon="time-outline" label="Horário de funcionamento" onPress={() => {}} />
        </Section>

        <Section title="Notificações">
          <Row icon="notifications-outline" label="Notificações Push" onPress={() => {}} />
          <View style={styles.separator} />
          <Row icon="mail-unread-outline" label="Alertas por e-mail" onPress={() => {}} />
        </Section>

        <Section title="Sobre">
          <Row icon="information-circle-outline" label="Versão" value="1.0.0" chevron={false} />
          <View style={styles.separator} />
          <Row icon="document-text-outline" label="Termos de uso" onPress={() => {}} />
          <View style={styles.separator} />
          <Row icon="shield-checkmark-outline" label="Política de privacidade" onPress={() => {}} />
        </Section>
      </ScrollView>
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
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.foreground,
    flex: 1,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.accentForeground },
  profileInfo: { flex: 1, gap: 4 },
  profileEmail: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.foreground },
  masterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: C.accent + "22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  masterText: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.accent },
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
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.foreground, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground },
  separator: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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

type RowProps = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
};

function Row({ icon, label, value, onPress, destructive, chevron = true }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: destructive ? "#2b0a0a" : C.muted },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={destructive ? C.destructive : C.accent}
        />
      </View>
      <Text
        style={[
          styles.rowLabel,
          destructive && { color: C.destructive },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {chevron && onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={destructive ? C.destructive : C.border}
          />
        )}
      </View>
    </Pressable>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, isMaster, signOut } = useAuth();

  const initials = (user?.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: signOut,
      },
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
        <Text style={styles.heading}>Configurações</Text>

        <View style={styles.profile}>
          <LinearGradient
            colors={[C.accent, C.goldDim]}
            style={styles.avatarCircle}
          >
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
          <Row
            icon="mail-outline"
            label="E-mail"
            value={user?.email ?? "—"}
            chevron={false}
          />
          <View style={styles.separator} />
          <Row
            icon="shield-outline"
            label="Perfil"
            value={isMaster ? "Master Admin" : "Usuário"}
            chevron={false}
          />
        </Section>

        <Section title="Salão">
          <Row
            icon="business-outline"
            label="Dados do Salão"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <Row
            icon="people-outline"
            label="Profissionais"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <Row
            icon="cut-outline"
            label="Serviços"
            onPress={() => {}}
          />
        </Section>

        <Section title="Notificações">
          <Row
            icon="notifications-outline"
            label="Notificações Push"
            onPress={() => {}}
          />
        </Section>

        <Section title="Sobre">
          <Row
            icon="information-circle-outline"
            label="Versão"
            value="1.0.0"
            chevron={false}
          />
          <View style={styles.separator} />
          <Row
            icon="globe-outline"
            label="Lumière.io"
            chevron={false}
          />
        </Section>

        <Section>
          <Row
            icon="log-out-outline"
            label="Sair da conta"
            onPress={handleSignOut}
            destructive
          />
        </Section>
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
    marginBottom: 24,
  },
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
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.accentForeground,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileEmail: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.foreground,
  },
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
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.foreground,
    flex: 1,
  },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
});

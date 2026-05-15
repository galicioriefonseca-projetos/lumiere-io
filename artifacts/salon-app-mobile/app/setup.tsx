import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

const STEPS = ["Salão", "Endereço", "Configurações"] as const;
type Step = (typeof STEPS)[number];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");

  const handleNext = () => {
    if (step === 0 && !salonName.trim()) {
      setError("Nome do salão é obrigatório.");
      return;
    }
    setError(null);
    if (step < 2) {
      setStep((step + 1) as 0 | 1 | 2);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("salons").insert({
        name: salonName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        open_time: openTime,
        close_time: closeTime,
        owner_id: user?.id,
      });
      if (err) throw err;
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar salão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#060c1a", "#0b1225", "#060c1a"]}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="diamond-outline" size={24} color={C.accent} />
          <Text style={styles.brand}>Lumière</Text>
        </View>
        <Text style={styles.stepLabel}>Configuração inicial</Text>
      </View>

      <View style={styles.stepsRow}>
        {STEPS.map((s, idx) => (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                idx <= step && styles.stepDotActive,
                idx < step && styles.stepDotDone,
              ]}
            >
              {idx < step ? (
                <Ionicons name="checkmark" size={12} color={C.accentForeground} />
              ) : (
                <Text style={[styles.stepNum, idx <= step && styles.stepNumActive]}>
                  {idx + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepName,
                idx === step && styles.stepNameActive,
              ]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dados do Salão</Text>
              <Field label="Nome do salão *" value={salonName} onChange={setSalonName} placeholder="Ex: Lumière Beauty" />
              <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
            </View>
          )}

          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Endereço</Text>
              <Field label="Endereço" value={address} onChange={setAddress} placeholder="Rua, número" />
              <Field label="Cidade" value={city} onChange={setCity} placeholder="São Paulo" />
              <Field label="Estado" value={state} onChange={setState} placeholder="SP" maxLength={2} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Horário de Funcionamento</Text>
              <Field label="Abertura" value={openTime} onChange={setOpenTime} placeholder="09:00" />
              <Field label="Fechamento" value={closeTime} onChange={setCloseTime} placeholder="18:00" />
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.accentForeground} />
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>
                  {step < 2 ? "Próximo" : "Finalizar configuração"}
                </Text>
                <Ionicons
                  name={step < 2 ? "arrow-forward" : "checkmark"}
                  size={18}
                  color={C.accentForeground}
                />
              </View>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  maxLength?: number;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, marginBottom: 24 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.accent,
    letterSpacing: 1.5,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.mutedForeground,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { borderColor: C.accent },
  stepDotDone: { backgroundColor: C.accent, borderColor: C.accent },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.mutedForeground,
  },
  stepNumActive: { color: C.accent },
  stepName: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.mutedForeground,
  },
  stepNameActive: { color: C.foreground, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b0a0a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.destructive,
    flex: 1,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.foreground,
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.foreground,
  },
  btn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.accentForeground,
    letterSpacing: 0.5,
  },
});

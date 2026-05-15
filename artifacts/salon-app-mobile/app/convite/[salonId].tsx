import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const C = colors.dark;

export default function ConviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { salonId } = useLocalSearchParams<{ salonId: string }>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("Senha mínima de 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), salon_id: salonId } },
      });
      if (signUpErr) throw signUpErr;
      if (signUpData.user) {
        await supabase.from("professionals").insert({
          name: name.trim(),
          email: email.trim(),
          user_id: signUpData.user.id,
          salon_id: salonId,
        });
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao aceitar convite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#060c1a", "#0b1225", "#060c1a"]}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={32} color={C.accent} />
        </View>
        <Text style={styles.heading}>Convite Recebido</Text>
        <Text style={styles.sub}>
          Você foi convidado para participar de um salão na plataforma Lumière.
          Complete seu cadastro para começar.
        </Text>

        {done ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={40} color="#5fc97c" />
            <Text style={styles.successTitle}>Cadastro concluído!</Text>
            <Text style={styles.successSub}>
              Verifique seu e-mail para confirmar a conta, depois faça login.
            </Text>
            <Pressable
              style={[styles.btn, { marginTop: 8 }]}
              onPress={() => router.replace("/auth")}
            >
              <Text style={styles.btnText}>Ir para o login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={C.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
            <Field label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" keyboardType="email-address" />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={C.mutedForeground}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPass(!showPass)}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={C.mutedForeground}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
              onPress={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.accentForeground} />
              ) : (
                <Text style={styles.btnText}>Aceitar convite</Text>
              )}
            </Pressable>
          </View>
        )}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.inputFull]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: C.foreground,
    marginBottom: 10,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },
  successCard: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#5fc97c" },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b0a0a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.destructive, flex: 1 },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.mutedForeground,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
    gap: 8,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.foreground,
  },
  inputFull: {
    backgroundColor: C.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
  },
  btn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.accentForeground,
    letterSpacing: 0.5,
  },
});

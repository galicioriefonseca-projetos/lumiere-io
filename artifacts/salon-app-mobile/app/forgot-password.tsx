import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: "salon-app-mobile://reset-password" }
    );
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <LinearGradient
      colors={["#060c1a", "#0b1225", "#060c1a"]}
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={22} color={C.foreground} />
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={32} color={C.accent} />
        </View>

        <Text style={styles.heading}>Esqueceu a senha?</Text>
        <Text style={styles.sub}>
          Insira seu e-mail e enviaremos um link para redefinir sua senha.
        </Text>

        {sent ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={36} color="#5fc97c" />
            <Text style={styles.successTitle}>E-mail enviado!</Text>
            <Text style={styles.successSub}>
              Verifique sua caixa de entrada e siga as instruções para redefinir
              sua senha.
            </Text>
            <Pressable
              style={[styles.btn, { marginTop: 12 }]}
              onPress={() => router.replace("/auth")}
            >
              <Text style={styles.btnText}>Voltar para o login</Text>
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

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={C.mutedForeground}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={C.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.accentForeground} />
              ) : (
                <Text style={styles.btnText}>Enviar link</Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 4,
  },
  backText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.foreground,
  },
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
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#5fc97c",
  },
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
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.destructive,
    flex: 1,
  },
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
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.foreground,
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

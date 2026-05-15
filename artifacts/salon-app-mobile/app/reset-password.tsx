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

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!password) {
      setError("Digite a nova senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
    }
  };

  return (
    <LinearGradient
      colors={["#060c1a", "#0b1225", "#060c1a"]}
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={32} color={C.accent} />
        </View>

        <Text style={styles.heading}>Nova Senha</Text>
        <Text style={styles.sub}>
          Crie uma nova senha para sua conta Lumière.
        </Text>

        {done ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={40} color="#5fc97c" />
            <Text style={styles.successTitle}>Senha atualizada!</Text>
            <Text style={styles.successSub}>
              Sua senha foi redefinida com sucesso.
            </Text>
            <Pressable
              style={[styles.btn, { marginTop: 8 }]}
              onPress={() => router.replace("/auth")}
            >
              <Text style={styles.btnText}>Entrar agora</Text>
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

            <Text style={styles.label}>Nova senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={C.mutedForeground}
                style={styles.inputIcon}
              />
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

            <Text style={styles.label}>Confirmar senha</Text>
            <View style={[styles.inputWrap, { marginBottom: 18 }]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={C.mutedForeground}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repita a senha"
                placeholderTextColor={C.mutedForeground}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.accentForeground} />
              ) : (
                <Text style={styles.btnText}>Redefinir senha</Text>
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

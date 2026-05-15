import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { supabase } from "@/lib/supabase";

const C = colors.dark;

export default function AvaliarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { salonId, proId } = useLocalSearchParams<{
    salonId: string;
    proId: string;
  }>();

  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayScore = hovered || score;

  const LABELS: Record<number, string> = {
    1: "Ruim",
    2: "Regular",
    3: "Bom",
    4: "Ótimo",
    5: "Excelente",
  };

  const handleSubmit = async () => {
    if (score === 0) {
      setError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("evaluations").insert({
        score,
        comment: comment.trim() || null,
        client_name: clientName.trim() || null,
        professional_id: proId,
        salon_id: salonId,
      });
      if (err) throw err;
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar avaliação.");
    } finally {
      setLoading(false);
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoRow}>
            <Ionicons name="diamond-outline" size={24} color={C.accent} />
            <Text style={styles.brand}>Lumière</Text>
          </View>

          {done ? (
            <View style={styles.successCard}>
              <Ionicons name="heart-circle" size={48} color={C.accent} />
              <Text style={styles.successTitle}>Obrigado!</Text>
              <Text style={styles.successSub}>
                Sua avaliação foi enviada com sucesso. Seu feedback é muito
                importante para nós.
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= score ? "star" : "star-outline"}
                    size={28}
                    color={s <= score ? C.accent : C.border}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Avalie seu atendimento</Text>
              <Text style={styles.cardSub}>
                Como foi sua experiência? Sua opinião nos ajuda a melhorar.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={C.destructive} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.starsBlock}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setScore(s)}
                      onPressIn={() => setHovered(s)}
                      onPressOut={() => setHovered(0)}
                    >
                      <Ionicons
                        name={s <= displayScore ? "star" : "star-outline"}
                        size={44}
                        color={s <= displayScore ? C.accent : C.border}
                      />
                    </Pressable>
                  ))}
                </View>
                {displayScore > 0 && (
                  <Text style={styles.scoreLabel}>{LABELS[displayScore]}</Text>
                )}
              </View>

              <Text style={styles.label}>Seu nome (opcional)</Text>
              <TextInput
                style={styles.input}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Como prefere ser chamado?"
                placeholderTextColor={C.mutedForeground}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Comentário (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={comment}
                onChangeText={setComment}
                placeholder="Conte como foi sua experiência..."
                placeholderTextColor={C.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Pressable
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={C.accentForeground} />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="star" size={16} color={C.accentForeground} />
                    <Text style={styles.btnText}>Enviar avaliação</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
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
  backText: { fontFamily: "Inter_500Medium", fontSize: 15, color: C.foreground },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 24,
  },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.accent,
    letterSpacing: 1.5,
  },
  successCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.foreground },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 14,
  },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.foreground },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.mutedForeground, lineHeight: 20 },
  starsBlock: { alignItems: "center", gap: 8, paddingVertical: 8 },
  starsRow: { flexDirection: "row", gap: 8 },
  scoreLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.accent,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b0a0a",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.destructive, flex: 1 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.mutedForeground,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.foreground,
  },
  textarea: { height: 100, paddingTop: 12 },
  btn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.accentForeground,
    letterSpacing: 0.5,
  },
});

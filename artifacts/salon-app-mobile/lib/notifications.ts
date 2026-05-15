import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export const NOTIF_PREF_KEY = "lumiere_push_notifications_enabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)
      ?.eas as Record<string, unknown> | undefined
  )?.projectId as string | undefined;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const projectId = getEasProjectId();
  if (!projectId) {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from("professionals")
    .update({ push_token: token })
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to save push token: ${error.message}`);
}

export async function removePushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from("professionals")
    .update({ push_token: null })
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to remove push token: ${error.message}`);
}

export async function isPushEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_PREF_KEY);
  return val === "true";
}

export function buildAppointmentNotification(
  appointmentId: string,
  clientName: string,
  serviceName: string,
  scheduledAt: string
): Notifications.NotificationContentInput {
  const date = new Date(scheduledAt);
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    title: "Novo agendamento",
    body: `${clientName} agendou ${serviceName} às ${timeStr}`,
    data: { appointmentId, screen: "appointments" },
    sound: true,
  };
}

export async function scheduleLocalAppointmentReminder(
  appointmentId: string,
  clientName: string,
  serviceName: string,
  scheduledAt: string
): Promise<string> {
  const appointmentDate = new Date(scheduledAt);
  const reminderDate = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
  const now = new Date();

  if (reminderDate <= now) {
    return Notifications.scheduleNotificationAsync({
      content: buildAppointmentNotification(
        appointmentId,
        clientName,
        serviceName,
        scheduledAt
      ),
      trigger: null,
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: buildAppointmentNotification(
      appointmentId,
      clientName,
      serviceName,
      scheduledAt
    ),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

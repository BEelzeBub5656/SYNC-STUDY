import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AuthSession = {
  userId: number;
  username: string;
  token: string;
  expiresAt: number;
};

const AUTH_SESSION_KEY = "auth-session-v1";

async function readSessionValue() {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(AUTH_SESSION_KEY);
  }
  return SecureStore.getItemAsync(AUTH_SESSION_KEY);
}

async function writeSessionValue(value: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, value);
}

async function deleteSessionValue() {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

export async function saveAuthSession(session: AuthSession) {
  await writeSessionValue(JSON.stringify(session));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const stored = await readSessionValue();
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as Partial<AuthSession>;
    const valid =
      typeof session.userId === "number" &&
      typeof session.username === "string" &&
      typeof session.token === "string" &&
      typeof session.expiresAt === "number";

    if (!valid || session.expiresAt! <= Date.now()) {
      await deleteSessionValue();
      return null;
    }
    return session as AuthSession;
  } catch {
    await deleteSessionValue();
    return null;
  }
}

export async function clearAuthSession() {
  await deleteSessionValue();
}

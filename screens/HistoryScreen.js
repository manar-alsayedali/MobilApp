import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";


const TABS_ORDER = ["Home", "Reports", "History"];

export default function HistoryScreen({ navigation, route }) {
  const [sessions, setSessions] = useState([]);
  const isFocused = useIsFocused();

  const currentRouteName = route?.name ?? "History";
  const currentIndex = TABS_ORDER.indexOf(currentRouteName);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx < -20 && currentIndex < TABS_ORDER.length - 1) {
          const nextRoute = TABS_ORDER[currentIndex + 1];
          navigation.navigate(nextRoute);
        } else if (dx > 20 && currentIndex > 0) {
          const prevRoute = TABS_ORDER[currentIndex - 1];
          navigation.navigate(prevRoute);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isFocused) {
      loadSessions();
    }
  }, [isFocused]);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem("@sessions");
      const parsed = stored ? JSON.parse(stored) : [];
      parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(parsed);
    } catch (e) {
      console.log("Error loading sessions", e);
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      {...panResponder.panHandlers}
    >
      <Text style={styles.title}> Oturum Geçmişi</Text>
      <Text style={styles.subtitle}>
        Geçmiş odaklanma seanslarını kategori, süre ve hedeflerine göre incele.
      </Text>

      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>
          Henüz kayıtlı oturum yok. Ana sayfadan ilk seansını başlat.
        </Text>
      ) : (
        sessions.map((s) => (
          <View key={s.id ?? s.date} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.categoryBadge}>{s.category}</Text>
              <Text style={styles.dateText}>{formatDateTime(s.date)}</Text>
            </View>

            <Text style={styles.cardText}>
              Süre:{" "}
              <Text style={styles.cardValue}>
                {formatTime(s.duration || 0)}
              </Text>
            </Text>
            <Text style={styles.cardText}>
              Dikkat Dağınıklığı:{" "}
              <Text style={styles.cardValue}>{s.distractions || 0} kez</Text>
            </Text>

            {s.goal && (
              <Text style={styles.cardText}>
                Hedef: <Text style={styles.cardValue}>{s.goal}</Text>
              </Text>
            )}

            {s.reason && (
              <Text style={styles.reasonText}>Durum: {s.reason}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  contentContainer: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginVertical: 8,
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4f46e5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  cardText: {
    fontSize: 14,
    marginBottom: 2,
    color: "#4b5563",
  },
  cardValue: {
    fontWeight: "600",
    color: "#111827",
  },
  reasonText: {
    fontSize: 13,
    marginTop: 4,
    color: "#6b7280",
  },
});
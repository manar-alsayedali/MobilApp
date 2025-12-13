import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CATEGORIES = ["Genel", "Ders", "Kodlama", "Proje", "Okuma"];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Genel");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [distractions, setDistractions] = useState(0);

  const appState = useRef(AppState.currentState);

  // ⏱️ المؤقّت
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // 👀 مراقبة AppState (لو طلعت من التطبيق أثناء التايمر -> تشتّت + إيقاف)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        if (isRunning) {
          setIsRunning(false);
          setDistractions((prev) => prev + 1);
        }
      }

      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setDistractions(0);
  };

  const handleManualDistraction = () => {
    // لو الطالبة قالت "تشتيت يدوي" (مثلاً مسكت الجوال) تضغطي زر
    setDistractions((prev) => prev + 1);
  };

  const saveSession = async () => {
    if (seconds === 0) {
      alert("Önce odaklanma süresi kaydetmelisin. ");
      return;
    }

    const newSession = {
      id: Date.now().toString(),
      category: selectedCategory,
      duration: seconds,
      distractions,
      date: new Date().toISOString(),
    };

    try {
      const existing = await AsyncStorage.getItem("@sessions");
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.push(newSession);
      await AsyncStorage.setItem("@sessions", JSON.stringify(sessions));

      alert("Oturum kaydedildi ✅");

      // reset
      setIsRunning(false);
      setSeconds(0);
      setDistractions(0);
    } catch (e) {
      console.log("Error saving session", e);
      alert("Kaydederken hata oluştu.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odaklanma Zamanlayıcısı</Text>

      {/* فئات العمل */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategori Seç</Text>
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* المؤقّت */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Süre</Text>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartPause}
          >
            <Text style={styles.buttonText}>
              {isRunning ? "Durdur" : "Başlat"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleReset}
          >
            <Text style={styles.buttonText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* التشتّت */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dikkat Dağınıklığı</Text>
        <Text style={styles.distractionCount}>{distractions} kez</Text>
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleManualDistraction}
        >
          <Text style={styles.buttonText}>Dikkatim dağıldı</Text>
        </TouchableOpacity>
      </View>

      {/* حفظ الجلسة */}
      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveSession}>
        <Text style={styles.buttonText}>Oturumu Kaydet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#999",
  },
  warningButton: {
    backgroundColor: "#ff9500",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#34C759",
    marginTop: 8,
    alignSelf: "stretch",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  distractionCount: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
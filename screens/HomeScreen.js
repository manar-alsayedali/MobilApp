import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  ScrollView,
  TextInput,
  Alert,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INITIAL_CATEGORIES = ["Ders Çalışma", "Kodlama", "Proje", "Kitap Okuma"];
const DEFAULT_MINUTES = 25;


const TABS_ORDER = ["Home", "Reports", "History"];

export default function HomeScreen({ navigation, route }) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("Ders Çalışma");

  const [targetMinutes, setTargetMinutes] = useState(DEFAULT_MINUTES);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MINUTES * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [lastSessionSummary, setLastSessionSummary] = useState(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [sessionGoal, setSessionGoal] = useState("");

  const appState = useRef(AppState.currentState);
  const pausedByBackgroundRef = useRef(false);

 
  const currentRouteName = route?.name ?? "Home";
  const currentIndex = TABS_ORDER.indexOf(currentRouteName);

  //  PanResponder sola ve sağa kaydırma ile tablar arasında geçiş
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;

        // sağadan sola kaydırma → sonraki taba git
        if (dx < -20 && currentIndex < TABS_ORDER.length - 1) {
          const nextRoute = TABS_ORDER[currentIndex + 1];
          navigation.navigate(nextRoute);
        }
        // soldan sağa kaydırma → önceki taba git
        else if (dx > 20 && currentIndex > 0) {
          const prevRoute = TABS_ORDER[currentIndex - 1];
          navigation.navigate(prevRoute);
        }
      },
    })
  ).current;

  // Zamanlayıcı mantığı
  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const elapsed = targetMinutes * 60;
            endSession("Süre tamamlandı", elapsed);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetMinutes]);

  //  AppState: dikkatim dağıldı kontrolü
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = appState.current;

      if (
        prevState === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        if (isRunning) {
          setIsRunning(false);
          setDistractions((prev) => prev + 1);
          pausedByBackgroundRef.current = true;
        }
      }

      if (
        (prevState === "background" || prevState === "inactive") &&
        nextState === "active"
      ) {
        if (pausedByBackgroundRef.current) {
          Alert.alert(
            "Devam etmek ister misin?",
            "Uygulamadan çıktığın için seans duraklatıldı.",
            [
              {
                text: "Hayır",
                style: "cancel",
                onPress: () => {
                  pausedByBackgroundRef.current = false;
                },
              },
              {
                text: "Evet, devam et",
                onPress: () => {
                  setIsRunning(true);
                  pausedByBackgroundRef.current = false;
                },
              },
            ]
          );
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

  const adjustTargetMinutes = (delta) => {
    if (isRunning) return;

    const newMinutes = Math.min(120, Math.max(5, targetMinutes + delta));
    setTargetMinutes(newMinutes);
    setRemainingSeconds(newMinutes * 60);
    setDistractions(0);
    setLastSessionSummary(null);
  };

  const handleStartPause = () => {
    if (isRunning) {
      const elapsedSeconds = targetMinutes * 60 - remainingSeconds;
      endSession("Kullanıcı tarafından durduruldu", elapsedSeconds);
      pausedByBackgroundRef.current = false;
    } else {
      setLastSessionSummary(null);
      setIsRunning(true);
      pausedByBackgroundRef.current = false;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(targetMinutes * 60);
    setDistractions(0);
    setLastSessionSummary(null);
    pausedByBackgroundRef.current = false;
  };

  const handleManualDistraction = () => {
    if (!isRunning) return;
    setDistractions((prev) => prev + 1);
  };

  const saveSessionToStorage = async (summary) => {
    const newSession = {
      id: Date.now().toString(),
      category: summary.category,
      duration: summary.durationSeconds,
      distractions: summary.distractions,
      reason: summary.reason,
      goal: summary.goal || null,
      date: new Date().toISOString(),
    };

    try {
      const existing = await AsyncStorage.getItem("@sessions");
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.push(newSession);
      await AsyncStorage.setItem("@sessions", JSON.stringify(sessions));
    } catch (e) {
      console.log("Error saving session", e);
    }
  };

  const endSession = (reason, elapsedSeconds) => {
    setIsRunning(false);

    if (!elapsedSeconds || elapsedSeconds <= 0) {
      return;
    }

    const summary = {
      category: selectedCategory,
      durationSeconds: elapsedSeconds,
      distractions,
      reason,
      goal: sessionGoal.trim() || null,
    };

    setLastSessionSummary(summary);
    saveSessionToStorage(summary);
    pausedByBackgroundRef.current = false;
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsRunning(false);
    setTargetMinutes(DEFAULT_MINUTES);
    setRemainingSeconds(DEFAULT_MINUTES * 60);
    setDistractions(0);
    setLastSessionSummary(null);
    pausedByBackgroundRef.current = false;
    setSessionGoal("");
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const name = newCategoryName.trim();

    const exists = categories.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      alert("Bu kategori zaten mevcut.");
      return;
    }

    const updated = [...categories, name];
    setCategories(updated);
    setNewCategoryName("");
    handleSelectCategory(name);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      {...panResponder.panHandlers} 
    >
      <Text style={styles.title}>Odaklanma Zamanlayıcısı</Text>
      <Text style={styles.subtitle}>
        Pomodoro tarzı odaklanma seanslarını kategorilere göre takip et.
      </Text>

      {/* Kategori Seçimi + yeni kategori ekleme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategori Seç</Text>

        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => handleSelectCategory(cat)}
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

        <View className="addCategoryRow" style={styles.addCategoryRow}>
          <TextInput
            style={styles.input}
            placeholder="Yeni kategori ekle..."
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity
            style={[styles.button, styles.addCategoryButton]}
            onPress={handleAddCategory}
          >
            <Text style={styles.buttonText}>Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seans Hedefi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bu oturumdaki hedefin</Text>
        <Text style={styles.helperText}>
          Örn: "Bölüm 3'ü bitirmek" veya "10 soru çözmek".
        </Text>
        <TextInput
          style={styles.goalInput}
          placeholder="Kısa bir hedef yaz..."
          value={sessionGoal}
          onChangeText={setSessionGoal}
          multiline
        />
      </View>

      {/* Zamanlayıcı */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zamanlayıcı (Geri Sayım)</Text>

        <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
        <Text style={styles.helperText}>
          Hedef süre: {targetMinutes} dk (5–120 dk arası ayarlanabilir)
        </Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.smallButton, styles.secondaryButton]}
            onPress={() => adjustTargetMinutes(-5)}
          >
            <Text style={styles.buttonText}>-5 dk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.secondaryButton]}
            onPress={() => adjustTargetMinutes(5)}
          >
            <Text style={styles.buttonText}>+5 dk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartPause}
          >
            <Text style={styles.buttonText}>
              {isRunning ? "Duraklat" : "Başlat"}
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

      {/* Dikkat Dağınıklığı */}
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

      {/* Seans Özeti */}
      {lastSessionSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seans Özeti</Text>
          <Text style={styles.summaryText}>
            Kategori:{" "}
            <Text style={styles.summaryValue}>
              {lastSessionSummary.category}
            </Text>
          </Text>
          <Text style={styles.summaryText}>
            Süre:{" "}
            <Text style={styles.summaryValue}>
              {formatTime(lastSessionSummary.durationSeconds)}
            </Text>
          </Text>
          <Text style={styles.summaryText}>
            Dikkat Dağınıklığı:{" "}
            <Text style={styles.summaryValue}>
              {lastSessionSummary.distractions} kez
            </Text>
          </Text>
          {lastSessionSummary.goal && (
            <Text style={styles.summaryText}>
              Hedef:{" "}
              <Text style={styles.summaryValue}>{lastSessionSummary.goal}</Text>
            </Text>
          )}
          <Text style={styles.summaryText}>
            Durum:{" "}
            <Text style={styles.summaryValue}>{lastSessionSummary.reason}</Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  contentContainer: { padding: 20, paddingTop: 30, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  categoryChipSelected: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  categoryText: {
    fontSize: 13,
    color: "#374151",
  },
  categoryTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  addCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    fontSize: 14,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    fontSize: 14,
    minHeight: 40,
    textAlignVertical: "top",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 8,
    color: "#111827",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    marginHorizontal: 6,
    minWidth: 110,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    marginHorizontal: 6,
    minWidth: 90,
  },
  primaryButton: { backgroundColor: "#4f46e5" },
  secondaryButton: { backgroundColor: "#6b7280" },
  warningButton: { backgroundColor: "#f97316", marginTop: 8 },
  addCategoryButton: { backgroundColor: "#22c55e", marginLeft: 8 },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  distractionCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 2,
  },
  summaryValue: {
    fontWeight: "600",
    color: "#111827",
  },
});
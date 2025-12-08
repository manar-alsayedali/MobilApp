import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width - 32;

export default function ReportsScreen() {
  const [sessions, setSessions] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSessions();
    }
  }, [isFocused]);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem("@sessions");
      const parsed = stored ? JSON.parse(stored) : [];
      setSessions(parsed);
    } catch (e) {
      console.log("Error loading sessions", e);
    }
  };

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalDistractions = sessions.reduce(
    (sum, s) => sum + (s.distractions || 0),
    0
  );

  // تجميع حسب الفئة
  const categoryMap = {};
  sessions.forEach((s) => {
    const cat = s.category || "Diğer";
    categoryMap[cat] = (categoryMap[cat] || 0) + (s.duration || 0);
  });

  const categoryLabels = Object.keys(categoryMap);
  const categoryDurations = Object.values(categoryMap).map((sec) =>
    Math.round(sec / 60)
  ); // بالدقائق

  const pieData = categoryLabels.map((label, index) => ({
    name: label,
    population: categoryDurations[index] || 0,
    color: PIE_COLORS[index % PIE_COLORS.length],
    legendFontColor: "#333",
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Raporlar</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel İstatistikler</Text>
        <Text>Toplam Oturum Sayısı: {totalSessions}</Text>
        <Text>Toplam Odaklanma Süresi: {totalMinutes} dakika</Text>
        <Text>Toplam Dikkat Dağınıklığı: {totalDistractions} kez</Text>
      </View>

      {categoryLabels.length > 0 && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategori Bazlı Süre (Bar Chart)</Text>
            <BarChart
              data={{
                labels: categoryLabels,
                datasets: [{ data: categoryDurations }],
              }}
              width={screenWidth}
              height={220}
              fromZero
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategori Dağılımı (Pie Chart)</Text>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={220}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        </>
      )}

      {categoryLabels.length === 0 && (
        <View style={styles.section}>
          <Text>Henüz kayıtlı oturum yok. Lütfen önce zamanlayıcıdan oturum ekleyin.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const PIE_COLORS = ["#007AFF", "#FF9500", "#34C759", "#AF52DE", "#FF2D55"];

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  chart: {
    marginTop: 8,
    borderRadius: 12,
  },
});
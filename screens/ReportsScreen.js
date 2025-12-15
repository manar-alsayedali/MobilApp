import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const chartBaseWidth = screenWidth - 32;


const TABS_ORDER = ["Home", "Reports", "History"];

export default function ReportsScreen({ navigation, route }) {
  const [sessions, setSessions] = useState([]);
  const isFocused = useIsFocused();

  const currentRouteName = route?.name ?? "Reports";
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
      setSessions(parsed);
    } catch (e) {
      console.log("Error loading sessions", e);
    }
  };

  const getDateKey = (dateStr) => {
    const d = new Date(dateStr);
    return d.toDateString();
  };

  const todayKey = new Date().toDateString();

  const totalSecondsAllTime = sessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );
  const totalDistractions = sessions.reduce(
    (sum, s) => sum + (s.distractions || 0),
    0
  );
  const totalSecondsToday = sessions
    .filter((s) => getDateKey(s.date) === todayKey)
    .reduce((sum, s) => sum + (s.duration || 0), 0);

  const secondsToMinutes = (sec) => Math.round(sec / 60);

  const getMondayFirstIndex = (dateObj) => {
    const day = dateObj.getDay();
    return (day + 6) % 7;
  };

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const key = d.toDateString();
    const label = d.toLocaleDateString("tr-TR", {
      weekday: "short",
    });

    const daySeconds = sessions
      .filter((s) => getDateKey(s.date) === key)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    last7.push({
      key,
      label,
      minutes: secondsToMinutes(daySeconds),
      weekdayIndex: getMondayFirstIndex(d),
    });
  }

  last7.sort((a, b) => a.weekdayIndex - b.weekdayIndex);

  const last7Labels = last7.map((d) => d.label);
  const last7Values = last7.map((d) => d.minutes);

  const barChartWidth = Math.max(chartBaseWidth, last7Labels.length * 60);

  const categoryMap = {};
  sessions.forEach((s) => {
    const cat = s.category || "Diğer";
    categoryMap[cat] = (categoryMap[cat] || 0) + (s.duration || 0);
  });

  const categoryLabels = Object.keys(categoryMap);
  const categoryMinutes = Object.values(categoryMap).map((sec) =>
    secondsToMinutes(sec)
  );

  const PIE_COLORS = ["#4f46e5", "#f97316", "#22c55e", "#0ea5e9", "#ec4899"];
  const MAX_LEGEND_NAME = 12;

  const pieData = categoryLabels.map((fullLabel, index) => {
    const minutes = categoryMinutes[index] || 0;
    const shortLabel =
      fullLabel.length > MAX_LEGEND_NAME
        ? fullLabel.slice(0, MAX_LEGEND_NAME - 1) + "…"
        : fullLabel;

    return {
      name: shortLabel,
      population: minutes,
      color: PIE_COLORS[index % PIE_COLORS.length],
      legendFontColor: "#4b5563",
      legendFontSize: 11,
    };
  });

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    propsForDots: {
      r: "4",
    },
  };

  const totalMinutesAllTime = secondsToMinutes(totalSecondsAllTime);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      {...panResponder.panHandlers}
    >
      <Text style={styles.title}> Raporlar</Text>
      <Text style={styles.subtitle}>
        Odaklanma alışkanlıklarını günlere ve kategorilere göre incele.
      </Text>

      {/* Genel İstatistikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel İstatistikler</Text>
        <Text style={styles.statText}>
          Bugün Toplam Odaklanma Süresi:{" "}
          <Text style={styles.statValue}>
            {secondsToMinutes(totalSecondsToday)} dk
          </Text>
        </Text>
        <Text style={styles.statText}>
          Tüm Zamanların Toplam Odaklanma Süresi:{" "}
          <Text style={styles.statValue}>
            {secondsToMinutes(totalSecondsAllTime)} dk
          </Text>
        </Text>
        <Text style={styles.statText}>
          Toplam Dikkat Dağınıklığı Sayısı:{" "}
          <Text style={styles.statValue}>{totalDistractions}</Text>
        </Text>
      </View>

      {/* Son 7 gün Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Son 7 Gün Odaklanma Süreleri (dk)
        </Text>
        <Text style={styles.helperText}>
          Her sütun ilgili gündeki toplam odaklanma süresini gösterir.
        </Text>

        <View style={styles.chartWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: last7Labels,
                datasets: [{ data: last7Values }],
              }}
              width={barChartWidth}
              height={220}
              fromZero
              showValuesOnTopOfBars
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </ScrollView>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Kategorilere Göre Odaklanma Süresi Dağılımı
        </Text>
        <Text style={styles.helperText}>
          Hangi kategoride ne kadar süre odaklandığını yüzdesel olarak gösterir.
        </Text>

        {categoryLabels.length > 0 ? (
          <>
            <PieChart
              data={pieData}
              width={chartBaseWidth}
              height={220}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              chartConfig={chartConfig}
              style={styles.chart}
            />

            <View style={styles.legendContainer}>
              {categoryLabels.map((fullLabel, index) => {
                const minutes = categoryMinutes[index] || 0;
                const percentage =
                  totalMinutesAllTime > 0
                    ? Math.round((minutes / totalMinutesAllTime) * 100)
                    : 0;

                const legendLine = `${fullLabel}: ${minutes} dk (%${percentage})`;

                return (
                  <Text key={fullLabel} style={styles.legendText}>
                    {legendLine}
                  </Text>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>
            Henüz kayıtlı oturum yok. Ana sayfadan seans başlatarak verileri
            görselleştirebilirsin.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  contentContainer: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 26,
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
  section: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111827",
  },
  helperText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
  },
  statText: {
    fontSize: 15,
    marginBottom: 4,
    color: "#4b5563",
  },
  statValue: {
    fontWeight: "700",
    color: "#111827",
  },
  chartWrapper: {
    marginTop: 4,
  },
  chart: {
    marginTop: 4,
    borderRadius: 16,
  },
  legendContainer: {
    marginTop: 12,
  },
  legendText: {
    fontSize: 14,
    marginBottom: 4,
    flexWrap: "wrap",
    width: "100%",
    color: "#4b5563",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
});
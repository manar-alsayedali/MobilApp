// App.js
import React, { useEffect } from "react";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";

import TabNavigator from "./navigation/TabNavigator";

// Bildirimler nasıl görünsün? (foreground handler)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // ekranda göstersin
    shouldPlaySound: true,   // ses çalsın
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      // Android için kanal ayarı
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      // İzin durumu
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "İzin gerekli",
          "Bildirim gönderebilmek için bildirim izni vermen gerekiyor."
        );
      }
    };

    setupNotifications();
  }, []);

  return <TabNavigator />;
}
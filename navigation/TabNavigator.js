import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import ReportsScreen from "../screens/ReportsScreen";
import HistoryScreen from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Zamanlayıcı" }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: "Raporlar" }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Geçmiş" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
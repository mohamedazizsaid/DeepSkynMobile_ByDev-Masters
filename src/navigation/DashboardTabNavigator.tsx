import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing } from '../theme';
import { AuthenticatedAppBar } from '../components';
import { useAccessibilityStyles } from '../stores/useAccessibilityStyles';

// Dashboard screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AnalysisScreen } from '../screens/dashboard/AnalysisScreen';
import { EvolutionScreen } from '../screens/dashboard/EvolutionScreen';
import { RoutineScreen } from '../screens/dashboard/RoutineScreen';
import { ChatScreen } from '../screens/dashboard/ChatScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import { SubscriptionScreen } from '../screens/dashboard/SubscriptionScreen';
import { SettingsScreen } from '../screens/dashboard/SettingsScreen';
import { CommunityScreen } from '../screens/dashboard/CommunityScreen';
import { NotificationScreen } from '../screens/dashboard/NotificationScreen';

export type DashboardTabParamList = {
  Home: undefined;
  Analysis: undefined;
  Routine: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Evolution: undefined;
  Subscription: undefined;
  Settings: undefined;
  Community: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Evolution" component={EvolutionScreen} />
      <HomeStack.Screen name="Subscription" component={SubscriptionScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="Community" component={CommunityScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationScreen} />
    </HomeStack.Navigator>
  );
}

const tabIconMap: Record<string, { active: any; inactive: any }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Analysis: { active: 'scan', inactive: 'scan-outline' },
  Routine: { active: 'calendar', inactive: 'calendar-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function DashboardTabNavigator() {
  const { colors, fontSizes } = useAccessibilityStyles();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AuthenticatedAppBar />,
        headerStatusBarHeight: 0,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: [styles.tabLabel, { fontSize: fontSizes.xs }],
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIconMap[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Routine" component={RoutineScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    height: 64,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
});

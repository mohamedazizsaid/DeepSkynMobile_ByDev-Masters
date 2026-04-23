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
import { CameraScanScreen } from '../screens/dashboard/CameraScanScreen';
import { AnalysisResultScreen } from '../screens/dashboard/AnalysisResultScreen';
import { AnalysisHistoryScreen } from '../screens/dashboard/AnalysisHistoryScreen';
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

export type AnalysisStackParamList = {
  AnalysisHub: undefined;
  CameraScan: undefined;
  MultiPhotoScan: undefined;
  MultiPhotoCamera: undefined;
  AnalysisResult: { analysisId?: string };
  AnalysisHistory: undefined;
  ProductScan: undefined;
  ProductAnalysis: { product: any };
};

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const AnalysisStack = createStackNavigator<AnalysisStackParamList>();

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

function AnalysisStackNavigator() {
  const { MultiPhotoScanScreen } = require('../screens/dashboard/MultiPhotoScanScreen');
  const { MultiPhotoCameraScreen } = require('../screens/dashboard/MultiPhotoCameraScreen');

  // Import ProductScan screens
  const { ProductScanScreen } = require('../screens/dashboard/ProductScanScreen');
  const { ProductAnalysisScreen } = require('../screens/dashboard/ProductAnalysisScreen');

  return (
    <AnalysisStack.Navigator screenOptions={{ headerShown: false }}>
      <AnalysisStack.Screen name="AnalysisHub" component={AnalysisScreen} />
      <AnalysisStack.Screen name="CameraScan" component={CameraScanScreen} />
      <AnalysisStack.Screen name="MultiPhotoScan" component={MultiPhotoScanScreen} />
      <AnalysisStack.Screen name="MultiPhotoCamera" component={MultiPhotoCameraScreen} />
      <AnalysisStack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
      <AnalysisStack.Screen name="AnalysisHistory" component={AnalysisHistoryScreen} />
      <AnalysisStack.Screen name="ProductScan" component={ProductScanScreen} />
      <AnalysisStack.Screen name="ProductAnalysis" component={ProductAnalysisScreen} />
    </AnalysisStack.Navigator>
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
      <Tab.Screen name="Analysis" component={AnalysisStackNavigator} />
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
    paddingTop: 0,
    paddingBottom: Spacing.sm,
    height: 60,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
});

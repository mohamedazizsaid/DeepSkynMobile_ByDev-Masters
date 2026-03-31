import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';
import { Colors, Gradients, FontSizes, FontWeights, Spacing, BorderRadius } from '../../theme';
import {
  WeatherData,
  AIAdviceResponse,
  fetchCompleteWeatherData,
} from '../../services/weather.service';

const WMO_ICONS: Record<string, { icon: string; name: keyof typeof Ionicons.glyphMap }> = {
  clear: { icon: '☀️', name: 'sunny' },
  mostly_clear: { icon: '🌤️', name: 'partly-sunny' },
  partly_cloudy: { icon: '⛅', name: 'partly-sunny' },
  overcast: { icon: '☁️', name: 'cloud' },
  foggy: { icon: '🌫️', name: 'cloud' },
  light_rain: { icon: '🌧️', name: 'rainy' },
  moderate_rain: { icon: '🌧️', name: 'rainy' },
  heavy_rain: { icon: '⛈️', name: 'thunderstorm' },
  thunderstorm: { icon: '⛈️', name: 'thunderstorm' },
  unknown: { icon: '🌐', name: 'globe' },
};

interface WeatherWidgetProps {
  compact?: boolean;
  showAdvice?: boolean;
  onPress?: () => void;
}

export function WeatherWidget({ compact = false, showAdvice = true, onPress }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompleteWeatherData();
      setWeather(data.weather);
      setAdvice(data.advice);
    } catch (err) {
      console.error('Weather load error:', err);
      setError('Impossible de charger la météo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const getUVLevel = (uv: number): { label: string; color: string } => {
    if (uv <= 2) return { label: 'Faible', color: Colors.success };
    if (uv <= 5) return { label: 'Modéré', color: Colors.warning };
    if (uv <= 7) return { label: 'Élevé', color: Colors.amber };
    if (uv <= 10) return { label: 'Très élevé', color: Colors.error };
    return { label: 'Extrême', color: Colors.errorDark };
  };

  const weatherIcon = weather ? WMO_ICONS[weather.condition] || WMO_ICONS.unknown : WMO_ICONS.unknown;

  if (loading) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement météo...</Text>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card style={styles.errorCard}>
        <Ionicons name="cloud-offline-outline" size={24} color={Colors.gray400} />
        <Text style={styles.errorText}>{error || 'Météo indisponible'}</Text>
        <TouchableOpacity onPress={loadWeather} style={styles.retryButton}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  const uvLevel = getUVLevel(weather.uvIndex);

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
        <Card style={styles.compactCard}>
          <View style={styles.compactRow}>
            <Text style={styles.weatherEmoji}>{weatherIcon.icon}</Text>
            <View style={styles.compactInfo}>
              <Text style={styles.compactTemp}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.compactCity}>{weather.city || 'Ma position'}</Text>
            </View>
            <View style={styles.compactUV}>
              <Text style={[styles.uvValue, { color: uvLevel.color }]}>UV {weather.uvIndex}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card variant="elevated" style={styles.card}>
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{weather.city || 'Ma position'}</Text>
          </View>
          <TouchableOpacity onPress={loadWeather} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={18} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.mainInfo}>
          <View style={styles.tempContainer}>
            <Text style={styles.weatherEmoji}>{weatherIcon.icon}</Text>
            <Text style={styles.temperature}>{Math.round(weather.temperature)}°</Text>
          </View>
          <Text style={styles.feelsLike}>
            Ressenti {Math.round(weather.feelsLike)}°C
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Ionicons name="water-outline" size={18} color={Colors.teal} />
            <Text style={styles.metricValue}>{weather.humidity}%</Text>
            <Text style={styles.metricLabel}>Humidité</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Ionicons name="sunny-outline" size={18} color={uvLevel.color} />
            <Text style={[styles.metricValue, { color: uvLevel.color }]}>{weather.uvIndex}</Text>
            <Text style={styles.metricLabel}>UV {uvLevel.label}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Ionicons name="speedometer-outline" size={18} color={Colors.purple} />
            <Text style={styles.metricValue}>{Math.round(weather.windSpeed)}</Text>
            <Text style={styles.metricLabel}>km/h</Text>
          </View>
        </View>

        {showAdvice && advice && (
          <View style={[styles.adviceContainer, { backgroundColor: getAdviceBgColor(advice.urgency) }]}>
            <Text style={styles.adviceEmoji}>{advice.emoji}</Text>
            <Text style={styles.adviceText}>{advice.advice}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const getAdviceBgColor = (urgency: string): string => {
  switch (urgency) {
    case 'high':
      return Colors.errorAlpha10;
    case 'medium':
      return Colors.warningAlpha10;
    default:
      return Colors.successAlpha10;
  }
};

interface WeatherBadgeProps {
  onPress?: () => void;
}

export function WeatherBadge({ onPress }: WeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchCompleteWeatherData()
      .then((data) => setWeather(data.weather))
      .catch(console.error);
  }, []);

  if (!weather) return null;

  const weatherIcon = WMO_ICONS[weather.condition] || WMO_ICONS.unknown;

  return (
    <TouchableOpacity onPress={onPress} style={styles.badge}>
      <Text>{weatherIcon.icon}</Text>
      <Text style={styles.badgeTemp}>{Math.round(weather.temperature)}°</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationIcon: {
    fontSize: 14,
  },
  location: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.white,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  mainInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  weatherEmoji: {
    fontSize: 48,
  },
  temperature: {
    fontSize: 56,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  feelsLike: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginTop: Spacing.xs,
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  adviceEmoji: {
    fontSize: 20,
  },
  adviceText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.gray700,
    lineHeight: 20,
  },
  // Compact styles
  compactCard: {
    padding: Spacing.md,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  compactInfo: {
    flex: 1,
  },
  compactTemp: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  compactCity: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  compactUV: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryAlpha10,
    borderRadius: BorderRadius.sm,
  },
  uvValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  // Loading/Error styles
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
  },
  errorCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
  },
  retryButton: {
    marginTop: Spacing.sm,
  },
  retryText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryAlpha10,
    borderRadius: BorderRadius.full,
  },
  badgeTemp: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
});

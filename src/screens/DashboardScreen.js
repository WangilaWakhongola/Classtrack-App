import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { attendanceService } from '../services/attendanceService';
import { useAuth } from '../hooks/useAuth';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await attendanceService.getStudentStats(user.id);
      setStats(data);
    } catch (e) {
      console.log('Error loading stats', e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: stats?.weeklyLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{ data: stats?.weeklyData || [1, 0, 1, 1, 0, 1] }],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.name}>{user?.name || 'Student'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'S')[0].toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              icon="checkmark-circle"
              color="#16A34A"
              bg="#F0FDF4"
              label="Present"
              value={stats?.present ?? 0}
            />
            <StatCard
              icon="close-circle"
              color="#DC2626"
              bg="#FEF2F2"
              label="Absent"
              value={stats?.absent ?? 0}
            />
            <StatCard
              icon="stats-chart"
              color="#4F46E5"
              bg="#EEF2FF"
              label="Rate"
              value={`${stats?.rate ?? 0}%`}
            />
          </View>

          {/* Attendance Rate Alert */}
          {stats?.rate < 75 && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#D97706" />
              <Text style={styles.warningText}>
                Your attendance is below 75%. You need {stats?.needed ?? 0} more classes.
              </Text>
            </View>
          )}

          {/* Weekly Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>This Week's Attendance</Text>
            <BarChart
              data={chartData}
              width={screenWidth - 72}
              height={160}
              yAxisLabel=""
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                labelColor: () => '#6B7280',
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 10 }}
              fromZero
            />
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {(stats?.recentActivity || []).map((item, idx) => (
            <View key={idx} style={styles.activityItem}>
              <View style={[styles.dot, { backgroundColor: item.present ? '#16A34A' : '#DC2626' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityClass}>{item.className}</Text>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
              <Text style={[styles.activityStatus, { color: item.present ? '#16A34A' : '#DC2626' }]}>
                {item.present ? 'Present' : 'Absent'}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, color, bg, label, value }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E' },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  activityClass: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activityDate: { fontSize: 12, color: '#9CA3AF' },
  activityStatus: { fontSize: 13, fontWeight: '700' },
});

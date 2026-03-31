import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Image
} from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { attendanceService } from '../services/attendanceService';
import { useAuth } from '../hooks/useAuth';
import { isWithinGeofence } from '../utils/geoUtils';

const CLASSROOM_RADIUS_METERS = 50; // 50 meters radius

export default function AttendanceScreen() {
  const [location, setLocation] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [inRange, setInRange] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieUri, setSelfieUri] = useState(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const cameraRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    loadClassrooms();
    getLocation();
  }, []);

  const loadClassrooms = async () => {
    try {
      const data = await attendanceService.getTodayClasses(user.id);
      setClassrooms(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load today\'s classes.');
    }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to sign attendance.');
      setLocationLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
    setLocationLoading(false);
  };

  const checkInRange = (classroom) => {
    if (!location || !classroom) return false;
    return isWithinGeofence(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: classroom.latitude, longitude: classroom.longitude },
      CLASSROOM_RADIUS_METERS
    );
  };

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    if (location) {
      const within = checkInRange(cls);
      setInRange(within);
    }
    const signed = await attendanceService.checkAlreadySigned(user.id, cls.id);
    setAlreadySigned(signed);
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
    setSelfieUri(photo.uri);
    setShowCamera(false);
  };

  const handleSignAttendance = async () => {
    if (!selectedClass) {
      Alert.alert('No Class Selected', 'Please select a class first.');
      return;
    }
    if (!location) {
      Alert.alert('No Location', 'Could not get your location. Please try again.');
      return;
    }
    const within = checkInRange(selectedClass);
    if (!within) {
      Alert.alert(
        'Out of Range',
        `You must be within ${CLASSROOM_RADIUS_METERS}m of the classroom to sign attendance. You are currently too far away.`
      );
      return;
    }
    if (!selfieUri) {
      Alert.alert('Selfie Required', 'Please take a selfie for verification.');
      setShowCamera(true);
      return;
    }
    setLoading(true);
    try {
      const result = await attendanceService.signAttendance({
        studentId: user.id,
        classId: selectedClass.id,
        latitude: location.latitude,
        longitude: location.longitude,
        selfieUri,
        timestamp: new Date().toISOString(),
      });
      if (result.success) {
        setAlreadySigned(true);
        Alert.alert('✅ Success', 'Attendance signed successfully!');
        setSelfieUri(null);
      } else {
        Alert.alert('Failed', result.message || 'Could not sign attendance.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <Camera style={{ flex: 1 }} type={Camera.Constants.Type.front} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraHint}>Center your face in the frame</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
              <Ionicons name="camera" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSub}>{new Date().toDateString()}</Text>
      </View>

      {/* Location Status */}
      <View style={[styles.locationCard, inRange ? styles.inRange : styles.outRange]}>
        <Ionicons
          name={inRange ? 'location' : 'location-outline'}
          size={22}
          color={inRange ? '#16A34A' : '#DC2626'}
        />
        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.locationStatus, { color: inRange ? '#16A34A' : '#DC2626' }]}>
            {locationLoading ? 'Getting location...' : inRange ? 'You are in classroom range ✓' : 'You are outside classroom range'}
          </Text>
          {location && (
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={getLocation} style={{ marginLeft: 'auto' }}>
          <Ionicons name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Classes List */}
      <Text style={styles.sectionTitle}>Today's Classes</Text>
      {classrooms.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>No classes scheduled today</Text>
        </View>
      ) : (
        classrooms.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={[styles.classCard, selectedClass?.id === cls.id && styles.classCardSelected]}
            onPress={() => handleSelectClass(cls)}
          >
            <View style={styles.classInfo}>
              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.classDetails}>{cls.time} — Room {cls.room}</Text>
              <Text style={styles.classInstructor}>Prof. {cls.instructor}</Text>
            </View>
            {selectedClass?.id === cls.id && (
              <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
            )}
          </TouchableOpacity>
        ))
      )}

      {/* Selfie Preview */}
      {selfieUri && (
        <View style={styles.selfieContainer}>
          <Text style={styles.sectionTitle}>Selfie Captured</Text>
          <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
          <TouchableOpacity onPress={() => { setSelfieUri(null); setShowCamera(true); }}>
            <Text style={styles.retakeText}>Retake Selfie</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {!selfieUri && selectedClass && (
        <TouchableOpacity style={styles.selfieBtn} onPress={() => setShowCamera(true)}>
          <Ionicons name="camera-outline" size={20} color="#4F46E5" />
          <Text style={styles.selfieBtnText}>Take Selfie for Verification</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.signBtn, (!selectedClass || alreadySigned) && styles.signBtnDisabled]}
        onPress={handleSignAttendance}
        disabled={loading || !selectedClass || alreadySigned}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name={alreadySigned ? 'checkmark-done' : 'finger-print'} size={22} color="#fff" />
            <Text style={styles.signText}>
              {alreadySigned ? 'Already Signed In' : 'Sign Attendance'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 14, marginBottom: 24, borderWidth: 1.5,
  },
  inRange: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  outRange: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  locationStatus: { fontSize: 14, fontWeight: '600' },
  locationCoords: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  emptyBox: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 14 },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 14 },
  classCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    elevation: 2,
  },
  classCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '700', color: '#111827' },
  classDetails: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  classInstructor: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  selfieContainer: { marginVertical: 16, alignItems: 'center' },
  selfiePreview: { width: 120, height: 120, borderRadius: 60, marginBottom: 8 },
  retakeText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  selfieBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#4F46E5', borderRadius: 14,
    padding: 14, marginBottom: 12, gap: 8,
  },
  selfieBtnText: { color: '#4F46E5', fontSize: 15, fontWeight: '600' },
  signBtn: {
    backgroundColor: '#4F46E5', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 8, gap: 10,
  },
  signBtnDisabled: { backgroundColor: '#9CA3AF' },
  signText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cameraOverlay: {
    flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40,
  },
  cameraHint: {
    color: '#fff', fontSize: 16, marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 4, borderColor: '#fff',
  },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

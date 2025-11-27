import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthProvider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ScanQRScreen() {
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendancePeriod, setAttendancePeriod] = useState('morning');
  const [currentTime, setCurrentTime] = useState(new Date());

  const { addAttendance, checkAttendanceStatus } = useAttendance();
  const { user } = useAuth();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  // Get current period message
  const getPeriodMessage = () => {
    const hour = currentTime.getHours();
    const period = hour < 12 ? 'morning' : 'afternoon';
    
    if (period === 'morning') {
      if (hour < 8) return { text: '✓ Before 8:00 AM - PRESENT', color: '#4caf50', icon: 'check-circle' };
      if (hour < 10) return { text: '⚠️ 8:00-9:59 AM - LATE', color: '#ff9800', icon: 'clock-alert' };
      return { text: '❌ After 10:00 AM - ABSENT', color: '#f44336', icon: 'close-circle' };
    } else {
      if (hour < 14) return { text: '✓ Before 2:00 PM - PRESENT', color: '#4caf50', icon: 'check-circle' };
      if (hour < 15) return { text: '⚠️ 2:00-2:59 PM - LATE', color: '#ff9800', icon: 'clock-alert' };
      return { text: '❌ After 3:00 PM - ABSENT', color: '#f44336', icon: 'close-circle' };
    }
  };

  const periodMsg = getPeriodMessage();

  // Verify student belongs to teacher
  const handleBarCodeScanned = async ({ data }) => {
    if (hasScanned || !user) return;
    
    setHasScanned(true);
    setScanning(false);

    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      // Verify student exists and belongs to this teacher
      if (qrData.studentId) {
        try {
          const studentsRef = collection(db, 'students');
          const q = query(
            studentsRef, 
            where('studentId', '==', qrData.studentId),
            where('teacherId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            Alert.alert(
              'Access Denied',
              'This student does not belong to your class.',
              [{ text: 'OK', onPress: () => resetScanner() }]
            );
            return;
          }
        } catch (error) {
          console.error('Error verifying student:', error);
        }
      }

      // Check attendance status automatically
      const { status, period } = checkAttendanceStatus();
      setAttendanceStatus(status);
      setAttendancePeriod(period);

      setScannedStudent({
        name: qrData.name || 'Unknown Student',
        studentId: qrData.studentId || 'N/A',
        section: qrData.section || 'N/A',
        status: status,
        period: period,
        scanTime: currentTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      });
    } catch (e) {
      // Fallback for old QR codes without JSON
      Alert.alert(
        'Invalid QR Code',
        'This QR code format is not recognized. Please generate a new one.',
        [{ text: 'OK', onPress: () => resetScanner() }]
      );
    }
  };

  const handleMarkPresent = () => {
    setAttendanceStatus('present');
  };

  const handleMarkLate = () => {
    setAttendanceStatus('late');
  };

  const handleMarkAbsent = () => {
    setAttendanceStatus('absent');
  };

  const handleConfirmAttendance = async () => {
    try {
      // Add to attendance log with correct parameter order
      await addAttendance(
        scannedStudent.studentId,
        attendancePeriod,
        attendanceStatus
      );
      
      const statusEmoji = attendanceStatus === 'present' ? '✅' : attendanceStatus === 'late' ? '⚠️' : '❌';
      const periodText = attendancePeriod === 'morning' ? 'Morning' : 'Afternoon';
      
      Alert.alert(
        'Success', 
        `${statusEmoji} ${periodText} Attendance Recorded!\n\n` +
        `Student: ${scannedStudent.name}\n` +
        `Status: ${attendanceStatus.toUpperCase()}\n` +
        `Time: ${scannedStudent.scanTime}`
      );
      resetScanner();
    } catch (error) {
      console.error('Error recording attendance:', error);
      Alert.alert('Error', 'Failed to record attendance. Please try again.');
    }
  };

  const resetScanner = () => {
    setScannedStudent(null);
    setScanning(true);
    setHasScanned(false);
    setAttendanceStatus('present');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color="#8B0000" />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#8B0000" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>
              {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'} Session
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Period Status Banner */}
        <View style={[styles.warningBanner, { backgroundColor: periodMsg.color }]}>
          <Icon name={periodMsg.icon} size={20} color="#fff" />
          <Text style={styles.warningText}>{periodMsg.text}</Text>
        </View>

        {scanning ? (
          <View style={styles.scannerCard}>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
              </View>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Position QR code within the frame
              </Text>
              <Text style={[styles.instructionText, styles.boldText]}>
                {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'} attendance will be recorded automatically
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultCard}>
            <View style={[
              styles.successIcon,
              attendanceStatus === 'absent' ? styles.absentIcon :
              attendanceStatus === 'late' ? styles.lateIcon : styles.presentIcon
            ]}>
              <Icon 
                name={
                  attendanceStatus === 'absent' ? "close" :
                  attendanceStatus === 'late' ? "clock-alert" : "check"
                } 
                size={48} 
                color="#fff" 
              />
            </View>

            <View style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <Icon name="account-circle" size={40} color="#fff" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.studentName}>{scannedStudent?.name}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.studentStatus}>
                        {attendanceStatus.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodText}>
                        {scannedStudent?.period === 'morning' ? '🌅 MORNING' : '🌆 AFTERNOON'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.studentId}>{scannedStudent?.studentId}</Text>
                  <Text style={styles.studentSection}>Section: {scannedStudent?.section}</Text>
                </View>
              </View>
              <View style={styles.timeInfo}>
                <Icon name="clock-outline" size={16} color="#fff" />
                <Text style={styles.scanTimeText}>
                  Scanned: {scannedStudent?.scanTime}
                </Text>
              </View>
            </View>

            {/* Auto Status Message */}
            <View style={[
              styles.autoStatusMessage,
              attendanceStatus === 'absent' ? styles.absentMessage :
              attendanceStatus === 'late' ? styles.lateMessage : styles.presentMessage
            ]}>
              <Text style={styles.autoStatusText}>
                {attendanceStatus === 'absent' 
                  ? `❌ Auto-marked ABSENT (${scannedStudent?.period === 'morning' ? 'After 10 AM' : 'After 3 PM'})`
                  : attendanceStatus === 'late'
                  ? `⚠️ Auto-marked LATE (${scannedStudent?.period === 'morning' ? '8-9:59 AM' : '2-2:59 PM'})`
                  : `✅ Auto-marked PRESENT (${scannedStudent?.period === 'morning' ? 'Before 8 AM' : 'Before 2 PM'})`}
              </Text>
            </View>

            {/* Manual Override */}
            <Text style={styles.overrideLabel}>Override if needed:</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.presentButton,
                  attendanceStatus === 'present' && styles.activeButton
                ]} 
                onPress={handleMarkPresent}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.lateButton,
                  attendanceStatus === 'late' && styles.activeButton
                ]} 
                onPress={handleMarkLate}
              >
                <Icon name="clock-alert" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Late</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.absentButton,
                  attendanceStatus === 'absent' && styles.activeButton
                ]} 
                onPress={handleMarkAbsent}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Absent</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirmAttendance}
            >
              <Text style={styles.confirmButtonText}>Confirm Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetScanner}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: { 
    backgroundColor: '#8B0000', 
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  timeContainer: { alignItems: 'flex-end' },
  timeText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  dateText: { fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 2 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  warningText: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  scannerCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    alignItems: 'center', 
    margin: 16,
    flex: 1
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#8B0000',
    borderRadius: 12,
  },
  instructions: { marginTop: 24, alignItems: 'center' },
  instructionText: { fontSize: 13, color: '#666', marginBottom: 4, textAlign: 'center' },
  boldText: { fontWeight: '600', marginTop: 8 },
  resultCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    alignItems: 'center', 
    margin: 16 
  },
  successIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  presentIcon: { backgroundColor: '#4caf50' },
  lateIcon: { backgroundColor: '#ff9800' },
  absentIcon: { backgroundColor: '#f44336' },
  studentCard: { 
    backgroundColor: '#8B0000', 
    borderRadius: 12, 
    padding: 16, 
    width: '100%', 
    marginBottom: 16 
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  studentName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  badgeContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  periodBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  studentStatus: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  periodText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  studentId: { fontSize: 10, color: '#fff', opacity: 0.8, marginTop: 2 },
  studentSection: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 2 },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  scanTimeText: { fontSize: 12, color: '#fff', opacity: 0.9 },
  autoStatusMessage: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  presentMessage: { backgroundColor: '#e8f5e9' },
  lateMessage: { backgroundColor: '#fff3e0' },
  absentMessage: { backgroundColor: '#ffebee' },
  autoStatusText: { 
    fontSize: 13, 
    fontWeight: '600',
    textAlign: 'center',
  },
  overrideLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  actionButtons: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 12 },
  actionButton: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
    opacity: 0.5,
  },
  activeButton: { opacity: 1, borderWidth: 2, borderColor: '#333' },
  presentButton: { backgroundColor: '#4caf50' },
  lateButton: { backgroundColor: '#ff9800' },
  absentButton: { backgroundColor: '#f44336' },
  actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  confirmButton: {
    width: '100%',
    backgroundColor: '#8B0000',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { 
    width: '100%', 
    backgroundColor: '#e0e0e0', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
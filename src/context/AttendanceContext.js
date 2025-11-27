// context/AttendanceContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthProvider';

const AttendanceContext = createContext();

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};

export function AttendanceProvider({ children }) {
  const { user } = useAuth();
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load attendance logs
  useEffect(() => {
    if (user) {
      loadAttendanceLogs();
    }
  }, [user]);

  // Load attendance logs from Firestore
  const loadAttendanceLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'attendance'),
        where('teacherId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      
      setAttendanceLog(logs);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add attendance record
  const addAttendance = async (studentId, period, status) => {
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const attendanceData = {
        studentId,
        teacherId: user.uid,
        date: dateString,
        period, // 'morning' or 'afternoon'
        status, // 'present', 'late', 'absent'
        scanTime: timeString,
        timestamp: now.toISOString(),
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      
      // Add to local state
      setAttendanceLog(prev => [{ id: docRef.id, ...attendanceData }, ...prev]);

      return { success: true };
    } catch (error) {
      console.error('Error adding attendance:', error);
      return { success: false, error: 'Failed to record attendance' };
    }
  };

  // Get today's stats
  const getTodayStats = () => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });

    const todayLogs = attendanceLog.filter(log => log.date === today);

    const stats = {
      morning: { present: 0, late: 0, absent: 0 },
      afternoon: { present: 0, late: 0, absent: 0 },
    };

    todayLogs.forEach(log => {
      if (log.period === 'morning') {
        if (log.status === 'present') stats.morning.present++;
        else if (log.status === 'late') stats.morning.late++;
        else stats.morning.absent++;
      } else if (log.period === 'afternoon') {
        if (log.status === 'present') stats.afternoon.present++;
        else if (log.status === 'late') stats.afternoon.late++;
        else stats.afternoon.absent++;
      }
    });

    return stats;
  };

  // Get logs for specific date
  const getLogsByDate = (date) => {
    const dateString = date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
    return attendanceLog.filter(log => log.date === dateString);
  };

  // Get current attendance period (morning or afternoon)
  const getAttendancePeriod = () => {
    const now = new Date();
    const hours = now.getHours();
    
    // Morning: 6:00 AM - 12:00 PM
    // Afternoon: 12:00 PM - 6:00 PM
    if (hours >= 6 && hours < 12) {
      return 'morning';
    } else {
      return 'afternoon';
    }
  };

  // Check attendance status based on current time
  const checkAttendanceStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    
    // Morning session (Before 12 PM)
    if (hours < 12) {
      if (hours < 8) {
        // Before 8 AM - Present
        return { status: 'present', period: 'morning' };
      } else if (hours < 10) {
        // 8 AM - 9:59 AM - Late
        return { status: 'late', period: 'morning' };
      } else {
        // After 10 AM - Absent
        return { status: 'absent', period: 'morning' };
      }
    } 
    // Afternoon session (After 12 PM)
    else {
      if (hours < 14) {
        // Before 2 PM - Present
        return { status: 'present', period: 'afternoon' };
      } else if (hours < 15) {
        // 2 PM - 2:59 PM - Late
        return { status: 'late', period: 'afternoon' };
      } else {
        // After 3 PM - Absent
        return { status: 'absent', period: 'afternoon' };
      }
    }
  };

  // Record attendance (wrapper for addAttendance)
  const recordAttendance = async (studentId, status, period) => {
    return await addAttendance(studentId, period || getAttendancePeriod(), status);
  };

  // Add manual absence
  const addManualAbsence = async (studentId, period) => {
    return await addAttendance(studentId, period, 'absent');
  };

  // Remove absence (mark as present)
  const removeAbsence = async (studentId, period) => {
    return await addAttendance(studentId, period, 'present');
  };

  const value = {
    attendanceLog,
    loading,
    addAttendance,
    getTodayStats,
    getLogsByDate,
    loadAttendanceLogs,
    getAttendancePeriod,
    checkAttendanceStatus,
    recordAttendance,
    addManualAbsence,
    removeAbsence,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
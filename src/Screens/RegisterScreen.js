import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  // Check if email is WMSU
  const isWMSUEmail = (email) => {
    return email.toLowerCase().endsWith('@wmsu.edu.ph');
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill all required fields');
      return;
    }

    // WMSU Email Validation - REQUIRED FOR TEACHERS
    if (!isWMSUEmail(form.email)) {
      setError('Only WMSU teachers can register. Please use your @wmsu.edu.ph email address.');
      return;
    }

    if (!form.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!form.agreedToTerms) {
      setError('Please accept terms and conditions');
      return;
    }

    // Start loading
    setLoading(true);

    try {
      const result = await register(form);

      if (result.success) {
        // Show success message with loading
        setTimeout(() => {
          setLoading(false);
          // Navigate to Login screen
          navigation.replace('Login');
        }, 1500); // 1.5 second delay to show success
      } else {
        setLoading(false);
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#8B0000" barStyle="light-content" />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Creating your account...</Text>
        <Text style={styles.loadingSubtext}>Please wait</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#8B0000" barStyle="light-content" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>For WMSU Teachers Only</Text>
        </View>

        <View style={styles.formContainer}>
          {/* WMSU Notice */}
          <View style={styles.noticeCard}>
            <Icon name="shield-account" size={24} color="#8B0000" />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Teachers Only</Text>
              <Text style={styles.noticeText}>
                You must use your WMSU email address (@wmsu.edu.ph) to register as a teacher.
              </Text>
            </View>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={form.firstName}
                onChangeText={(v) => handleChange('firstName', v)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Middle Name (Optional)"
                value={form.middleName}
                onChangeText={(v) => handleChange('middleName', v)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Last Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={form.lastName}
                onChangeText={(v) => handleChange('lastName', v)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email with Validation Indicator */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              WMSU Email Address <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              form.email && !isWMSUEmail(form.email) && styles.inputError
            ]}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="yourname@wmsu.edu.ph"
                value={form.email}
                onChangeText={(v) => handleChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {form.email && (
                <Icon 
                  name={isWMSUEmail(form.email) ? "check-circle" : "close-circle"} 
                  size={20} 
                  color={isWMSUEmail(form.email) ? "#4caf50" : "#f44336"} 
                />
              )}
            </View>
            {form.email && !isWMSUEmail(form.email) && (
              <Text style={styles.errorText}>Must be a @wmsu.edu.ph email</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min. 6 characters)"
                value={form.password}
                onChangeText={(v) => handleChange('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="lock-check" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChangeText={(v) => handleChange('confirmPassword', v)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => handleChange('agreedToTerms', !form.agreedToTerms)}
          >
            <View style={[styles.checkbox, form.agreedToTerms && styles.checkboxChecked]}>
              {form.agreedToTerms && <Icon name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>I agree to terms and conditions</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#f44336" />
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleSubmit}
            >
              <Text style={styles.createButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  
  header: { 
    backgroundColor: '#8B0000', 
    padding: 20,
    paddingTop: 50,
    alignItems: 'center'
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  
  formContainer: { padding: 20 },
  
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000'
  },
  noticeContent: { flex: 1, marginLeft: 12 },
  noticeTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  noticeText: { fontSize: 13, color: '#666' },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  required: { color: '#f44336', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 50
  },
  inputError: { borderColor: '#f44336', borderWidth: 2 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  errorText: { fontSize: 12, color: '#f44336', marginTop: 4, marginLeft: 4 },
  
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: { backgroundColor: '#8B0000' },
  checkboxLabel: { fontSize: 14, color: '#333' },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  errorMessage: { flex: 1, fontSize: 14, color: '#f44336' },
  
  buttonContainer: { gap: 12 },
  createButton: {
    backgroundColor: '#8B0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  loginLinkText: { fontSize: 14, color: '#666' },
  loginLink: { fontSize: 14, color: '#8B0000', fontWeight: 'bold' },
  
  // Loading Screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
});
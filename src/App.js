// App.js (located in src/App.js)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AuthProvider from './context/AuthProvider';
import { AttendanceProvider } from './context/AttendanceContext';

// Import your screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import HomeScreen from './Screens/HomeScreen';
import LogScreen from './Screens/LogScreen';
import GenerateScreen from './Screens/GenerateScreen';
import ScanQRScreen from './Screens/ScanQRScreen';
import ProfileScreen from './Screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B0000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="GenerateTab" 
        component={GenerateScreen}
        options={{
          tabBarLabel: 'Generate',
          tabBarIcon: ({ color, size }) => (
            <Icon name="qrcode" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ScanTab" 
        component={ScanQRScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Icon name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="LogTab" 
        component={LogScreen}
        options={{
          tabBarLabel: 'Logs',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App with Auth Stack
export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AttendanceProvider>
    </AuthProvider>
  );
}
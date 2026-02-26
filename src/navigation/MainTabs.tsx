import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from '../theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({
  label,
  iconName,
  focused,
}: {
  label: string;
  iconName: string;
  focused: boolean;
}) => (
  <View style={styles.tabItem}>
    <Feather
      name={iconName}
      size={22}
      color={focused ? Colors.white : Colors.textDisabled}
    />
    <Text
      style={[styles.tabLabel, focused && styles.tabLabelActive]}
      numberOfLines={1}
      allowFontScaling={false}>
      {label}
    </Text>
  </View>
);

export const MainTabs = () => {
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: Colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={{flex: 1, backgroundColor: Colors.surface}} />
        ),
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" iconName="home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.createTabButton}>
              <Text style={styles.createTabIcon}>+</Text>
            </View>
          ),
        }}
        listeners={({ navigation }: any) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('CreateAd');
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" iconName="user" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const CreatePlaceholder = () => <View />;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 70,
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textDisabled,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  createTabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  createTabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.black,
    marginTop: -2,
  },
});

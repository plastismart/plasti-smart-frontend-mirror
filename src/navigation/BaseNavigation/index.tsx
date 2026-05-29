import { View, TouchableWithoutFeedback } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import useAppSelector from 'hooks/useAppSelector';
import useAppDispatch from 'hooks/useAppDispatch';
import { UserScopes } from 'types/users';
import {
  FrontPage,
  HomePage,
  CameraPage,
  ScanCompletePage,
  EducationPage,
  LeaderboardPage,
  ProgressPage,
  ManualEntryPage,
  UnknownPlasticPage,
  AvatarCustomizationPage,
  SettingsPage,
  MascotPage,
  ProfileSettingsPage,
  PasswordSettingsPage,
  NotificationsSettingsPage,
} from 'screens/BaseScreens';
import { BaseTabRoutes, BaseNavigationList } from '../routeTypes';
import Colors from 'utils/Colors';
import { useEffect, useState } from 'react';
import FormatStyle from 'utils/FormatStyle';
import CameraOptionsModal from './CameraOptionsModal';

// for device ID and notifications
import { getNotificationSettings, updateNotificationSettings, createDefaultNotificationSettings } from 'redux/slices/notificationSlice';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { scheduleAvatarPushNotification, scheduleDailyGoalPushNotification } from 'components/Notifications/pushNotifications';
import { doneTutorial } from 'redux/slices/tutorialSlice';

const BaseTab = createBottomTabNavigator<BaseNavigationList>();
const BaseStack = createStackNavigator<BaseNavigationList>();

const ProtectedRoute = (allowableScopes: UserScopes[]) => {
  const { authenticated, role } = useAppSelector((state) => state.auth);

  return allowableScopes.includes(role) && authenticated;
};
const EmptyComponent = () => null;

export const HomeNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.HOME_SCREEN}>
      <BaseStack.Screen
        name={BaseTabRoutes.HOME_SCREEN}
        component={HomePage}
        options={{ header: () => null }}
      />
      <BaseStack.Screen
        name={BaseTabRoutes.AVATAR_CUSTOMIZATION}
        component={AvatarCustomizationPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

export const FrontNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.FRONT}>
      <BaseStack.Screen
        name={BaseTabRoutes.FRONT}
        component={FrontPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

export const MascotNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.MASCOT}>
      <BaseStack.Screen
        name={BaseTabRoutes.MASCOT}
        component={MascotPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};


const ScanCompleteNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.SCAN_COMPLETE}>
      <BaseStack.Screen
        name={BaseTabRoutes.SCAN_COMPLETE}
        component={ScanCompletePage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const CameraNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.CAMERA}>
      <BaseStack.Screen
        name={BaseTabRoutes.CAMERA}
        component={CameraPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const EducationNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.EDUCATION}>
      <BaseStack.Screen
        name={BaseTabRoutes.EDUCATION}
        component={EducationPage}
        options={{ header: () => null }}
      />
      <BaseStack.Screen
        name={BaseTabRoutes.PROGRESS}
        component={ProgressPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const LeaderboardNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.LEADERBOARD}>
      <BaseStack.Screen
        name={BaseTabRoutes.LEADERBOARD}
        component={LeaderboardPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

export const SettingsNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.SETTINGS}>
      <BaseStack.Screen
        name={BaseTabRoutes.SETTINGS}
        component={SettingsPage}
        options={{ header: () => null }}
      />
      <BaseStack.Screen
        name={BaseTabRoutes.PROFILE_SETTINGS}
        component={ProfileSettingsPage}
        options={{ header: () => null }}
      />
      <BaseStack.Screen
        name={BaseTabRoutes.PASSWORD_SETTINGS}
        component={PasswordSettingsPage}
        options={{ header: () => null }}
      />
      <BaseStack.Screen
        name={BaseTabRoutes.NOTIFICATIONS_SETTINGS}
        component={NotificationsSettingsPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const ManualEntryNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.MANUAL_ENTRY}>
      <BaseStack.Screen
        name={BaseTabRoutes.MANUAL_ENTRY}
        component={ManualEntryPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const UnknownPlasticNavigator = () => {
  return (
    <BaseStack.Navigator initialRouteName={BaseTabRoutes.UNKNOWN_PLASTIC}>
      <BaseStack.Screen
        name={BaseTabRoutes.UNKNOWN_PLASTIC}
        component={UnknownPlasticPage}
        options={{ header: () => null }}
      />
    </BaseStack.Navigator>
  );
};

const BaseNavigation = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const cameraOpen = useAppSelector((state) => state.camera.cameraOpen);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userSelf = useAppSelector((state) => state.users.selectedUser);
  const closeModal = () => {
    setModalVisible(false);
  };
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(doneTutorial());
    dispatch(getNotificationSettings({ userID: userSelf?.id }));
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <BaseTab.Navigator
        screenOptions={{
          header: () => null,
          tabBarStyle: {
            backgroundColor: Colors.secondary.white,
            height: 100,
            borderRadius: 20,

            display: cameraOpen ? 'none' : 'flex',
          },
          tabBarActiveTintColor: Colors.primary.dark,
          tabBarInactiveTintColor: Colors.neutral[2],
        }}
        initialRouteName={user?.avatarSet ? BaseTabRoutes.HOME : BaseTabRoutes.MASCOT}
      >


        <BaseTab.Screen
          name={BaseTabRoutes.HOME}
          component={HomeNavigator}
          options={{
            tabBarLabel: (props) => {
              return (null);
            },
            tabBarIcon: (props) => (
              <Feather name="home" size={40} color={props.color} />
            ),
            headerShown: true,
          }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.EDUCATION}
          component={EducationNavigator}
          options={{
            tabBarLabel: (props) => {
              return (
                null
              );
            },
            tabBarIcon: (props) => (
              <Feather name="book-open" size={40} color={props.color} />),
          }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.CAMERA_MODAL}
          component={EmptyComponent}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: (props) => (
              <View style={{ ...FormatStyle.circle, width: 70, height: 70, backgroundColor: Colors.primary.dark, position: 'relative', bottom: 20 }}>
                <AntDesign name="camera" color={Colors.secondary.white} size={40} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setModalVisible(currentVisible => !currentVisible);
            },
          }}
        />

        <BaseTab.Screen
          name={BaseTabRoutes.LEADERBOARD}
          component={LeaderboardNavigator}
          options={{
            tabBarLabel: (props) => {
              return (
                null);
            },
            tabBarIcon: (props) => (
              <Feather name="bar-chart-2" size={40} color={props.color} />
            ),
          }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.SETTINGS}
          component={SettingsNavigator}
          options={{
            tabBarLabel: (props) => {
              return (
                null);
            },
            tabBarIcon: (props) => (
              <Feather name="settings" size={40} color={props.color} />
            ),
          }}
        />
        
        <BaseTab.Screen
          name={BaseTabRoutes.SCAN_COMPLETE}
          component={ScanCompleteNavigator}
          options={{ tabBarButton: () => null }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.UNKNOWN_PLASTIC}
          component={UnknownPlasticNavigator}
          options={{ tabBarButton: () => null }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.MANUAL_ENTRY}
          component={ManualEntryNavigator}
          options={{ tabBarButton: () => null }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.CAMERA}
          component={CameraNavigator}
          options={{ tabBarButton: () => null }}
        />
        <BaseTab.Screen
          name={BaseTabRoutes.MASCOT}
          component={MascotNavigator}
          options={{ tabBarButton: () => null }}
        />

      </BaseTab.Navigator>
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents={isModalVisible ? 'auto' : 'none'}>
          <CameraOptionsModal isVisible={isModalVisible} onClose={closeModal} navigation={navigation}/>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default BaseNavigation;

// import { NavigatorScreenParams } from '@react-navigation/native';
// Use NavigatorScreenParams to nest navigators within navigators

export enum AuthStackRoutes {
  LAUNCH = 'Launch',
  SIGNIN = 'Sign In',
  SIGNUP = 'Sign Up',
  ONBOARD = 'Onboard',
}

export type AuthNavigationList = {
  [AuthStackRoutes.ONBOARD]: Record<string, unknown>;
  [AuthStackRoutes.LAUNCH]: Record<string, unknown>;
  [AuthStackRoutes.SIGNIN]: Record<string, unknown>;
  [AuthStackRoutes.SIGNUP]: Record<string, unknown>;
};

export enum BaseTabRoutes {
  FRONT = 'FrontPage',
  USERS = 'Users',
  FORBIDDEN = 'Forbidden',
  CAMERA = 'Camera',
  SCAN_COMPLETE = 'ScanComplete',
  HOME = 'Home',
  HOME_SCREEN = 'HomeScreen',
  AVATAR_CUSTOMIZATION = 'AvatarCustomization',
  LEADERBOARD = 'Leaderboard',
  EDUCATION = 'Education',
  PROGRESS = 'Progress',
  MANUAL_ENTRY = 'ManualEntry',
  UNKNOWN_PLASTIC = 'UnknownPlastic',
  CAMERA_MODAL = 'CameraModal',
  SETTINGS = 'Settings',
  MASCOT = 'Mascot',
  PROFILE_SETTINGS = 'ProfileSettings',
  PASSWORD_SETTINGS  = 'PasswordSettings',
  NOTIFICATIONS_SETTINGS = 'NotificationsSettings',
}

export type BaseNavigationList = {
  [BaseTabRoutes.FRONT]: Record<string, unknown>;
  [BaseTabRoutes.USERS]: Record<string, unknown>;
  [BaseTabRoutes.FORBIDDEN]: Record<string, unknown>;
  [BaseTabRoutes.CAMERA]: Record<string, unknown>;
  [BaseTabRoutes.SCAN_COMPLETE]: Record<string, unknown>;
  [BaseTabRoutes.HOME]: Record<string, unknown>;
  [BaseTabRoutes.HOME_SCREEN]: Record<string, unknown>;
  [BaseTabRoutes.AVATAR_CUSTOMIZATION]: Record<string, unknown>;
  [BaseTabRoutes.LEADERBOARD]: Record<string, unknown>;
  [BaseTabRoutes.EDUCATION]: Record<string, unknown>;
  [BaseTabRoutes.PROGRESS]: Record<string, unknown>;
  [BaseTabRoutes.MANUAL_ENTRY]: Record<string, unknown>;
  [BaseTabRoutes.UNKNOWN_PLASTIC]: Record<string, unknown>;
  [BaseTabRoutes.CAMERA_MODAL]: Record<string, unknown>;
  [BaseTabRoutes.SETTINGS]: Record<string, unknown>;
  [BaseTabRoutes.MASCOT]: Record<string, unknown>;
  [BaseTabRoutes.PROFILE_SETTINGS]: Record<string, unknown>;
  [BaseTabRoutes.PASSWORD_SETTINGS]: Record<string, unknown>;
  [BaseTabRoutes.NOTIFICATIONS_SETTINGS]: Record<string, unknown>;
};
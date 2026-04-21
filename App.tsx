import React from 'react';
import { View, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import RootNavigation from './src/navigation';
import { useFonts, Raleway_400Regular, Raleway_600SemiBold, Raleway_800ExtraBold } from '@expo-google-fonts/raleway';
import { Inter_400Regular, Inter_700Bold, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { LogBox } from 'react-native';
// rn-tourguide is not compatible with New Architecture (Expo Go v53+)
// TourGuideProvider is stubbed out until the library is updated

LogBox.ignoreAllLogs(true);

export default function App() {
  const [fontsLoaded] = useFonts({
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_800ExtraBold,
    Inter_400Regular,
    Inter_700Bold,
    Inter_500Medium,
    Inter_600SemiBold,
  });


  if (!fontsLoaded) {
    return <View />;
  }


  return (
    <Provider store={store}>
      <StatusBar barStyle = 'dark-content' />
      <RootNavigation />
    </Provider>
  );
}
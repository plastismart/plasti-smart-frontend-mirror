/* eslint-disable max-len */
import React, { useRef, useEffect } from 'react';
import { SafeAreaView, Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import useAppSelector from 'hooks/useAppSelector';
import useAppDispatch from 'hooks/useAppDispatch';
import FormatStyle from '../../../utils/FormatStyle';
import CircleBG from '../../../assets/Ellipse 66.svg';

import Heart from '../../../assets/Heart.svg';
import EmptyHeart from '../../../assets/EmptyHeart.svg';
import HomeAvaShadow from '../../../assets/HomeAvaShadow.svg';
import Wardrobe from '../../../assets/Wardrobe.svg';
import Lamp from '../../../assets/Lamp.svg';
import HomeNewTrophy from '../../../assets/HomeNewTrophy.svg';
import Bowl from '../../../assets/Bowl.svg';
import HomePointBadge from '../../../assets/HomePointBadge.svg';
import HomeShelf from '../../../assets/HomeShelf.svg';
import HomeBook from '../../../assets/HomeBook.svg';
import HomeFullBowl from '../../../assets/HomeFullBowl.svg';


import Calendar from 'components/Calendar';
import Colors from 'utils/Colors';
import DailyTasks from 'components/DailyTasks';

// rn-tourguide is not compatible with New Architecture — stubbed out
const TourGuideZone = ({ children }: { children: React.ReactNode; [key: string]: unknown }) => <>{children}</>;
const TourGuideZoneByPosition = (_props: unknown) => null;
const useTourGuideController = () => ({ canStart: false, start: () => {}, stop: () => {}, eventEmitter: null });

import { feedAvatar } from '../../../redux/slices/usersSlice'; // import the action
import { Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { StackNavigationProp } from '@react-navigation/stack';
import { BaseTabRoutes, BaseNavigationList } from 'navigation/routeTypes';
import { useFocusEffect } from '@react-navigation/native';


import { doneTutorial } from 'redux/slices/tutorialSlice';
import FullAlertModal from './fullAlertModal';
import { cameraClosed } from 'redux/slices/cameraSlice';
import Avatar from 'components/Avatar';

// for device ID and notifications
import { getNotificationSettings, updateNotificationSettings, createDefaultNotificationSettings } from 'redux/slices/notificationSlice';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { scheduleAvatarPushNotification, scheduleDailyGoalPushNotification } from 'components/Notifications/pushNotifications';

type HomePageProps = {
  navigation: StackNavigationProp<BaseNavigationList>;
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const HomePage = ({ navigation }: HomePageProps) => {
  const user = useAppSelector((state) => state.users.selectedUser);
  const currentLoginHist = useAppSelector((state) => state.loginhistory.history);
  const needTutorial = useAppSelector((state) => state.tutorial.needTutorial);
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.settings);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalMessage, setModalMessage] = React.useState('');

  if (user === null) {
    return <Text>Loading...</Text>;
  }

  // for defaulting to top of the page
  const scrollViewRef = useRef<ScrollView>(null);
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      dispatch(cameraClosed());
    }, []),
  );
  
  //////////////// snacks ////////////////
  interface SnackProps {
    points: number
    uid: string
    uhealth: number
  }
  const handleSnackPress = ({ points, uid, uhealth }: SnackProps) => {
    if (points >= 5 && uhealth < 5) {
      dispatch(feedAvatar({ id: uid }));
    } else if (points < 5) {
      setModalMessage('You need at least 5 points to feed your pal!');
      setModalVisible(true);
    } else if (uhealth == 5) {
      setModalMessage('Your pal is full! Come back later when it’s hungry again.');
      setModalVisible(true);
    }
  };

  //////////////// daily tasks ////////////////
  const today = new Date();

  let todayTasksCompletion = [false, false, false];
  if (currentLoginHist.length > 0) {
    const firstHist = new Date(currentLoginHist[0].date);
    if (today.toDateString() === firstHist.toDateString()) {
      todayTasksCompletion = [currentLoginHist[0].redGoal, currentLoginHist[0].yellowGoal, currentLoginHist[0].greenGoal];
    }
  }

  const taskCompletionStatuses = [];
  for (let i = 10; i > 0; i--) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - i);
  
    const loginHistoryForDay = currentLoginHist.find(history => {
      const historyDate = new Date(history.date);
      return historyDate.toDateString() === day.toDateString();
    });
  
    if (loginHistoryForDay) {
      taskCompletionStatuses.push([+loginHistoryForDay.redGoal, +loginHistoryForDay.yellowGoal, +loginHistoryForDay.greenGoal]);    
    } else {
      taskCompletionStatuses.push([]);
    }
  }
  // for today
  taskCompletionStatuses.push([+todayTasksCompletion[0], +todayTasksCompletion[1], +todayTasksCompletion[2]]);  
  // next 3 days are empty
  for (let j = 0; j < 3; j++) {
    taskCompletionStatuses.push([]);
  }

  //////////////// trophy text styles ////////////////
  function getPointsStyle(points: number) {
    if (points < 100) {
      return styles.smallPoints;
    } else if (points < 1000) {
      return styles.mediumPoints;
    } else {
      return styles.largePoints;
    }
  }

  const getTrophyTextStyle = (number: number) => {
    if (number >= 80) {
      return styles.trophyTextSmall;
    } else if (number >= 10) {
      return styles.trophyTextMedium;
    } else {
      return styles.trophyTextLarge;
    }
  };
  
  const rankNum = user?.rank;
  const displayNumber = rankNum > 80 ? '80+' : rankNum;

  /////////////////// tutorial //////////////////////
  const {   // Use Hooks to control!
    canStart, // a boolean indicate if you can start tour guide
    start, // a function to start the tourguide
  } = useTourGuideController();

  // Can start at mount if needTutorial is true
  React.useEffect(() => {
    //if (needTutorial && canStart) {
    start();
    dispatch(doneTutorial());
    // }
  }, [needTutorial]); 

  useEffect(() => {
    const fetchAndSetNotificationReady = async () => {
    // check if deviceID is new
      if (user?.id) {
        let deviceID = await SecureStore.getItemAsync('secure_deviceid');
        // if this is a new device:
        if (notifications && notifications.deviceID != deviceID) {
          // get new device id
          try {
            const uuid = uuidv4();
            await SecureStore.setItemAsync('secure_deviceid', uuid);
            deviceID = await SecureStore.getItemAsync('secure_deviceid');
            // update deviceID
            if (deviceID) dispatch(updateNotificationSettings({ userID: user?.id, deviceID: deviceID }));
          } catch (error) {
            console.error('Error generating UUID:', error);
          }
          // cancel all previous notifications 
          // (note: not redundant calls cuz we are cancelling potentially on previous device)
          await Notifications.cancelAllScheduledNotificationsAsync();
          Notifications.cancelScheduledNotificationAsync(notifications.dailyGoalIdentifier);
          Notifications.cancelScheduledNotificationAsync(notifications.avatarIdentifier);
          // set up notifications
          if (notifications.generalPush) {
            if (notifications.avatarPush) {
              scheduleAvatarPushNotification(8, 0)
                .then(identifier => {
                  dispatch(updateNotificationSettings({ userID: user?.id, avatarIdentifier: identifier }));
                })
                .catch(error => {
                  console.error(error);
                });
            }
            if (notifications.dailyGoalPush) {
              scheduleDailyGoalPushNotification(16, 0)
                .then(identifier => {
                  dispatch(updateNotificationSettings({ userID: user?.id, dailyGoalIdentifier: identifier }));
                })
                .catch(error => {
                  console.error(error);
                });
            }
          }
        }
      }
    };
    fetchAndSetNotificationReady();
  }, [notifications]);


  return (
    <SafeAreaView style={{ ...FormatStyle.container, justifyContent: 'flex-start' }}>
      <View style={{
        width: '100%',
        overflow: 'hidden',

        alignItems: 'center',
        position: 'absolute',
        top: screenHeight * 0.45,
      }}>
        <CircleBG width={screenWidth * 6} height={screenHeight * 1.1}></CircleBG>
      </View>

      
      <ScrollView ref={scrollViewRef} style={{
        flex: 1,
        width: '100%',
        marginTop: screenHeight * 0.018,
        marginLeft:screenHeight * 0.018,
        marginRight:screenHeight * 0.018,
      }}>
        <View style={{ position: 'absolute', top: screenHeight * 0.78, right:screenWidth * 0.001 }}>
          <HomePointBadge style={{ position: 'absolute', bottom: screenHeight * 0.55, right: screenWidth * 0.63 }} width={screenWidth * 0.32} height ={screenHeight * 0.32}></HomePointBadge>

          <View style={styles.badgeContainer}>
            <Text style={getPointsStyle(user?.points)}>{user?.points} </Text>
            <Text style={styles.badgeText}>POINTS</Text>
          </View>
          <TourGuideZone
            zone={2}
            keepTooltipPosition
            shape='rectangle'
            text={'A react-native-copilot remastered! 🎉'}
            borderRadius={16}
          >
            <HomeShelf style={{ position: 'absolute', bottom: screenHeight * 0.37, right: -screenWidth * 0.14 }} width={screenWidth * 0.65} height ={screenHeight * 0.65}></HomeShelf>
          </TourGuideZone>
          <TouchableOpacity style={{ backgroundColor:'blue', position: 'absolute', bottom: screenHeight * 0.32, right: -screenWidth * 0.15, maxHeight: screenWidth * 0.45 }} onPress={() => navigation.navigate(BaseTabRoutes.AVATAR_CUSTOMIZATION, {})}>
            <Wardrobe style={{ position: 'absolute', bottom: 1, right: 3, maxHeight: screenWidth * 0.45 }} width={screenWidth * 0.65} height ={screenHeight * 0.65}></Wardrobe>
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'absolute', bottom: screenHeight * 0.545, right: -screenWidth * 0.04 }} onPress={() => navigation.navigate(BaseTabRoutes.EDUCATION, {})}>
            <HomeBook width={screenWidth * 0.25} height ={screenHeight * 0.3}></HomeBook>
          </TouchableOpacity>
          <Lamp style={{ position: 'absolute', bottom: screenHeight * 0.435, right: screenWidth * 0.22 }} width={screenWidth * 0.28} height ={screenHeight * 0.28}></Lamp>
          <TouchableOpacity style={{ position: 'absolute', bottom: screenHeight * 0.464, right: screenWidth * 0.017 }} onPress={() => navigation.navigate(BaseTabRoutes.LEADERBOARD, {})}>
            <HomeNewTrophy width={screenWidth * 0.17} height ={screenHeight * 0.17}></HomeNewTrophy>
            <Text style={getTrophyTextStyle(rankNum)}>{displayNumber}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ position: 'absolute', top: screenHeight * 0.25, left:screenWidth * 0.02 }}>
          <HomeAvaShadow style={{ position: 'absolute', top: screenHeight * 0.09, right: screenWidth * 0.06 }} width={screenWidth * 0.5} height ={screenHeight * 0.45}></HomeAvaShadow>
          <Avatar avatarID={user.avatarID} color={user.avatarColor} size={screenWidth * 0.47} accessory={user.avatarAccessoryEquipped} shadow={false} style={{ top: screenHeight * 0.12 }} mirror={user.avatarID >= 2}></Avatar>
          <TouchableOpacity style={{ position: 'absolute', top: screenHeight * 0.17, right: -screenWidth * 0.19 }} onPress={() => handleSnackPress({ points: user.points, uid: user.id, uhealth: user.avatarHealth })}>
            {user.points > 5 ? <HomeFullBowl width={screenWidth * 0.25} height ={screenHeight * 0.28} />  : <Bowl width={screenWidth * 0.33} height ={screenHeight * 0.33} />}
          </TouchableOpacity>
        </View>


        <View style={{ marginLeft: 20 }}>
          <HappyScale happiness={user?.avatarHealth} ></HappyScale>
        </View>

        <View style={{ ...styles.scroll, marginLeft: 20, marginTop:screenHeight * 0.58 }}>
          <Calendar circlesArray={taskCompletionStatuses}></Calendar>
          <DailyTasks taskCompletionStatuses={todayTasksCompletion}></DailyTasks>
        </View>
        <TourGuideZoneByPosition
          zone={1}
          shape={'rectangle'}
          isTourGuide
          text={'This shelf leads to your Learning Page! Learn about plastics polymers and check your recycling progress here!'}
          top={screenHeight * 0.03}
          left={screenWidth * 0.5}
          width={screenWidth * 0.46}
          height={screenHeight * 0.21}
        />
        <TourGuideZoneByPosition
          zone={2}
          shape={'rectangle'}
          text={'Is your pal hungry? Level your pal up by tapping on their bowl to feed them.'}
          isTourGuide
          top={screenHeight * 0.37}
          left={screenWidth * 0.04}
          width={screenWidth * 0.62}
          height={screenHeight * 0.25}
        />
        <TourGuideZoneByPosition
          zone={3}
          shape={'rectangle'}
          isTourGuide
          text = {'Gain points from learning, reusing, and recycling.'}
          top={screenHeight * 0.03}
          left={screenWidth * 0.07}
          width={screenWidth * 0.3}
          height={screenHeight * 0.08}
        />
        <TourGuideZoneByPosition
          zone={4}
          shape={'rectangle'}
          isTourGuide
          text={'And spruce up your pal’s wardrobe and style with your points!'}
          top={screenHeight * 0.23}
          left={screenWidth * 0.5}
          width={screenWidth * 0.48}
          height={screenHeight * 0.24}
        />
      </ScrollView>
      <FullAlertModal modalVisible={modalVisible} setModalVisible={setModalVisible} modalMessage={modalMessage} />
    </SafeAreaView>
  );
};

interface HappyProps {
  happiness: number

}

const HappyScale = ({ happiness }: HappyProps) => {
  if (typeof happiness !== 'number') {
    // throw new Error('Invalid happiness value');
    happiness = 3;
  }
  // hardcode for bug right now...
  if (happiness >= 5 ) happiness = 5;
  if (happiness <= 0 ) happiness = 0;
  const empty = Math.max(0, 5 - happiness);
  return (
    <View>
      <View style={{ width: screenWidth * 0.38, height: screenHeight * 0.03, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {Array(Math.min(5, happiness)).fill(1).map((_, i) => (
          <Heart key={i} width={28} height={28}></Heart>
        ))}
        {Array(empty).fill(1).map((_, i) => (
          <EmptyHeart key={i} width={28} height={28}></EmptyHeart>
        ))}
      </View>
    </View>
  );
};

interface PlaceProps {
  number: number
}

const Place = ({ number }: PlaceProps) => {
  let suffix;
  if (number % 10 == 1) suffix = 'st';
  else if (number % 10 == 2) suffix = 'nd';
  else if (number % 10 == 3) suffix = 'rd';
  else suffix = 'th';

  return (
    <View style={{ ...FormatStyle.circle, marginTop: 0, backgroundColor: Colors.primary.dark, width: 70, height: 70, gap: -5 }}>
      <Text style={{ color: Colors.secondary.light, fontSize: 30 }}>{number}{suffix}</Text>
      <Text style={{ color: Colors.secondary.light, fontSize: 12 }}>place</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    position: 'absolute', 
    bottom: screenHeight * 0.695, 
    right: screenWidth * 0.645,
  },
  badgeText: {
    fontSize: screenHeight * 0.014,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.1,
    color: Colors.primary.dark,
  },
  smallPoints: {
    fontSize: screenHeight * 0.014,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.1,
    color: Colors.primary.dark,
  },
  mediumPoints: {
    fontSize: screenHeight * 0.013,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.03,
    color: Colors.primary.dark,
  },
  largePoints: {
    fontSize: screenHeight * 0.012,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.01,
    color: Colors.primary.dark,
  },
  trophyTextLarge : {
    position: 'absolute',
    bottom: screenHeight * 0.08,
    right: screenWidth * 0.068,
    color: '#C6961C',
    textAlign: 'right',
    fontSize: screenHeight * 0.022,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  trophyTextMedium : {
    position: 'absolute',
    bottom: screenHeight * 0.08,
    right: screenWidth * 0.058,
    color: '#C6961C',
    textAlign: 'right',
    fontSize: screenHeight * 0.020,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  trophyTextSmall : {
    position: 'absolute',
    bottom: screenHeight * 0.08,
    right: screenWidth * 0.054,
    color: '#C6961C',
    textAlign: 'right',
    fontSize: screenHeight * 0.013,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});


export default HomePage;



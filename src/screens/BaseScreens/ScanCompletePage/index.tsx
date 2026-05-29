import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';

import { BaseTabRoutes, BaseNavigationList } from 'navigation/routeTypes';
import type { StackNavigationProp } from '@react-navigation/stack';

import useAppSelector from '../../../hooks/useAppSelector';

import CircleBG from '../../../assets/Ellipse 66.svg';
import Confetti from '../../../assets/confetti.svg';
import Avatar from 'components/Avatar';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import useAppDispatch from 'hooks/useAppDispatch';
import { cameraClosed } from 'redux/slices/cameraSlice';
const screenWidth = Dimensions.get('window').width;

type ScanCompletePageProps = {
  navigation: StackNavigationProp<BaseNavigationList>;
};

const ScanCompletePage = ({ navigation }: ScanCompletePageProps) => {
  const user = useAppSelector((state) => state.users.selectedUser);
  const recycled = useAppSelector((state) => state.scan.recycled);

  const dispatch = useAppDispatch();

  useFocusEffect(
    React.useCallback(() => {
      dispatch(cameraClosed());
      return () => {};
    }, [dispatch]),
  );

  return (
    <View style={styles.container}>

      <View style={{
        width: 400,
        overflow: 'hidden',
        aspectRatio: 1,

        alignItems: 'center',
        position: 'absolute',
        top: '4%',

      }}>
        <Confetti />
      </View>

      <View style={{
        width: '100%',
        overflow: 'hidden',
        aspectRatio: 1,

        alignItems: 'center',
        position: 'absolute',
        bottom: '-10%',

      }}>
        <CircleBG></CircleBG>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.congratsText}>
          {'Congratulations! You\'ve just earned '}
          <Text style={styles.boldText}>
            {recycled ? '10' : '20'}
          </Text>
          {recycled ? ' points for recycling' : ' points for reusing'}
        </Text>
      </View>
      <View style={styles.svgContainer}>
        <Avatar size={screenWidth*0.4} avatarID={user.avatarID} color={user.avatarColor} accessory={user.avatarAccessoryEquipped} shadow={true} />
      </View>
      <View style={styles.selectButtonContainer}>
        <TouchableOpacity
          style={[styles.bottomSheetSelectButton, { borderColor: '#1B453C', borderWidth: 1, backgroundColor: 'transparent', marginRight: 14 }]}
          onPress={() => {
            navigation.navigate(BaseTabRoutes.EDUCATION, {});
          }}
        >
          <Text style={[styles.bottomSheetSelectButtonText, { color: '#1B453C' }]}>LEARN MORE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomSheetSelectButton, { backgroundColor: '#1B453C' }]}
          onPress={() => {
            navigation.navigate(BaseTabRoutes.HOME, {});
          }}
        >
          <Text style={styles.bottomSheetSelectButtonText}>RETURN HOME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFBF4',
    flexDirection: 'column',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft:20,
    marginRight:20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  congratsText: {
    fontSize: 32,
    fontWeight: 'normal',
    marginBottom: 20,
    marginLeft:4,
    marginRight:4,
    textAlign: 'center',
  },
  middleContainer: {
    marginTop: 20,
  },
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:20,
  },
  selectButton: {
    justifyContent: 'center',
    width: 200,
    height: 60,
    backgroundColor: '#1B453C',
    borderRadius: 10,
    borderWidth: 1,
  },
  bottomSheetSelectButton: {
    justifyContent: 'center',
    width: 180,
    height: 46,
    backgroundColor: '#1B453C',
    borderRadius: 10,
    borderWidth: 1,
  },
  bottomSheetSelectButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
});

export default ScanCompletePage;

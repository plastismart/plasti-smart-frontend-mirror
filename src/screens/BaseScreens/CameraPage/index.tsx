/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FormatStyle from '../../../utils/FormatStyle';
import { Ionicons } from '@expo/vector-icons';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from 'hooks/useAppDispatch';
import { cameraOpened } from 'redux/slices/cameraSlice';
import { reusedRedux, recycledRedux } from 'redux/slices/scanSlice';
import { createScan } from 'redux/slices/usersSlice';
import { BaseTabRoutes, BaseNavigationList } from 'navigation/routeTypes';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import { PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { SERVER_URL } from '../../../utils/constants.js';
import { getBearerToken } from '../../../utils/asyncStorage';
import * as ImageManipulator from 'expo-image-manipulator';

// components
import RBSheet from 'react-native-raw-bottom-sheet';
import ReuseWarningModal from '../UnknownPlasticPage/reuseWarningModal';
import PlasticSymbol from '../../../assets/PlasticSymbol.svg';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const plasticTypes = {
  1: 'Polyethylene Terephthalate',
  2: 'High-Density Polyethylene',
  3: 'Polyvinyl Chloride',
  4: 'Low-Density Polyethylene',
  5: 'Polypropylene',
  6: 'Polystyrene',
  7: 'Miscellaneous/Other',
  8: 'Unknown',
};

type CameraPageProps = {
  navigation: StackNavigationProp<BaseNavigationList>;
};

const CameraPage = ({ navigation }: CameraPageProps) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [modelVerdict, setModelVerdict] = useState<number>(0);

  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.users.selectedUser);

  const [zoom, setZoom] = useState(0);
  const [reuseModalVisible, setReuseModalVisible] = React.useState(false);

  const bottomSheetRef = useRef(null);
  // holds base64 image until user confirms recycle/reuse so it can be uploaded via createScan
  const lastCapturedBase64 = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCapturedPhoto(undefined);
      setZoom(0);
      dispatch(cameraOpened());
    }, [navigation]),
  );

  function toggleCameraType() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ skipMetadata: true });

      if (!photo.uri) {
        alert('Failed to capture photo. Please try again.');
        return;
      }

      const imageWidth = photo.width;
      const imageHeight = photo.height;

      const cropRect = {
        originX: imageWidth * 0.175,
        originY: imageHeight * 0.3,
        width: imageWidth * 0.675,
        height: imageHeight * 0.3,
      };

      const croppedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: cropRect }],
        { base64: true },
      );
      const base64 = croppedPhoto.base64!;
      setCapturedPhoto(base64);
      lastCapturedBase64.current = base64;

      const token = await getBearerToken();
      const response = await fetch(`${SERVER_URL}scan/identify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const topCandidate = data.candidates?.[0];
      setModelVerdict(topCandidate?.plasticNumber ?? 0);
      bottomSheetRef.current?.open();
      setCapturedPhoto(undefined);
    } catch (error) {
      console.error('Error identifying plastic:', error);
      setCapturedPhoto(undefined);
      alert('Failed to identify plastic. Please try again.');
    }
  };

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    const { scale } = event.nativeEvent;
    const newZoom = Math.min(Math.max(0, scale / 80), 1);
    setZoom(newZoom);
  };

  /**************** Nav functions ****************/
  const handleReusePress = () => {
    if (modelVerdict == 1 || modelVerdict == 3 || modelVerdict >= 6) {
      setReuseModalVisible(true);
    } else if (modelVerdict && user) {
      dispatch(createScan({ scannedBy: user.id, plasticNumber: modelVerdict, image: lastCapturedBase64.current, reused: true, recycled: false }));
      dispatch(reusedRedux());
      lastCapturedBase64.current = null;
      bottomSheetRef.current?.close();
      navigation.navigate(BaseTabRoutes.SCAN_COMPLETE, {});
    }
  };

  const selectButtonPressed = () => {
    if (modelVerdict && user) {
      dispatch(recycledRedux());
      dispatch(createScan({ scannedBy: user.id, plasticNumber: modelVerdict, image: lastCapturedBase64.current, reused: false, recycled: true }));
    }
    lastCapturedBase64.current = null;
    setCapturedPhoto(undefined);
    bottomSheetRef.current?.close();
    navigation.navigate(BaseTabRoutes.SCAN_COMPLETE, {});
  };

  const goToFrontPage = () => {
    setCapturedPhoto(undefined);
    lastCapturedBase64.current = null;
    navigation.navigate(BaseTabRoutes.HOME, {});
  };
  /**************** Done Nav functions ****************/

  if (!permission) {
    return (
      <View style={FormatStyle.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={FormatStyle.container}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PinchGestureHandler onGestureEvent={onPinchGestureEvent}>
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash="auto" zoom={zoom} onCameraReady={() => setIsCameraReady(true)} />
          <View style={styles.overlay}>
            <View style={styles.topContainer}>
              <View style={styles.backButtonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={goToFrontPage}>
                  <Ionicons name="arrow-back-outline" size={36} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {capturedPhoto && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.processingText}>Recognizing...</Text>
              </View>
            )}

            <View style={styles.bottomContainer}>
              <View style={styles.flipButtonContainer}>
                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
                  <Ionicons name="camera-reverse-outline" size={36} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
              </View>
            </View>
          </View>
        </View>
      </PinchGestureHandler>

      <RBSheet
        ref={bottomSheetRef}
        height={screenHeight * 0.4}
        openDuration={250}
        closeDuration={200}
        closeOnDragDown={!(modelVerdict >= 1 && modelVerdict <= 7)}
        closeOnPressMask={!(modelVerdict >= 1 && modelVerdict <= 7)}
        dragFromTopOnly={!(modelVerdict >= 1 && modelVerdict <= 7)}
        customStyles={{
          wrapper: { backgroundColor: 'transparent' },
          container: {
            backgroundColor: '#FBFBF4',
            justifyContent: 'space-evenly',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            alignItems: 'center',
            paddingBottom: screenHeight * 0.05,
          },
          draggableIcon: {
            backgroundColor: '#000',
            bottom: screenHeight * 0.03,
          },
        }}
      >
        {modelVerdict >= 1 && modelVerdict <= 7 ? (
          <>
            <View style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 20, marginTop: 12 }}>
              <View style={{ justifyContent: 'center', alignItems: 'center', width: '50%', maxHeight: '40%', marginBottom: 8, marginTop: 20 }}>
                <PlasticSymbol right={'4.5%'} />
                <Text style={styles.bottomSheetTitle}>{modelVerdict}</Text>
              </View>
              <Text style={{ fontSize: 16, color: '#1B453C', marginBottom: 20 }}>
                {plasticTypes[modelVerdict as keyof typeof plasticTypes]}
              </Text>
              <TouchableOpacity
                style={[styles.bottomSheetSelectButton, { backgroundColor: '#1B453C', marginBottom: 14 }]}
                onPress={handleReusePress}
              >
                <Text style={styles.bottomSheetSelectButtonText}>I'M REUSING</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bottomSheetSelectButton, { borderColor: '#1B453C', borderWidth: 1, backgroundColor: 'transparent' }]}
                onPress={selectButtonPressed}
              >
                <Text style={[styles.bottomSheetSelectButtonText, { color: '#1B453C' }]}>I'M RECYCLING</Text>
              </TouchableOpacity>
            </View>
            <ReuseWarningModal
              navigation={navigation}
              modalVisible={reuseModalVisible}
              setModalVisible={setReuseModalVisible}
              plasticType={modelVerdict}
            />
          </>
        ) : (
          <>
            <View style={{ justifyContent: 'center', alignItems: 'center', width: '95%', maxHeight: '40%' }}>
              <Text style={styles.bottomSheetTitle}>Unknown Plastic Type</Text>
            </View>
            <View style={{ justifyContent: 'center', width: '90%', marginTop: screenHeight * 0.01 }}>
              <Text style={{ fontSize: screenHeight * 0.02, color: '#1B453C', textAlign: 'center' }}>
                We are unable to identify the type of plastic. Please try scanning again or manually enter.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.bottomSheetSelectButton, { backgroundColor: '#1B453C', marginBottom: screenHeight * 0.01, marginTop: screenHeight * 0.01 }]}
              onPress={() => {
                bottomSheetRef.current?.close();
                setCapturedPhoto(undefined);
                lastCapturedBase64.current = null;
                setModelVerdict(0);
              }}
            >
              <Text style={styles.bottomSheetSelectButtonText}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomSheetSelectButton, { borderColor: '#1B453C', borderWidth: 1, backgroundColor: 'transparent' }]}
              onPress={() => {
                bottomSheetRef.current?.close();
                setCapturedPhoto(undefined);
                lastCapturedBase64.current = null;
                setModelVerdict(0);
                navigation.navigate(BaseTabRoutes.MANUAL_ENTRY, {});
              }}
            >
              <Text style={[styles.bottomSheetSelectButtonText, { color: '#1B453C' }]}>Manually Enter</Text>
            </TouchableOpacity>
          </>
        )}
      </RBSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FBFBF4',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topContainer: {
    flexDirection: 'row',
    height: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  backButtonContainer: {
    position: 'absolute',
    left: '3%',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    backgroundColor: 'transparent',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonContainer: {
    position: 'absolute',
    right: '8%',
  },
  flipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
  },
  captureButtonContainer: {
    position: 'absolute',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetSelectButton: {
    justifyContent: 'center',
    width: screenWidth * 0.45,
    height: screenHeight * 0.05,
    backgroundColor: '#1B453C',
    borderRadius: 10,
    borderWidth: 1,
  },
  bottomSheetSelectButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: screenHeight * 0.0175,
    fontStyle: 'normal',
    fontWeight: '600',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  bottomSheetTitle: {
    fontSize: screenHeight * 0.04,
    color: '#1B453C',
    fontWeight: 'bold',
    position: 'absolute',
  },
});

export default CameraPage;

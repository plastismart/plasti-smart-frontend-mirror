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
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FormatStyle from '../../../utils/FormatStyle';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import useAppSelector from '../../../hooks/useAppSelector';
import useAppDispatch from 'hooks/useAppDispatch';
import { cameraOpened } from 'redux/slices/cameraSlice';
import { reusedRedux, recycledRedux } from 'redux/slices/scanSlice';
import { createScan } from 'redux/slices/usersSlice';
import { BaseTabRoutes, BaseNavigationList } from 'navigation/routeTypes';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import { PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { REPLICATE_URL, REPLICATE_VERSION, REPLICATE_API_TOKEN } from '../../../utils/constants';
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

// line animation source: https://medium.com/@vivekjoy/creating-a-barcode-scanner-using-expo-barcode-scanner-in-a-react-native-cli-project-2d36a235ab41

type CameraPageProps = {
  navigation: StackNavigationProp<BaseNavigationList>;
};

const CameraPage = ({ navigation }: CameraPageProps) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [animationLineHeight, setAnimationLineHeight] = useState<number>(0);
  const [focusLineAnimation, setFocusLineAnimation] = useState<Animated.Value>(
    new Animated.Value(0),
  );

  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [modelRunning, setModelRunning] = useState<boolean>(false);
  const [modelVerdict, setModelVerdict] = useState<number>(0);
  const [predictionID, setPredictionID] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dispatch = useAppDispatch();
  
  const user = useAppSelector((state) => state.users.selectedUser);

  const [isAnimating, setIsAnimating] = useState(true);
  const [zoom, setZoom] = useState(0);
  const [reuseModalVisible, setReuseModalVisible] = React.useState(false);


  // bottom sheet
  const bottomSheetRef = useRef(null);
  
  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsAnimating(true);
      setCapturedPhoto(undefined);
      setZoom(0);
      setIsCameraReady(false);
      dispatch(cameraOpened());
  
      let animation: Animated.CompositeAnimation | undefined;
      if (isAnimating) {
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(focusLineAnimation, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(focusLineAnimation, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        );
    
        animation.start();
      }
    
      return () => animation && animation.stop();
    }, [ isAnimating, navigation]),
  );

  function toggleCameraType() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const pollStatus = useCallback(async (url: string) => {
    if (!modelRunning || !predictionID) {
      return; 
    }
    try {
      const statusResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      });
      if (!statusResponse.ok) {
        throw new Error(`HTTP error! status: ${statusResponse.status}`);
      }
      const statusData = await statusResponse.json();
      console.log('polling: ', statusData);

      if (statusData.completed_at) {
        setModelVerdict(statusData.output);
        bottomSheetRef.current?.open();
        setCapturedPhoto(undefined);
        setModelRunning(false);
        setPredictionID('');
      } else {
        // Retry polling after a delay
        timeoutRef.current = setTimeout(() => pollStatus(url), 2000); // 2 seconds delay
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  }, [modelRunning, predictionID, bottomSheetRef]);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ skipMetadata: true });

        if (photo.uri) {

          const imageWidth = photo.width;
          const imageHeight = photo.height;

          // Define the cropping rectangle based on the image dimensions
          const cropRect = {
            originX: imageWidth * 0.175, 
            originY: imageHeight * 0.3, 
            width: imageWidth * 0.675, 
            height: imageHeight * 0.3, 
          };

          const croppedPhoto = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ crop: cropRect }],
            { base64: true }
          );
          const base64Image = `data:image/jpeg;base64,${croppedPhoto.base64}`;
          setCapturedPhoto(croppedPhoto.base64);

          // API call
          const response = await fetch(`${REPLICATE_URL}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: `${REPLICATE_VERSION}`,
              input: {
                image: base64Image,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setModelRunning(true);
          setPredictionID(data.id);

          console.log('replicate: ', data);
          
          // Start polling
          pollStatus(data.urls.get);
          // console.log('done polling');

        } else {
          console.error('Failed to capture photo');
          alert('Failed to capture photo. Please try again.'); // alert the user
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        alert('Failed to take picture. Please try again.'); // alert the user
      }
    }
  };

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    const { scale } = event.nativeEvent;
    const newZoom = Math.min(Math.max(0, scale / 80), 1); // clamp zoom between 0 and 1
    setZoom(newZoom);
  };

  // camera page recylce icon
  const svgMarkup = `
  <svg xmlns="http://www.w3.org/2000/svg" width="144" height="133" viewBox="0 0 144 133" fill="none">
    <path d="M78.974 103.374L65.1143 116.507M65.1143 116.507L78.974 129.64M65.1143 116.507H127.483C129.691 116.399 131.84 115.793 133.75 114.738C135.66 113.683 137.275 112.21 138.462 110.442C139.649 108.675 140.373 106.664 140.573 104.578C140.772 102.492 140.442 100.39 139.61 98.4493L135.799 91.8828" stroke="white" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M54.8858 63.9789L49.8079 45.9688M49.8079 45.9688L30.857 50.7946M49.8079 45.9688L18.5936 97.3496C17.5872 99.2227 17.067 101.297 17.0762 103.4C17.0855 105.503 17.624 107.574 18.6468 109.439C19.6697 111.304 21.1471 112.909 22.9558 114.121C24.7645 115.333 26.8519 116.116 29.0439 116.405L36.9587 116.561" stroke="white" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M102.942 63.977L121.893 68.8028M121.893 68.8028L126.971 50.7927M121.893 68.8028L90.6789 17.422C89.4752 15.6572 87.8448 14.1917 85.9237 13.1478C84.0026 12.1039 81.8466 11.5119 79.6357 11.4212C77.4248 11.3305 75.2232 11.7438 73.2146 12.6265C71.206 13.5093 69.4488 14.8358 68.0896 16.4955L63.9899 22.9315" stroke="white" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

  /**************** Nav functions ****************/
  const handleReusePress = () => {  
    if (modelVerdict == 1 || modelVerdict == 3 || modelVerdict >= 6) {  
      setIsAnimating(false);
      setReuseModalVisible(true);
    } else if (capturedPhoto && modelVerdict && user) {
      dispatch(createScan({ scannedBy: user.id, plasticNumber: modelVerdict, image: capturedPhoto, reused: true, recycled: false }));
      dispatch(reusedRedux());
      setIsAnimating(false);
      setCapturedPhoto(null);
      bottomSheetRef.current?.close();
      navigation.navigate(BaseTabRoutes.SCAN_COMPLETE, {});
    }
  };

  const selectButtonPressed = () => {
    if (capturedPhoto && modelVerdict && user) {
      dispatch(recycledRedux());
      dispatch(createScan({ scannedBy: user.id, plasticNumber: modelVerdict, image: capturedPhoto, reused: false, recycled: true }));
    }
    setIsAnimating(false);
    setCapturedPhoto(undefined);
    bottomSheetRef.current?.close();
    navigation.navigate(BaseTabRoutes.SCAN_COMPLETE, {});
  };

  const goToFrontPage = () => {
    setCapturedPhoto(undefined);
    setIsAnimating(false);
    if (modelRunning) {
      fetch(`${REPLICATE_URL}/${predictionID}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      });
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setModelRunning(false);
    setPredictionID('');

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
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
      >
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash="auto" zoom={zoom} onCameraReady={() => setIsCameraReady(true)}>
          <View style={styles.overlay}>
            <View style={styles.topContainer}>
              <View style={styles.backButtonContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => goToFrontPage()}
                >
                  <Ionicons name="arrow-back-outline" size={36} color="white" />
                </TouchableOpacity>

              </View>
            </View>
            <View style={styles.cameraTextContainer}>
              <Text style={styles.cameraText}>
                {capturedPhoto ? 'Polymer captured, recognizing...' : 'Center the polymer icon'}
              </Text>
            </View>
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View
                onLayout={(e) =>
                  setAnimationLineHeight(e.nativeEvent.layout.height)
                }
                style={styles.focusedContainer}
              >
                {capturedPhoto ? (
                  <ActivityIndicator size="large" color="white" style={{ alignSelf: 'center', position:'absolute', bottom:'45%' }}/>
                ) : (
                  <>
                    <Animated.View
                      style={[
                        styles.animationLineStyle,
                        {
                          transform: [
                            {
                              translateY: focusLineAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, animationLineHeight],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <SvgXml xml={svgMarkup} style={{ position: 'absolute', right:'18.5%', bottom:'15.5%' }} width="70%" height="70%" />
                  </>
                )}
              </View>
              <View style={styles.unfocusedContainer}></View>
            </View>

            <View style={styles.bottomContainer}>
              <View style={styles.flipButtonContainer}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={toggleCameraType}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={36}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                ></TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </PinchGestureHandler>
      <RBSheet
        ref={bottomSheetRef}
        height={screenHeight * 0.4}
        openDuration={250}
        closeDuration={200}
        closeOnDragDown={!(modelVerdict>=1 && modelVerdict<=7)}
        closeOnPressMask={!(modelVerdict>=1 && modelVerdict<=7)}
        dragFromTopOnly={!(modelVerdict>=1 && modelVerdict<=7)}
        customStyles={{
          wrapper: {
            backgroundColor: 'transparent',
          },
          container: {
            backgroundColor: '#FBFBF4',
            justifyContent: 'space-evenly',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            alignItems: 'center',
            paddingBottom: screenHeight * 0.05,
          },
          // only shows up when closeOnDragDown is true
          draggableIcon: {
            backgroundColor: '#000',
            bottom: screenHeight * 0.03
          },
        }}
      >
       {modelVerdict>=1 && modelVerdict<=7 ?
        <>
        <View style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 20, borderColor: 'black', marginTop:12 }}>
              
            <View style={{ justifyContent:'center', alignItems:'center', borderColor:'black', width: '50%', maxHeight: '40%', marginBottom: 8, marginTop:20  }}>
              <PlasticSymbol right={'4.5%'}> </PlasticSymbol>
              <Text style={[styles.bottomSheetTitle]}>{modelVerdict}</Text>
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
          plasticType={modelVerdict} /> 
        </> :
        <>
              
            <View style={{ justifyContent:'center', alignItems:'center', width: '95%', maxHeight: '40%' }}>
              <Text style={[styles.bottomSheetTitle]}>Unknown Plastic Type</Text>
            </View>

            <View style={{ justifyContent:'center',  width: '90%',  marginTop: screenHeight * 0.01 }}>
              <Text style={{ fontSize: screenHeight * 0.02, color: '#1B453C', textAlign: 'center' }}>We are unable to identify the type of plastic. Please try scanning again or manually enter.</Text>
            </View>

            <TouchableOpacity
              style={[styles.bottomSheetSelectButton, { backgroundColor: '#1B453C', marginBottom: screenHeight * 0.01, marginTop: screenHeight * 0.01}]}
              onPress={()=>{
                bottomSheetRef.current?.close();
                setCapturedPhoto(undefined);
                setIsAnimating(true);
                setModelVerdict(0);
              }}
            >
              <Text style={styles.bottomSheetSelectButtonText}>Rescan Label</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomSheetSelectButton, { borderColor: '#1B453C', borderWidth: 1, backgroundColor: 'transparent' }]}
              onPress={()=>{
                bottomSheetRef.current?.close();
                setCapturedPhoto(undefined);
                setModelVerdict(0);
                navigation.navigate(BaseTabRoutes.MANUAL_ENTRY, {});
              }}
            >
              <Text style={[styles.bottomSheetSelectButtonText, { color: '#1B453C' }]}>Manually Enter</Text>
            </TouchableOpacity>
        </>
      }
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
  camera: {
    flex: 1,
    width: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    left: '3%',
    borderColor: 'red',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    backgroundColor: 'transparent',
  },
  manualEntryButtonContainer: {
    position: 'absolute',
    right: '5%',
  },
  manualEntryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(218, 229, 215, 0.83)',
  },
  manualEntryText: {
    color: '#1B453C',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: -0.2,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
    paddingBottom: -40,
    // justifyContent: 'center',
  },
  topContainer: {
    flexDirection: 'row',
    height: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 10,
    marginBottom: 80,
  },
  bottomContainer: {
    flexDirection: 'row',
    height: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 100,
    marginBottom: 60,
  },
  focusedContainer: {
    flex: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignContent: 'center',
    // justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  animationLineStyle: {
    height: 2,
    width: '100%',
    backgroundColor: 'white',
  },
  rescanIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  previewContainer: {
    position: 'absolute',
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  bottomSheetsvg: {
    position: 'relative',
    right: '4.5%',
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
  cameraTextContainer: {
    marginBottom: 12, 
  },
  cameraText: {
    color: '#FFF',
    textAlign: 'center',
    // fontFamily: 'Inter',
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: -0.3,
    alignContent: 'center',
    alignSelf:'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 35,
    color: '#1B453C',
    fontWeight: 'bold',
    position: 'absolute',
  },
  svg: {
    position: 'relative',
    right: '5.5%',
    bottom: '1%',
    color: 'black',
  },
});

export default CameraPage;

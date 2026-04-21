import React from 'react';
import { GestureResponderEvent, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Colors from 'utils/Colors';
import TextStyles from 'utils/TextStyles';

interface AppButtonProps {
  onPress: (event: GestureResponderEvent) => void
  title: string
  fullWidth?: boolean
  isArrow?: boolean
  backgroundColor?: string
  textColor?: string
  style?: StyleProp<ViewStyle>
  inverted?: boolean
  disabled?: boolean
  textStyle?: StyleProp<TextStyle>
}

const Button = ({
  onPress,
  title,
  isArrow,
  fullWidth,
  style,
  textStyle,
  backgroundColor = Colors.primary.normal,
  textColor = 'white',
  inverted = false,
  disabled = false,
}: AppButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      ...styles.appButtonContainer,
      backgroundColor,
      ...(style as object),
      ...(inverted) && { backgroundColor: Colors.neutral[2] },
      ...(fullWidth) && { width: '100%' },
      ...(disabled) && { opacity: 0.7 },
    }}>
    <Text style={[styles.appButtonText, { color: textColor, ...(inverted) && { color: 'white' } }, textStyle]}>{title}</Text>
    {
      isArrow && <AntDesign name='caretright' size={25} color='white' />
    }
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  appButtonContainer: {
    elevation: 8,
    backgroundColor: Colors.primary.normal,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 30,
    shadowColor: '#171717',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    fontSize: 14,
    alignContent: 'center',

  },
  appButtonText: {
    ...TextStyles.subTitle,
    color: 'white',
    alignSelf: 'center',
    textTransform: 'uppercase',
    fontSize: 14,
  },
});

export default Button;

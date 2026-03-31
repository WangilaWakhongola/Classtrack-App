import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  }

  return token;
}

export async function scheduleClassReminder(className, classTime) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Class Starting Soon',
      body: `${className} starts in 15 minutes. Don't forget to sign attendance!`,
      sound: true,
    },
    trigger: {
      date: new Date(classTime.getTime() - 15 * 60 * 1000),
    },
  });
}

export async function sendAttendanceConfirmation(className) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Attendance Signed',
      body: `Your attendance for ${className} has been recorded successfully.`,
      sound: true,
    },
    trigger: null,
  });
}

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // User pressed the notification — app will open automatically
  }
});

AppRegistry.registerComponent(appName, () => App);

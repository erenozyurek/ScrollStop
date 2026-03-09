import notifee, { AndroidImportance } from '@notifee/react-native';

const CHANNEL_ID = 'scrollstop-video';

let channelCreated = false;

async function ensureChannel() {
  if (channelCreated) {
    return;
  }
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Video Generation',
    importance: AndroidImportance.HIGH,
  });
  channelCreated = true;
}

export async function showVideoReadyNotification(productName: string) {
  await ensureChannel();
  await notifee.displayNotification({
    title: 'Video Ready 🎬',
    body: `${productName} video is ready. Open the app to preview it.`,
    android: {
      channelId: CHANNEL_ID,
      pressAction: { id: 'default' },
    },
  });
}

export async function showVideoFailedNotification(
  productName: string,
  error?: string | null,
) {
  await ensureChannel();
  await notifee.displayNotification({
    title: 'Video Generation Failed',
    body: error || `${productName} could not be generated.`,
    android: {
      channelId: CHANNEL_ID,
      pressAction: { id: 'default' },
    },
  });
}

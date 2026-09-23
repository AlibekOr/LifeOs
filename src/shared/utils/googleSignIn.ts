import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { RNCLI_GOOGLE_WEB_CLIENT_ID, RNCLI_GOOGLE_IOS_CLIENT_ID } from '@env';

GoogleSignin.configure({
  webClientId: RNCLI_GOOGLE_WEB_CLIENT_ID,
  iosClientId: RNCLI_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});

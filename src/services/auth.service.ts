import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../shared/utils/supabase.ts';
import '../shared/utils/googleSignIn.ts';

async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// Technical details go to the log only; users get one plain message.
const GOOGLE_SIGN_IN_ERROR = "Couldn't sign in with Google. Please try again.";

async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { data: null, error: null };
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      console.error('[signInWithGoogle] Google returned no ID token');
      return { data: null, error: GOOGLE_SIGN_IN_ERROR };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      console.error('[signInWithGoogle] Supabase rejected the token', error);
      return { data: null, error: GOOGLE_SIGN_IN_ERROR };
    }
    return { data, error: null };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { data: null, error: null };
    }
    const code = isErrorWithCode(err) ? err.code : 'UNKNOWN';
    const message = err instanceof Error ? err.message : String(err);
    console.error('[signInWithGoogle]', code, message);
    return { data: null, error: GOOGLE_SIGN_IN_ERROR };
  }
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { session: null, error: error.message };
  }
  return { session: data.session, error: null };
}

export const authService = {
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  resetPassword,
  getSession,
};

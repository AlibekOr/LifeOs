import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

// Centers an auth form when it fits, and lets it scroll (and stay clear of the
// keyboard) on short screens so the submit button is never hidden.
const KeyboardAwareContent = ({ children }: PropsWithChildren) => (
  <KeyboardAvoidingView
    className="flex-1"
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <ScrollView
      contentContainerClassName="flex-grow justify-center px-life-6 py-life-4"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);

export default KeyboardAwareContent;

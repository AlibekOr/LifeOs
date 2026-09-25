import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import LifeText from '../Typography/LifeText.tsx';

export type LifeActionSheetAction = {
  label: string;
  description?: string;
  danger?: boolean;
  onPress: () => void;
};

type LifeActionSheetProps = {
  visible: boolean;
  title: string;
  actions: LifeActionSheetAction[];
  onClose: () => void;
};

// A bottom sheet of choices. Used instead of Alert.alert, which shows at most
// three buttons on Android.
const LifeActionSheet = ({
  visible,
  title,
  actions,
  onClose,
}: LifeActionSheetProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <Pressable
      accessibilityLabel="Close"
      onPress={onClose}
      className="flex-1 justify-end bg-life-bg/80"
    >
      <Pressable
        onPress={() => {}}
        className="gap-life-2 rounded-t-life-2xl border border-life-border bg-life-surface p-life-5 pb-life-8"
      >
        <LifeText
          variant="h3"
          className="pb-life-2 font-bold"
          numberOfLines={1}
        >
          {title}
        </LifeText>
        {actions.map(action => (
          <TouchableOpacity
            key={action.label}
            accessibilityRole="button"
            accessibilityHint={action.description}
            onPress={action.onPress}
            className="rounded-life-md border border-life-border bg-life-bg px-life-4 py-life-3"
          >
            <LifeText
              variant="body"
              color={action.danger ? 'text-life-danger' : 'text-life-text'}
              className="font-medium"
            >
              {action.label}
            </LifeText>
            {action.description ? (
              <LifeText variant="caption" color="text-life-muted">
                {action.description}
              </LifeText>
            ) : null}
          </TouchableOpacity>
        ))}
        <View className="pt-life-1">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            className="items-center py-life-3"
          >
            <LifeText variant="body" color="text-life-muted">
              Close
            </LifeText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

export default LifeActionSheet;

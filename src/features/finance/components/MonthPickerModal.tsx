import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import { formatYearMonth, recentYearMonths } from '../utils/month.ts';

const MONTHS_TO_SHOW = 12;

type MonthPickerModalProps = {
  visible: boolean;
  value: string;
  onSelect: (yearMonth: string) => void;
  onClose: () => void;
};

const MonthPickerModal = ({
  visible,
  value,
  onSelect,
  onClose,
}: MonthPickerModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable
      accessibilityLabel="Close month picker"
      className="flex-1 justify-end bg-life-bg/80"
      onPress={onClose}
    >
      {/* Swallow taps inside the sheet so they don't close it. */}
      <Pressable onPress={() => {}}>
        <SafeAreaView
          edges={['bottom']}
          className="max-h-[480px] rounded-t-life-2xl border border-life-border bg-life-surface"
        >
          <View className="px-life-5 pb-life-2 pt-life-5">
            <LifeText variant="h3" className="font-bold">
              Select month
            </LifeText>
          </View>
          <ScrollView contentContainerClassName="px-life-3 pb-life-4">
            {recentYearMonths(MONTHS_TO_SHOW).map(yearMonth => {
              const selected = yearMonth === value;
              return (
                <Pressable
                  key={yearMonth}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(yearMonth)}
                  className={`rounded-life-md px-life-4 py-life-3 ${
                    selected ? 'bg-life-primary/20' : ''
                  }`}
                >
                  <LifeText
                    variant="body"
                    color={selected ? 'text-life-accent' : 'text-life-text'}
                    className={selected ? 'font-semibold' : ''}
                  >
                    {formatYearMonth(yearMonth)}
                  </LifeText>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Pressable>
    </Pressable>
  </Modal>
);

export default MonthPickerModal;

import { useState } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import LifeText from '../Typography/LifeText.tsx';

type LifeDateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (value: Date) => void;
  error?: string;
};

function formatValue(value: Date, mode: 'date' | 'time'): string {
  return mode === 'date'
    ? value.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// A tappable field that opens the native date or time picker: inline (with a
// Done button) on iOS, the system dialog on Android.
const LifeDateTimeField = ({
  label,
  mode,
  value,
  onChange,
  error,
}: LifeDateTimeFieldProps) => {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(selected);
  };

  return (
    <View className="gap-life-2">
      <LifeText variant="bodySm" className="font-medium text-life-muted">
        {label}
      </LifeText>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatValue(value, mode)}`}
        onPress={() => setOpen(true)}
        className={`rounded-life-md border bg-life-surface p-life-4 ${
          error ? 'border-life-danger' : 'border-life-border'
        }`}
      >
        <LifeText variant="body">{formatValue(value, mode)}</LifeText>
      </TouchableOpacity>
      {error ? (
        <LifeText variant="caption" color="text-life-danger">
          {error}
        </LifeText>
      ) : null}
      {open && (
        <View className="overflow-hidden rounded-life-md border border-life-border bg-life-surface p-life-3">
          <DateTimePicker
            value={value}
            mode={mode}
            display={
              Platform.OS === 'ios'
                ? mode === 'date'
                  ? 'inline'
                  : 'spinner'
                : 'default'
            }
            themeVariant="dark"
            accentColor="#6366F1"
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              className="items-end pt-life-2"
            >
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-accent"
              >
                Done
              </LifeText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default LifeDateTimeField;

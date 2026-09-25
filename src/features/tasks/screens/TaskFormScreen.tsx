import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import LifeText from '../../../shared/components/Typography/LifeText.tsx';
import LifeInput from '../../../shared/components/Input/LifeInput.tsx';
import LifeButton from '../../../shared/components/Button/LifeButton.tsx';
import LifePills from '../../../shared/components/Pills/LifePills.tsx';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '../hooks/useTasks.ts';
import { useTasksWithPending } from '../hooks/useTasksWithPending.ts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus.ts';
import { workStartIfAhead } from '../../../utils/workStart.ts';
import { useProfile } from '../../profile/hooks/useProfile.ts';
import {
  MAX_ATTACHMENT_BYTES,
  taskAttachmentService,
} from '../../../services/taskAttachment.service.ts';
import type { TaskPriority } from '../../../types/task.types.ts';
import type { TaskFormScreenProps } from './type.ts';

type PriorityOption = 'None' | TaskPriority;
type PhotoState = { uri: string } | 'removed' | null;

const PRIORITY_OPTIONS: PriorityOption[] = ['None', 'High', 'Medium', 'Low'];

function toDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function toTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

function parseDueDate(dueDate: string): Date {
  return new Date(`${dueDate}T00:00:00`);
}

function parseScheduledTime(scheduledTime: string): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TaskFormScreen = ({ navigation, route }: TaskFormScreenProps) => {
  const taskId = route.params?.taskId;
  const isEdit = Boolean(taskId);

  const { tasks } = useTasksWithPending();
  const { isOnline } = useNetworkStatus();
  const { data: profile } = useProfile();
  const existingTask = taskId
    ? tasks?.find(task => task.id === taskId)
    : undefined;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  // A new task starts when the working day starts, if that is still ahead today.
  const [scheduledTime, setScheduledTime] = useState(() => {
    const workStart = workStartIfAhead(new Date(), profile?.work_start_time);
    return workStart ? parseScheduledTime(workStart) : new Date();
  });
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [priorityOption, setPriorityOption] = useState<PriorityOption>('None');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [photo, setPhoto] = useState<PhotoState>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Populate once per task so a background refetch or sync never overwrites
  // what the user is typing.
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (existingTask && existingTask.id !== hydratedId) {
      setHydratedId(existingTask.id);
      setTitle(existingTask.title);
      setDueDate(parseDueDate(existingTask.due_date));
      setScheduledTime(parseScheduledTime(existingTask.scheduled_time));
      setDurationMinutes(String(existingTask.duration_minutes));
      setPriorityOption(existingTask.priority ?? 'None');
    }
  }, [existingTask, hydratedId]);

  useEffect(() => {
    let cancelled = false;
    if (existingTask?.attachment_path) {
      taskAttachmentService
        .getTaskAttachmentUrl(existingTask.attachment_path)
        .then(url => {
          if (!cancelled) {
            setPreviewUrl(url);
          }
        })
        .catch(error => {
          console.error('[TaskForm] Failed to load attachment preview', error);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [existingTask?.attachment_path]);

  const displayPhotoUri =
    photo && photo !== 'removed'
      ? photo.uri
      : photo === 'removed'
      ? null
      : previewUrl;

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(result.errorMessage ?? 'Failed to pick image.');
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Please choose a photo under 2MB.');
      return;
    }
    setPhoto({ uri: asset.uri });
  };

  const handleRemovePhoto = () => {
    setPhoto('removed');
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedTime) {
      setScheduledTime(selectedTime);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const parsedDuration = parseInt(durationMinutes, 10);

    if (!trimmedTitle) {
      Alert.alert('Please enter a task title.');
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      Alert.alert('Please enter a valid duration in minutes.');
      return;
    }
    if (photo !== null && !isOnline) {
      Alert.alert(
        "You're offline",
        'Photo changes need a connection. Undo the photo change to save offline, or try again when you reconnect.',
      );
      return;
    }

    const keepingExistingAttachment = photo === null;
    const input = {
      title: trimmedTitle,
      scheduled_time: toTimeString(scheduledTime),
      duration_minutes: parsedDuration,
      priority: priorityOption === 'None' ? null : priorityOption,
      due_date: toDateString(dueDate),
      attachment_path: keepingExistingAttachment
        ? existingTask?.attachment_path ?? null
        : null,
    };

    setLoading(true);
    try {
      const savedTask =
        isEdit && taskId
          ? await updateTask.mutateAsync({ id: taskId, input })
          : await createTask.mutateAsync(input);

      // The task is saved from here on. Failing to handle its photo must not
      // look like a failed save, or a retry would create a duplicate task.
      let photoFailed = false;
      try {
        if (photo && photo !== 'removed') {
          const path = await taskAttachmentService.uploadTaskAttachment(
            savedTask.id,
            photo.uri,
          );
          await updateTask.mutateAsync({
            id: savedTask.id,
            input: { attachment_path: path },
          });
        }
        // Remove the previous file only after the task no longer points at it.
        if (photo !== null && existingTask?.attachment_path) {
          await taskAttachmentService.deleteTaskAttachment(
            existingTask.attachment_path,
          );
        }
      } catch (photoError) {
        console.error('[TaskForm] Photo update failed', photoError);
        photoFailed = true;
      }

      if (photoFailed) {
        Alert.alert(
          'Task saved',
          "Your task was saved, but its photo couldn't be updated. You can edit the task to try again.",
        );
      }
      navigation.goBack();
    } catch (err) {
      console.error('[TaskForm] Failed to save task', err);
      Alert.alert('Could not save task', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!taskId) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "You're offline",
        'Deleting a task needs a connection. Please try again when you reconnect.',
      );
      return;
    }
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask.mutateAsync(taskId);
            if (existingTask?.attachment_path) {
              // The task is gone; a leftover file is harmless, so don't block on it.
              await taskAttachmentService
                .deleteTaskAttachment(existingTask.attachment_path)
                .catch(error => {
                  console.error(
                    '[TaskForm] Failed to delete attachment',
                    error,
                  );
                });
            }
            navigation.goBack();
          } catch (err) {
            console.error('[TaskForm] Failed to delete task', err);
            Alert.alert('Could not delete task', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top', 'bottom']}>
      <View className="h-12 flex-row items-center justify-between px-life-4">
        <TouchableOpacity
          accessibilityLabel="Cancel"
          onPress={() => navigation.goBack()}
        >
          <LifeText variant="body" className="text-life-accent">
            Cancel
          </LifeText>
        </TouchableOpacity>
        <LifeText variant="h3" className="font-bold">
          {isEdit ? 'Edit Task' : 'New Task'}
        </LifeText>
        <View className="w-14" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LifeInput
            label="Title"
            placeholder="What do you need to do?"
            value={title}
            onChangeText={setTitle}
          />

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Due Date
            </LifeText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowDatePicker(true)}
              className="rounded-life-md border border-life-border bg-life-surface p-life-4"
            >
              <LifeText variant="body">{formatDateLabel(dueDate)}</LifeText>
            </TouchableOpacity>
            {showDatePicker && (
              <View className="overflow-hidden rounded-life-md border border-life-border bg-life-surface p-life-3">
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  themeVariant="dark"
                  accentColor="#6366F1"
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setShowDatePicker(false)}
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

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Time
            </LifeText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowTimePicker(true)}
              className="rounded-life-md border border-life-border bg-life-surface p-life-4"
            >
              <LifeText variant="body">
                {formatTimeLabel(scheduledTime)}
              </LifeText>
            </TouchableOpacity>
            {showTimePicker && (
              <View className="overflow-hidden rounded-life-md border border-life-border bg-life-surface p-life-3">
                <DateTimePicker
                  value={scheduledTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant="dark"
                  accentColor="#6366F1"
                  onChange={handleTimeChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setShowTimePicker(false)}
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

          <LifeInput
            label="Duration (minutes)"
            placeholder="30"
            keyboardType="numeric"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
          />

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Photo
            </LifeText>
            {displayPhotoUri ? (
              <View className="gap-life-2">
                <Image
                  source={{ uri: displayPhotoUri }}
                  className="h-40 w-full rounded-life-md"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleRemovePhoto}
                >
                  <LifeText
                    variant="bodySm"
                    className="font-semibold text-life-danger"
                  >
                    Remove Photo
                  </LifeText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handlePickPhoto}
                className="items-center rounded-life-md border border-dashed border-life-border bg-life-surface p-life-6"
              >
                <LifeText variant="bodySm" color="text-life-muted">
                  Tap to add a photo
                </LifeText>
              </TouchableOpacity>
            )}
          </View>

          <View className="gap-life-2">
            <LifeText variant="bodySm" className="font-medium text-life-muted">
              Priority
            </LifeText>
            <LifePills
              options={PRIORITY_OPTIONS}
              value={priorityOption}
              onChange={setPriorityOption}
            />
          </View>

          {isEdit && (
            <TouchableOpacity
              accessibilityRole="button"
              className="items-center"
              onPress={handleDelete}
            >
              <LifeText
                variant="bodySm"
                className="font-semibold text-life-danger"
              >
                Delete Task
              </LifeText>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View className="items-center border-t border-life-border bg-life-bg px-life-5 pb-life-3 pt-life-3">
          <LifeButton
            title={loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Task'}
            disabled={loading}
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TaskFormScreen;

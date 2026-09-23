import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
  const existingTask = taskId
    ? tasks?.find(task => task.id === taskId)
    : undefined;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [scheduledTime, setScheduledTime] = useState(() => new Date());
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [priorityOption, setPriorityOption] = useState<PriorityOption>('None');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [photo, setPhoto] = useState<PhotoState>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDueDate(parseDueDate(existingTask.due_date));
      setScheduledTime(parseScheduledTime(existingTask.scheduled_time));
      setDurationMinutes(String(existingTask.duration_minutes));
      setPriorityOption(existingTask.priority ?? 'None');
    }
  }, [existingTask]);

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
        .catch(() => {});
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
      if (photo !== null && existingTask?.attachment_path) {
        await taskAttachmentService
          .deleteTaskAttachment(existingTask.attachment_path)
          .catch(() => {});
      }

      const savedTask =
        isEdit && taskId
          ? await updateTask.mutateAsync({ id: taskId, input })
          : await createTask.mutateAsync(input);

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

      navigation.goBack();
    } catch (err) {
      Alert.alert(err instanceof Error ? err.message : 'Failed to save task.');
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
            if (existingTask?.attachment_path) {
              await taskAttachmentService
                .deleteTaskAttachment(existingTask.attachment_path)
                .catch(() => {});
            }
            await deleteTask.mutateAsync(taskId);
            navigation.goBack();
          } catch (err) {
            Alert.alert(
              err instanceof Error ? err.message : 'Failed to delete task.',
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-life-bg" edges={['top']}>
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

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-life-5 px-life-5 pb-life-10 pt-life-3"
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
            <LifeText variant="body">{formatTimeLabel(scheduledTime)}</LifeText>
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

        <View className="items-center pt-life-4">
          <LifeButton
            title={loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Task'}
            disabled={loading}
            onPress={handleSubmit}
            fullWidth
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
    </SafeAreaView>
  );
};

export default TaskFormScreen;

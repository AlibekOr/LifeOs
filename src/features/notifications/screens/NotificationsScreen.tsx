import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = 'alert' | 'sparkles' | 'dollar' | 'checkCircle' | 'info';
type Item = {
  title: string;
  body: string;
  time: string;
  icon: IconName;
  tone: string;
  border: string;
  unread?: boolean;
};

const icons = {
  alert: require('../../../shared/assets/notifications/alert.png'),
  sparkles: require('../../../shared/assets/notifications/sparkles.png'),
  dollar: require('../../../shared/assets/notifications/dollar.png'),
  checkCircle: require('../../../shared/assets/notifications/check-circle.png'),
  info: require('../../../shared/assets/notifications/info.png'),
};

const navigationItems = [
  {
    label: 'Home',
    icon: require('../../../shared/assets/notifications/home.png'),
  },
  {
    label: 'Tasks',
    icon: require('../../../shared/assets/notifications/tasks.png'),
  },
  {
    label: 'Goals',
    icon: require('../../../shared/assets/notifications/goals.png'),
  },
  { label: 'Insights', fallback: '▥' },
  {
    label: 'Profile',
    icon: require('../../../shared/assets/notifications/profile.png'),
  },
];

const today: Item[] = [
  {
    title: 'Your interview starts in 2 hours',
    body: 'React Interview Prep is scheduled at 11:30',
    time: '9:30 AM',
    icon: 'alert',
    tone: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    unread: true,
  },
  {
    title: '30 free minutes found',
    body: 'You have a block of free time between 15:00-15:30. Spend it wisely!',
    time: '8:15 AM',
    icon: 'sparkles',
    tone: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    unread: true,
  },
  {
    title: 'Food spending warning',
    body: 'Your food expense is 15% above your weekly budget targets.',
    time: 'Yesterday',
    icon: 'dollar',
    tone: 'rgba(245,158,11,0.08)',
    border: 'rgba(255,255,255,0.06)',
  },
  {
    title: 'Goals milestone reached! 🎉',
    body: 'You completed 5 tasks today. Great momentum!',
    time: '7:00 AM',
    icon: 'checkCircle',
    tone: 'rgba(16,185,129,0.08)',
    border: 'rgba(255,255,255,0.06)',
  },
];

const yesterday: Item[] = [
  {
    title: 'Weekly report is ready',
    body: 'Your productivity score was 87% this week. Tap to review details.',
    time: 'Yesterday, 6:00 PM',
    icon: 'info',
    tone: 'rgba(91,91,102,0.08)',
    border: 'rgba(255,255,255,0.06)',
  },
  {
    title: 'New AI recommendation',
    body: 'I have optimized your workspace roadmap based on your latest tasks.',
    time: 'Yesterday, 10:15 AM',
    icon: 'sparkles',
    tone: 'rgba(99,102,241,0.08)',
    border: 'rgba(255,255,255,0.06)',
  },
];

const NotificationCard = ({
  item,
  allRead,
}: {
  item: Item;
  allRead: boolean;
}) => (
  <View
    className="mb-life-3 flex-row gap-life-3 rounded-life-lg border bg-life-surface p-life-4"
    style={{ borderColor: item.border }}
  >
    <View
      className="h-10 w-10 items-center justify-center rounded-life-md"
      style={{ backgroundColor: item.tone }}
    >
      <Image source={icons[item.icon]} className="h-5 w-5" />
    </View>
    <View className="flex-1 gap-life-1">
      <View className="flex-row items-center">
        <Text
          className="flex-1 font-inter text-[14px] font-bold text-[#F9FAFB]"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.unread && !allRead ? (
          <View className="ml-life-2 h-[6px] w-[6px] rounded-full bg-life-primary" />
        ) : null}
      </View>
      <Text className="font-inter text-[13px] leading-[18px] text-life-muted">
        {item.body}
      </Text>
      <Text className="font-inter text-[11px] text-life-subtle">
        {item.time}
      </Text>
    </View>
  </View>
);

const NotificationsScreen = () => {
  const [allRead, setAllRead] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#070709]">
      <StatusBar barStyle="light-content" backgroundColor="#070709" />
      <View className="flex-row items-center justify-between px-life-6 py-life-3">
        <Text className="font-inter text-[24px] font-bold text-[#F9FAFB]">
          Notifications
        </Text>
        <Pressable onPress={() => setAllRead(true)}>
          <Text className="font-inter text-life-body-sm font-semibold text-life-accent">
            Mark all read
          </Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1 px-life-4"
        contentContainerClassName="gap-life-5 pb-10 pt-life-3"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="mb-life-3 font-inter text-[13px] font-bold text-life-subtle">
            TODAY
          </Text>
          {today.map(item => (
            <NotificationCard key={item.title} item={item} allRead={allRead} />
          ))}
        </View>
        <View>
          <Text className="mb-life-3 font-inter text-[13px] font-bold text-life-subtle">
            YESTERDAY
          </Text>
          {yesterday.map(item => (
            <NotificationCard key={item.title} item={item} allRead={allRead} />
          ))}
        </View>
      </ScrollView>
      <View className="flex-row justify-between border-t border-[#FFFFFF14] bg-life-bg px-life-4 pb-life-4 pt-life-3">
        {navigationItems.map((item, index) => (
          <View key={item.label} className="w-16 items-center gap-life-1">
            {item.icon ? (
              <Image source={item.icon} className="h-5 w-5" />
            ) : (
              <Text className="h-5 text-[20px] leading-5 text-life-subtle">
                {item.fallback}
              </Text>
            )}
            <Text
              className={`font-inter text-[11px] ${
                index === 0
                  ? 'font-semibold text-life-accent'
                  : 'font-medium text-life-subtle'
              }`}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

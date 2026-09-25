import React from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

type LifeInputProps = TextInputProps & {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
};

const LifeInput = ({
  label,
  error,
  placeholder,
  rightElement,
  ...props
}: LifeInputProps) => {
  return (
    <View className={'w-full'}>
      {label && (
        <Text
          className={
            'mb-life-2 font-inter text-life-body-sm font-medium text-life-muted'
          }
        >
          {label}
        </Text>
      )}

      <View
        className={`flex-row rounded-life-md border px-life-4 ${
          props.multiline
            ? 'min-h-[96px] items-start py-life-3'
            : 'h-[48px] items-center'
        } ${
          error
            ? 'border-life-danger bg-life-surface'
            : 'border-life-border bg-life-surface'
        } `}
      >
        <TextInput
          className={`flex-1 font-inter text-life-body text-life-text ${
            props.multiline ? '' : 'h-full'
          }`}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          {...props}
          placeholderTextColor={'#9494A1'}
          placeholder={placeholder}
        />
        {rightElement}
      </View>
      {!!error && (
        <Text
          className={'mt-life-1 font-inter text-life-caption text-life-danger'}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default LifeInput;

import { Text, TextProps } from 'react-native';
type LifeTextProps = TextProps & {
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
  color?:
    | 'text-life-subtle'
    | 'text-life-primary'
    | 'text-life-mute'
    | 'text-life-text'
    | 'text-life-orLine'
    | 'text-life-muted'
    | 'text-life-accent'
    | 'text-life-success'
    | 'text-life-warning'
    | 'text-life-danger';
};

const LifeText = ({
  variant = 'body',
  children,
  className,
  color = 'text-life-text',
  ...props
}: LifeTextProps) => {
  const variants = {
    display: 'text-life-display',
    h1: 'text-life-h1',
    h2: 'text-life-h2',
    h3: 'text-life-h3',
    body: 'text-life-body',
    bodySm: 'text-life-body-sm',
    caption: 'text-life-caption',
  };

  return (
    <Text
      {...props}
      className={`font-inter ${color} ${variants[variant]}  ${className ?? ''}`}
    >
      {children}
    </Text>
  );
};

export default LifeText;

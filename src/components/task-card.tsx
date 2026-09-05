import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';

export type Priority = 'low' | 'med' | 'high';
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'shopping';

const priorityColor: Record<Priority, string> = {
  low: '#3fe0c5',
  med: '#ffb84d',
  high: '#ff6b81',
};

const categoryIcon: Record<Category, keyof typeof MaterialIcons.glyphMap> = {
  work: 'work',
  personal: 'favorite',
  health: 'fitness-center',
  learning: 'menu-book',
  shopping: 'shopping-cart',
};

const categoryTint: Record<Category, string> = {
  work: 'rgba(139,124,246,0.22)',
  personal: 'rgba(244,114,182,0.22)',
  health: 'rgba(45,212,191,0.22)',
  learning: 'rgba(96,165,250,0.22)',
  shopping: 'rgba(251,191,36,0.22)',
};

const categoryColor: Record<Category, string> = {
  work: '#8b7cf6',
  personal: '#f472b6',
  health: '#2dd4bf',
  learning: '#60a5fa',
  shopping: '#fbbf24',
};

type TaskCardProps = {
  title: string;
  time: string;
  priority: Priority;
  category: Category;
  done?: boolean;
  repeat?: boolean;
  onToggle?: () => void;
};

export function TaskCard({ title, time, priority, category, done, repeat, onToggle }: TaskCardProps) {
  return (
    <GlassCard style={{ marginBottom: 10 }}>
      <View className="flex-row items-center gap-3 p-3.5">
        <TouchableOpacity
          onPress={onToggle}
          className="w-[22px] h-[22px] rounded-full items-center justify-center"
          style={{
            borderWidth: done ? 0 : 1.5,
            borderColor: 'rgba(255,255,255,0.35)',
            backgroundColor: done ? '#7c6cf6' : 'transparent',
          }}
        >
          {done && <MaterialIcons name="check" size={12} color="#fff" />}
        </TouchableOpacity>

        <View className="flex-1">
          <Text
            className="text-[14.5px] font-medium mb-0.5"
            style={{
              color: done ? 'rgba(245,243,255,0.4)' : '#f5f3ff',
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {title}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <MaterialIcons
              name={repeat ? 'repeat' : 'schedule'}
              size={12}
              color="rgba(245,243,255,0.4)"
            />
            <Text className="text-[12px]" style={{ color: 'rgba(245,243,255,0.4)' }}>
              {time}
            </Text>
          </View>
        </View>

        <View
          className="w-[7px] h-[7px] rounded-full"
          style={{ backgroundColor: priorityColor[priority] }}
        />

        <View
          className="w-[30px] h-[30px] rounded-full items-center justify-center"
          style={{ backgroundColor: categoryTint[category] }}
        >
          <MaterialIcons name={categoryIcon[category]} size={15} color={categoryColor[category]} />
        </View>
      </View>
    </GlassCard>
  );
}
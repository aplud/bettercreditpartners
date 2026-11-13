export const MOODS: [emoji: string, name: string][] = [
  ["😊", "Happy"], ["😌", "Calm"], ["🥰", "Grateful"], ["😴", "Tired"],
  ["😤", "Frustrated"], ["😟", "Anxious"], ["😢", "Sad"], ["🤯", "Overwhelmed"],
];

export const moodEmoji = (m: string) => (MOODS.find((x) => x[1] === m) || ["•"])[0];
export const moodEmojis = (moods: string[] = []) => moods.map(moodEmoji).join("");


export enum GameStatus {
  LOBBY = 'LOBBY',
  ACTIVE = 'ACTIVE',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface GameState {
  status: GameStatus;
  timeLeft: number;
  userInput: string;
  isSourceVisible: boolean;
  logs: string[];
  currentFlag: string;
  encodedFlag: string;
}

export const INITIAL_TIME = 180; // 3 minutes for more complex challenge

export const generateFlag = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CTF{RECOVERY_${randomPart}}`;
};

export const encodeFlag = (flag: string) => {
  // Let's do a double layer for the CTF feel: Hex then Base64
  const hex = flag.split('').map(c => c.charCodeAt(0).toString(16)).join('');
  return btoa(hex);
};

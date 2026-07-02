import { Platform } from 'react-native';

const HOST_IP = '192.168.68.104';

const getHost = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return window.location.hostname;
    }
    return 'localhost';
  }
  if (Platform.OS === 'android') return __DEV__ ? '10.0.2.2' : HOST_IP;
  return HOST_IP;
};

export const API_BASE_URL = `http://${getHost()}:3000/api/v1`;
export const SOCKET_URL = `http://${getHost()}:3000`;

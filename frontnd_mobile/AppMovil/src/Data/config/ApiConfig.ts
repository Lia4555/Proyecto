import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================================
//  UNICO SITIO DONDE SE CONFIGURA LA DIRECCION DEL BACKEND
// ------------------------------------------------------------
//  El servidor es el de este mismo proyecto (server.js, puerto 3000).
//  La direccion se decide en este orden:
//
//   1. EXPO_PUBLIC_API_URL, si esta definida (archivo .env de AppMovil
//      o variable de entorno al lanzar Expo). Ej.:
//        EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api
//
//   2. La IP del computador que ejecuta Expo. Expo ya la conoce (es desde
//      donde el telefono descarga la app), asi que sirve igual en un
//      telefono fisico por wifi que en el emulador, sin tocar codigo.
//
//   3. Si no hay nada de lo anterior: 10.0.2.2 en el emulador de Android
//      (asi llama el emulador al "localhost" del computador) y localhost
//      en iOS.
// ============================================================

const PUERTO = 3000;

const hostDelServidorExpo = (): string | null => {
  // hostUri llega como "192.168.1.15:8081" mientras se desarrolla con Expo.
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  if (!host) return null;

  // "localhost" dentro del emulador de Android es el propio emulador.
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
  }
  return host;
};

const resolverBaseUrl = (): string => {
  const definida = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (definida) return definida.replace(/\/+$/, '');

  const host =
    hostDelServidorExpo() ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:${PUERTO}/api`;
};

export const ApiConfig = {
  baseUrl: resolverBaseUrl(),

  /** Si el servidor no contesta en este tiempo, se corta la peticion. */
  timeoutMs: 15000,

  /** El backend devuelve el token en el JSON solo si el cliente es movil. */
  cabeceraCliente: { 'X-Client': 'mobile' }
};

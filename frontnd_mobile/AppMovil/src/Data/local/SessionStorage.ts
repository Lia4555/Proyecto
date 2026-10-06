import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Sesion, Usuario } from '../../Domain/entities';

// ============================================================
// Almacenamiento local de la sesion
// ------------------------------------------------------------
// Guarda la sesion para no pedir la contrasena cada vez que se
// abre la app, en dos sitios:
//   · token   -> almacen cifrado del sistema (Keystore en Android,
//                Keychain en iOS). Es la llave de la cuenta: no debe
//                poder leerse con un backup ni conectando el telefono.
//   · usuario -> AsyncStorage. Nombre y rol no son secretos, y asi no
//                se roza el limite de tamaño del almacen cifrado.
// En la version web de Expo no existe almacen cifrado: ahi todo va a
// AsyncStorage (localStorage), como antes.
// ============================================================

const CLAVE_USUARIO = '@transporte/usuario';
const CLAVE_TOKEN = 'transporte.token';
// Version anterior: sesion completa, token incluido, sin cifrar.
const CLAVE_ANTIGUA = '@transporte/sesion';

const hayAlmacenSeguro = Platform.OS !== 'web';

const OPCIONES_SEGURAS: SecureStore.SecureStoreOptions = {
  // Solo con el telefono desbloqueado y sin copiarse a otro dispositivo.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
};

const guardarToken = (token: string) =>
  hayAlmacenSeguro
    ? SecureStore.setItemAsync(CLAVE_TOKEN, token, OPCIONES_SEGURAS)
    : AsyncStorage.setItem(CLAVE_TOKEN, token);

const leerToken = () =>
  hayAlmacenSeguro
    ? SecureStore.getItemAsync(CLAVE_TOKEN, OPCIONES_SEGURAS)
    : AsyncStorage.getItem(CLAVE_TOKEN);

const borrarToken = () =>
  hayAlmacenSeguro
    ? SecureStore.deleteItemAsync(CLAVE_TOKEN, OPCIONES_SEGURAS)
    : AsyncStorage.removeItem(CLAVE_TOKEN);

const leerJson = <T>(texto: string | null): T | null => {
  if (!texto) return null;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
};

export class SessionStorage {
  async guardar(sesion: Sesion): Promise<void> {
    await guardarToken(sesion.token);
    await AsyncStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
  }

  async leer(): Promise<Sesion | null> {
    await this.migrarSesionAntigua();

    const [token, usuario] = await Promise.all([
      leerToken(),
      AsyncStorage.getItem(CLAVE_USUARIO).then((t) => leerJson<Usuario>(t))
    ]);

    // Falta una de las dos partes o el dato esta corrupto: se descarta
    // en vez de romper el arranque.
    if (!token || !usuario) {
      if (token || usuario) await this.borrar();
      return null;
    }
    return { token, usuario };
  }

  async borrar(): Promise<void> {
    await Promise.all([
      borrarToken(),
      AsyncStorage.removeItem(CLAVE_USUARIO),
      AsyncStorage.removeItem(CLAVE_ANTIGUA)
    ]);
  }

  // Quien actualiza la app no tiene que volver a entrar: su sesion pasa
  // al formato nuevo y el token sin cifrar se borra.
  private async migrarSesionAntigua(): Promise<void> {
    const antigua = leerJson<Sesion>(await AsyncStorage.getItem(CLAVE_ANTIGUA));
    if (antigua?.token && antigua.usuario) await this.guardar(antigua);
    await AsyncStorage.removeItem(CLAVE_ANTIGUA);
  }
}

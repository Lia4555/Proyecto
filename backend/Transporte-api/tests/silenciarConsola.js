// Se ejecuta con Jest ya listo (setupFilesAfterEnv).
import { jest } from '@jest/globals';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

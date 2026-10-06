import {
  ActualizarEstadoServicio,
  CargarCatalogos,
  CargarReferencias,
  CerrarSesion,
  EliminarFila,
  GuardarFila,
  ListarFilas,
  ValidarRegistro,
  CrearAlerta,
  CrearServicio,
  EditarServicio,
  GestionarCuenta,
  IniciarSesion,
  ListarAlertas,
  ListarConductores,
  ListarCuentas,
  ListarServicios,
  GuardarFotoPerfil,
  ObtenerFotoPerfil,
  ObtenerResumenAdmin,
  ObtenerVehiculos,
  QuitarFotoPerfil,
  RegistrarCuenta,
  ReportarEstadoVehiculo,
  ResolverAlerta,
  RestaurarSesion
} from '../../Domain/useCases';
import { httpClient } from '../api/HttpClient';
import { SelectorImagen } from '../device/SelectorImagen';
import { SessionStorage } from '../local/SessionStorage';
import { AuthApiSource } from '../sources/AuthApiSource';
import { PerfilApiSource } from '../sources/PerfilApiSource';
import { TablaApiSource } from '../sources/TablaApiSource';
import { TransporteApiSource } from '../sources/TransporteApiSource';
import { TablaRepositoryImpl } from '../repositories/TablaRepositoryImpl';
import { AdminRepositoryImpl } from '../repositories/AdminRepositoryImpl';
import { AlertaRepositoryImpl } from '../repositories/AlertaRepositoryImpl';
import { AuthRepositoryImpl } from '../repositories/AuthRepositoryImpl';
import { CatalogoRepositoryImpl } from '../repositories/CatalogoRepositoryImpl';
import { PerfilRepositoryImpl } from '../repositories/PerfilRepositoryImpl';
import { ServicioRepositoryImpl } from '../repositories/ServicioRepositoryImpl';
import { VehiculoRepositoryImpl } from '../repositories/VehiculoRepositoryImpl';

// ============================================================
//  ARMADO DE LA APLICACION (inyeccion de dependencias)
// ------------------------------------------------------------
//  Aqui, y solo aqui, se decide que implementacion concreta usa
//  cada contrato del dominio. Los ViewModels piden casos de uso;
//  no saben si por debajo hay HTTP, una base local o datos falsos.
//  Para probar sin servidor bastaria con cambiar estas lineas.
// ============================================================

// --- Fuentes de datos ---
const authApi = new AuthApiSource(httpClient);
const transporteApi = new TransporteApiSource(httpClient);
const sessionStorage = new SessionStorage();

// --- Repositorios (implementan los contratos del dominio) ---
const authRepository = new AuthRepositoryImpl(authApi, sessionStorage, httpClient);
const servicioRepository = new ServicioRepositoryImpl(transporteApi);
const vehiculoRepository = new VehiculoRepositoryImpl(transporteApi);
const alertaRepository = new AlertaRepositoryImpl(transporteApi);
const catalogoRepository = new CatalogoRepositoryImpl(transporteApi);
const adminRepository = new AdminRepositoryImpl(transporteApi);
const perfilRepository = new PerfilRepositoryImpl(new PerfilApiSource(httpClient));
const tablaRepository = new TablaRepositoryImpl(new TablaApiSource(httpClient));

// --- Casos de uso: lo unico que consume la capa de presentacion ---
export const casosDeUso = {
  iniciarSesion: new IniciarSesion(authRepository),
  registrarCuenta: new RegistrarCuenta(authRepository),
  restaurarSesion: new RestaurarSesion(authRepository),
  cerrarSesion: new CerrarSesion(authRepository),
  listarServicios: new ListarServicios(servicioRepository),
  actualizarEstadoServicio: new ActualizarEstadoServicio(servicioRepository),
  obtenerVehiculos: new ObtenerVehiculos(vehiculoRepository),
  reportarEstadoVehiculo: new ReportarEstadoVehiculo(vehiculoRepository),
  listarAlertas: new ListarAlertas(alertaRepository),
  cargarCatalogos: new CargarCatalogos(catalogoRepository),

  // --- Foto de perfil (cualquier rol, siempre la propia) ---
  obtenerFotoPerfil: new ObtenerFotoPerfil(perfilRepository),
  guardarFotoPerfil: new GuardarFotoPerfil(perfilRepository),
  quitarFotoPerfil: new QuitarFotoPerfil(perfilRepository),

  // --- Administrador ---
  obtenerResumenAdmin: new ObtenerResumenAdmin(
    adminRepository,
    servicioRepository,
    vehiculoRepository,
    alertaRepository,
    catalogoRepository
  ),
  listarCuentas: new ListarCuentas(adminRepository),
  gestionarCuenta: new GestionarCuenta(adminRepository),
  listarConductores: new ListarConductores(adminRepository),
  crearServicio: new CrearServicio(servicioRepository),
  editarServicio: new EditarServicio(servicioRepository),
  crearAlerta: new CrearAlerta(alertaRepository),
  resolverAlerta: new ResolverAlerta(alertaRepository),

  // --- Administracion generica de tablas (solo administrador) ---
  // Una sola pantalla sirve para las 15 tablas, guiada por la
  // configuracion de Domain/entities/Tabla.ts.
  listarFilas: new ListarFilas(tablaRepository),
  guardarFila: new GuardarFila(tablaRepository),
  eliminarFila: new EliminarFila(tablaRepository),
  cargarReferencias: new CargarReferencias(tablaRepository),
  validarRegistro: new ValidarRegistro()
};

/** Se llama al cerrar sesion para que no queden datos del usuario anterior. */
export const limpiarCaches = (): void => catalogoRepository.limpiar();

export type CasosDeUso = typeof casosDeUso;

/** Acceso a la galeria y a la camara del telefono. */
export const selectorImagen = new SelectorImagen();

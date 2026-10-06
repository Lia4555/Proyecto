import { useCallback, useEffect, useMemo, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import {
  Catalogos,
  ErrorValidacion,
  NuevaAlerta,
  NuevoServicio,
  Servicio,
  TIPOS_SERVICIO,
  nombreEstado
} from '../../Domain/entities';
import { aFechaISO, aTextoFecha, leerFecha, leerFechaHora } from '../theme';

// ============================================================
//  VIEWMODELS de los formularios del administrador.
//  Guardan lo que se escribe como texto, lo convierten al modelo del
//  dominio y dejan que el caso de uso decida si es valido.
// ============================================================

const mensaje = (e: unknown, porDefecto: string) => (e instanceof Error ? e.message : porDefecto);

// ------------------------------------------------ Detalle y edicion de servicio
export const useAdminServicioDetalleViewModel = (idServicio: number, catalogos: Catalogos) => {
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [idEstado, setIdEstado] = useState<number | null>(null);
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');

  const rellenar = (s: Servicio) => {
    setServicio(s);
    setIdEstado(s.id_estado);
    setIdConductor(s.id_conductor);
    setIdVehiculo(s.id_vehiculo);
    setObservaciones(s.observaciones ?? '');
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const todos = await casosDeUso.listarServicios.ejecutar();
      const encontrado = todos.find((s) => s.id_servicio === idServicio);
      if (encontrado) rellenar(encontrado);
      else setError('Este servicio ya no existe.');
    } catch (e) {
      setError(mensaje(e, 'No se pudo cargar el servicio.'));
    } finally {
      setCargando(false);
    }
  }, [idServicio]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hayCambios =
    !!servicio &&
    (idEstado !== servicio.id_estado ||
      idConductor !== servicio.id_conductor ||
      idVehiculo !== servicio.id_vehiculo ||
      observaciones.trim() !== (servicio.observaciones ?? '').trim());

  const guardar = useCallback(async () => {
    if (!servicio) return;
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      const actualizado = await casosDeUso.editarServicio.ejecutar(
        servicio,
        {
          id_estado: idEstado ?? undefined,
          id_conductor: idConductor ?? undefined,
          id_vehiculo: idVehiculo ?? undefined,
          observaciones
        },
        // Finalizar (no cancelar) sella la hora real de llegada.
        { cierraViaje: /final|complet|termin/i.test(nombreEstado(catalogos, idEstado ?? 0)) }
      );
      rellenar(actualizado);
      setAviso('Cambios guardados. El conductor los verá al actualizar su app.');
    } catch (e) {
      setError(mensaje(e, 'No se pudieron guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  }, [servicio, idEstado, idConductor, idVehiculo, observaciones, catalogos]);

  return {
    servicio,
    cargando,
    guardando,
    error,
    aviso,
    hayCambios,
    idEstado,
    setIdEstado,
    idConductor,
    setIdConductor,
    idVehiculo,
    setIdVehiculo,
    observaciones,
    setObservaciones,
    guardar,
    reintentar: cargar
  };
};

// ------------------------------------------------ Nuevo servicio
type CamposServicio = keyof NuevoServicio | 'fecha_salida_dia' | 'hora_salida' | 'fecha_llegada_dia' | 'hora_llegada';

/** Siguiente codigo "SVC-0021" a partir de los que ya existen. */
const siguienteCodigo = (servicios: Servicio[]): string => {
  const numeros = servicios
    .map((s) => /^SVC-(\d+)$/i.exec(s.codigo_servicio)?.[1])
    .filter(Boolean)
    .map(Number);
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1;
  return `SVC-${String(siguiente).padStart(4, '0')}`;
};

export const useNuevoServicioViewModel = (catalogos: Catalogos) => {
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const estadoInicial =
    catalogos.estados.find((e) => /program/i.test(e.nombre_estado)) ?? catalogos.estados[0];

  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_SERVICIO[0]);
  const [idOrigen, setIdOrigen] = useState<number | null>(null);
  const [idDestino, setIdDestino] = useState<number | null>(null);
  const [fechaSalida, setFechaSalida] = useState(aTextoFecha(manana));
  const [horaSalida, setHoraSalida] = useState('08:00');
  const [fechaLlegada, setFechaLlegada] = useState(aTextoFecha(manana));
  const [horaLlegada, setHoraLlegada] = useState('');
  const [pasajeros, setPasajeros] = useState('');
  const [precio, setPrecio] = useState('');
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [idEstado, setIdEstado] = useState<number | null>(estadoInicial?.id_estado ?? null);
  const [observaciones, setObservaciones] = useState('');

  const [errores, setErrores] = useState<Partial<Record<CamposServicio, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Sugiere el siguiente codigo en cuanto llegan los servicios existentes.
  useEffect(() => {
    let vigente = true;
    casosDeUso.listarServicios
      .ejecutar()
      .then((s) => vigente && setCodigo((actual) => actual || siguienteCodigo(s)))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  // Si los catalogos llegan despues, se elige el estado "Programado".
  useEffect(() => {
    if (idEstado === null && estadoInicial) setIdEstado(estadoInicial.id_estado);
  }, [estadoInicial, idEstado]);

  const limpiarError = (campo: CamposServicio) =>
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));

  const crear = useCallback(async (): Promise<boolean> => {
    setError(null);
    const salida = leerFechaHora(fechaSalida, horaSalida);
    const llegada = leerFechaHora(fechaLlegada, horaLlegada);
    const deTexto: Partial<Record<CamposServicio, string>> = {};
    if (!salida) {
      if (!leerFecha(fechaSalida)) deTexto.fecha_salida_dia = 'Fecha DD/MM/AAAA.';
      else deTexto.hora_salida = 'Hora HH:MM (24 h).';
    }
    if (!llegada) {
      if (!leerFecha(fechaLlegada)) deTexto.fecha_llegada_dia = 'Fecha DD/MM/AAAA.';
      else deTexto.hora_llegada = 'Hora HH:MM (24 h).';
    }

    const nuevo: Partial<NuevoServicio> = {
      codigo_servicio: codigo,
      tipo_servicio: tipo,
      id_origen: idOrigen ?? undefined,
      id_destino: idDestino ?? undefined,
      fecha_salida: salida?.toISOString(),
      fecha_llegada_estimada: llegada?.toISOString(),
      numero_pasajeros: pasajeros ? Number(pasajeros) : undefined,
      precio_total: precio ? Number(precio) : undefined,
      id_conductor: idConductor ?? undefined,
      id_vehiculo: idVehiculo ?? undefined,
      id_estado: idEstado ?? undefined,
      observaciones
    };

    const delDominio = casosDeUso.crearServicio.validar(nuevo);
    // Los errores de fecha se muestran bajo el campo de texto que corresponde.
    if (deTexto.fecha_salida_dia || deTexto.hora_salida) delete delDominio.fecha_salida;
    if (deTexto.fecha_llegada_dia || deTexto.hora_llegada) delete delDominio.fecha_llegada_estimada;
    const todos = { ...delDominio, ...deTexto };
    setErrores(todos);
    if (Object.keys(todos).length > 0) {
      setError('Revisa los campos marcados.');
      return false;
    }

    setGuardando(true);
    try {
      await casosDeUso.crearServicio.ejecutar(nuevo);
      return true;
    } catch (e) {
      if (e instanceof ErrorValidacion) setErrores(e.campos as Partial<Record<CamposServicio, string>>);
      setError(mensaje(e, 'No se pudo crear el servicio.'));
      return false;
    } finally {
      setGuardando(false);
    }
  }, [codigo, tipo, idOrigen, idDestino, fechaSalida, horaSalida, fechaLlegada, horaLlegada, pasajeros, precio, idConductor, idVehiculo, idEstado, observaciones]);

  return {
    valores: {
      codigo, tipo, idOrigen, idDestino, fechaSalida, horaSalida, fechaLlegada, horaLlegada,
      pasajeros, precio, idConductor, idVehiculo, idEstado, observaciones
    },
    set: {
      codigo: (v: string) => { setCodigo(v); limpiarError('codigo_servicio'); },
      tipo: (v: string) => setTipo(v),
      idOrigen: (v: number) => { setIdOrigen(v); limpiarError('id_origen'); },
      idDestino: (v: number) => { setIdDestino(v); limpiarError('id_destino'); },
      fechaSalida: (v: string) => { setFechaSalida(v); limpiarError('fecha_salida_dia'); },
      horaSalida: (v: string) => { setHoraSalida(v); limpiarError('hora_salida'); },
      fechaLlegada: (v: string) => { setFechaLlegada(v); limpiarError('fecha_llegada_dia'); limpiarError('fecha_llegada_estimada'); },
      horaLlegada: (v: string) => { setHoraLlegada(v); limpiarError('hora_llegada'); limpiarError('fecha_llegada_estimada'); },
      pasajeros: (v: string) => { setPasajeros(v.replace(/\D/g, '')); limpiarError('numero_pasajeros'); },
      precio: (v: string) => { setPrecio(v.replace(/\D/g, '')); limpiarError('precio_total'); },
      idConductor: (v: string) => { setIdConductor(v); limpiarError('id_conductor'); },
      idVehiculo: (v: number) => { setIdVehiculo(v); limpiarError('id_vehiculo'); },
      idEstado: (v: number) => setIdEstado(v),
      observaciones: setObservaciones
    },
    errores,
    error,
    guardando,
    crear
  };
};

// ------------------------------------------------ Nueva alerta
export const useNuevaAlertaViewModel = (catalogos: Catalogos) => {
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [idTipo, setIdTipo] = useState<number | null>(null);
  const [prioridad, setPrioridad] = useState<number>(3);
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [errores, setErrores] = useState<Partial<Record<keyof NuevaAlerta, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const tipoElegido = useMemo(
    () => catalogos.tiposAlerta.find((t) => t.id_tipo_alerta === idTipo),
    [catalogos.tiposAlerta, idTipo]
  );

  const elegirTipo = (id: number) => {
    setIdTipo(id);
    setErrores((e) => ({ ...e, id_tipo_alerta: undefined }));
    // La prioridad por defecto es la del tipo (el catalogo va de 1 a 5).
    const nivel = catalogos.tiposAlerta.find((t) => t.id_tipo_alerta === id)?.nivel_prioridad;
    if (nivel) setPrioridad(Math.min(5, Math.max(1, nivel)));
  };

  const crear = useCallback(async (): Promise<boolean> => {
    setError(null);
    let limite: string | undefined;
    const erroresFecha: Partial<Record<keyof NuevaAlerta, string>> = {};
    if (fechaLimite.trim()) {
      const f = leerFecha(fechaLimite);
      if (!f) erroresFecha.fecha_limite = 'Fecha DD/MM/AAAA, o déjala vacía.';
      else limite = aFechaISO(f);
    }

    const nueva: Partial<NuevaAlerta> = {
      id_usuario_destino: idConductor ?? undefined,
      id_tipo_alerta: idTipo ?? undefined,
      tipo_alerta: tipoElegido?.nombre_tipo,
      prioridad,
      descripcion,
      fecha_limite: limite,
      estado_resuelta: false
    };

    const todos = { ...casosDeUso.crearAlerta.validar(nueva), ...erroresFecha };
    setErrores(todos);
    if (Object.keys(todos).length > 0) {
      setError('Revisa los campos marcados.');
      return false;
    }

    setGuardando(true);
    try {
      await casosDeUso.crearAlerta.ejecutar(nueva);
      return true;
    } catch (e) {
      setError(mensaje(e, 'No se pudo enviar la alerta.'));
      return false;
    } finally {
      setGuardando(false);
    }
  }, [idConductor, idTipo, tipoElegido, prioridad, descripcion, fechaLimite]);

  return {
    idConductor,
    setIdConductor: (v: string) => {
      setIdConductor(v);
      setErrores((e) => ({ ...e, id_usuario_destino: undefined }));
    },
    idTipo,
    elegirTipo,
    prioridad,
    setPrioridad,
    descripcion,
    setDescripcion: (v: string) => {
      setDescripcion(v);
      setErrores((e) => ({ ...e, descripcion: undefined }));
    },
    fechaLimite,
    setFechaLimite: (v: string) => {
      setFechaLimite(v);
      setErrores((e) => ({ ...e, fecha_limite: undefined }));
    },
    errores,
    error,
    guardando,
    crear
  };
};

import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { BarraNavegacion, BarraSuperior, PESTANAS_ADMIN, PESTANAS_CONDUCTOR } from '../components';
import {
  useAlertasViewModel,
  useCatalogos,
  useCuentasViewModel,
  useFlota,
  useFotoPerfil,
  useNavegacion,
  useSesion
} from '../hooks';
import { Usuario } from '../../Domain/entities';
import { colors } from '../theme';
import {
  AdminAlertasView,
  AdminServicioDetalleView,
  AdminServiciosView,
  CuentasView,
  GestionView,
  NuevaAlertaView,
  NuevoServicioView,
  ResumenAdminView
} from './admin';
import { AlertasView } from './AlertasView';
import { ArranqueView } from './ArranqueView';
import { InicioView } from './InicioView';
import { LoginView } from './LoginView';
import { PerfilView } from './PerfilView';
import { RegistroView } from './RegistroView';
import { ServicioDetalleView } from './ServicioDetalleView';
import { ServiciosView } from './ServiciosView';
import { VehiculoView } from './VehiculoView';

/**
 * VISTA RAIZ. Decide que se ve, con el mismo recorrido que el web:
 *   1. arranque   -> mientras se revisa la sesion guardada
 *   2. sin sesion -> pagina principal, y desde ahi el login
 *   3. con sesion -> panel con pestañas; la portada sigue a un toque
 */
type PantallaPublica = 'inicio' | 'entrar' | 'registro';

export const PrincipalView = () => {
  const { usuario, iniciando, esAdmin } = useSesion();
  const [publica, setPublica] = useState<PantallaPublica>('inicio');
  const [verPortada, setVerPortada] = useState(false);

  // Al entrar o al salir se limpia la pantalla publica en la que se estaba:
  // tras cerrar sesion se vuelve a la portada, no al formulario.
  useEffect(() => {
    setPublica('inicio');
    setVerPortada(false);
  }, [usuario]);

  // Boton "atras" de Android: del registro vuelve al login, del login a la
  // portada, y de la portada (con sesion) al panel, en vez de cerrar la app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!usuario && publica !== 'inicio') {
        setPublica(publica === 'registro' ? 'entrar' : 'inicio');
        return true;
      }
      if (usuario && verPortada) {
        setVerPortada(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [usuario, publica, verPortada]);

  if (iniciando) return <ArranqueView />;

  if (!usuario) {
    if (publica === 'registro') {
      return (
        <RegistroView onVolver={() => setPublica('inicio')} onIrALogin={() => setPublica('entrar')} />
      );
    }
    return publica === 'entrar' ? (
      <LoginView onVolver={() => setPublica('inicio')} onCrearCuenta={() => setPublica('registro')} />
    ) : (
      <InicioView onIngresar={() => setPublica('entrar')} />
    );
  }

  if (verPortada) {
    return <InicioView conSesion onIngresar={() => setVerPortada(false)} />;
  }

  return (
    <AplicacionConSesion
      usuario={usuario}
      esAdmin={esAdmin}
      onPortada={() => setVerPortada(true)}
    />
  );
};

const iniciales = (usuario: Usuario): string => {
  const partes = [usuario.nombre, usuario.apellido].filter(Boolean) as string[];
  const base = partes.length ? partes : [usuario.correo];
  return base
    .map((p) => p.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

type Navegacion = ReturnType<typeof useNavegacion>;

/** Boton "atras" de Android dentro del panel: cierra lo de encima y luego vuelve a la pestaña inicial. */
const useAtrasEnPanel = (nav: Navegacion) => {
  const { pestana, servicioAbierto, formulario, inicial, irA, volver } = nav;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (formulario || servicioAbierto !== null) {
        volver();
        return true;
      }
      if (pestana !== inicial) {
        irA(inicial);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pestana, servicioAbierto, formulario, inicial, irA, volver]);
};

/**
 * Se separa en su propio componente para que los ViewModels solo se monten
 * cuando ya hay sesion: si se llamaran antes, cada peticion moriria con un 401.
 * El administrador y el conductor tienen paneles distintos.
 */
const AplicacionConSesion = ({
  usuario,
  esAdmin,
  onPortada
}: {
  usuario: Usuario;
  esAdmin: boolean;
  onPortada: () => void;
}) =>
  esAdmin ? (
    <PanelAdministrador usuario={usuario} onPortada={onPortada} />
  ) : (
    <PanelConductor usuario={usuario} onPortada={onPortada} />
  );

// ------------------------------------------------------------------ Conductor
const PanelConductor = ({ usuario, onPortada }: { usuario: Usuario; onPortada: () => void }) => {
  const foto = useFotoPerfil(usuario.id_usuario);
  const navegacion = useNavegacion('servicios');
  const { catalogos } = useCatalogos();
  const alertas = useAlertasViewModel();
  const { pestana, servicioAbierto, irA, volver } = navegacion;
  useAtrasEnPanel(navegacion);

  const contenido = () => {
    // El detalle se abre encima de la pestaña de servicios.
    if (servicioAbierto !== null) {
      return (
        <ServicioDetalleView idServicio={servicioAbierto} catalogos={catalogos} onVolver={volver} soloLectura={false} />
      );
    }

    switch (pestana) {
      case 'vehiculo':
        return <VehiculoView soloLectura={false} />;
      case 'alertas':
        return <AlertasView vm={alertas} />;
      case 'perfil':
        return <PerfilView />;
      default:
        return (
          <ServiciosView
            catalogos={catalogos}
            onAbrirServicio={navegacion.abrirServicio}
            nombreUsuario={usuario.nombre ?? usuario.correo}
          />
        );
    }
  };

  return (
    <View style={estilos.fondo}>
      <BarraSuperior
        subtitulo="Panel del conductor"
        iniciales={iniciales(usuario)}
        foto={foto}
        onInicio={onPortada}
        onPerfil={() => irA('perfil')}
      />
      <View style={estilos.contenido}>{contenido()}</View>
      <BarraNavegacion
        pestanas={PESTANAS_CONDUCTOR}
        activa={pestana}
        onCambiar={irA}
        avisos={{ alertas: alertas.pendientes }}
      />
    </View>
  );
};

// -------------------------------------------------------------- Administrador
const PanelAdministrador = ({ usuario, onPortada }: { usuario: Usuario; onPortada: () => void }) => {
  const foto = useFotoPerfil(usuario.id_usuario);
  const navegacion = useNavegacion('resumen');
  const { catalogos } = useCatalogos();
  // Viven aqui (y no en cada pestaña) porque alimentan el contador de la
  // barra inferior y los selectores de varios formularios.
  const cuentas = useCuentasViewModel();
  const flota = useFlota();
  const { pestana, servicioAbierto, formulario, filtro, irA, volver, abrirServicio, abrirFormulario } = navegacion;
  useAtrasEnPanel(navegacion);

  const contenido = () => {
    if (formulario === 'nuevo-servicio') {
      return (
        <NuevoServicioView
          catalogos={catalogos}
          flota={flota}
          onCerrar={volver}
          onCreado={() => irA('servicios')}
        />
      );
    }
    if (formulario === 'nueva-alerta') {
      return (
        <NuevaAlertaView catalogos={catalogos} flota={flota} onCerrar={volver} onCreada={() => irA('alertas')} />
      );
    }
    if (servicioAbierto !== null) {
      return (
        <AdminServicioDetalleView idServicio={servicioAbierto} catalogos={catalogos} flota={flota} onVolver={volver} />
      );
    }

    switch (pestana) {
      case 'servicios':
        return (
          <AdminServiciosView
            catalogos={catalogos}
            flota={flota}
            filtroInicial={filtro}
            onAbrir={abrirServicio}
            onNuevo={() => abrirFormulario('nuevo-servicio')}
          />
        );
      case 'cuentas':
        return <CuentasView vm={cuentas} />;
      case 'gestion':
        // Acceso a TODAS las tablas. El servidor vuelve a comprobar el rol
        // en cada peticion: esconder la pestana no basta como seguridad.
        return <GestionView />;
      case 'alertas':
        return <AdminAlertasView flota={flota} onNueva={() => abrirFormulario('nueva-alerta')} />;
      case 'perfil':
        return <PerfilView />;
      default:
        return (
          <ResumenAdminView
            nombre={usuario.nombre ?? usuario.correo}
            onIr={irA}
            onNuevoServicio={() => abrirFormulario('nuevo-servicio')}
            onNuevaAlerta={() => abrirFormulario('nueva-alerta')}
          />
        );
    }
  };

  return (
    <View style={estilos.fondo}>
      <BarraSuperior
        subtitulo="Panel de administración"
        iniciales={iniciales(usuario)}
        foto={foto}
        onInicio={onPortada}
        onPerfil={() => irA('perfil')}
      />
      <View style={estilos.contenido}>{contenido()}</View>
      <BarraNavegacion
        pestanas={PESTANAS_ADMIN}
        activa={pestana}
        onCambiar={(p) => {
          // Al volver a Cuentas se refresca: puede haber solicitudes nuevas.
          if (p === 'cuentas') cuentas.refrescar();
          irA(p);
        }}
        avisos={{ cuentas: cuentas.pendientes }}
      />
    </View>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.papel },
  contenido: { flex: 1 }
});

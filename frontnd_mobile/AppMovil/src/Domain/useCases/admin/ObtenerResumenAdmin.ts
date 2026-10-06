import { ResumenAdmin, estaCerrado, nombreEstado, vaConRetraso } from '../../entities';
import {
  AdminRepository,
  AlertaRepository,
  CatalogoRepository,
  ServicioRepository,
  VehiculoRepository
} from '../../repositories';

const DIA_MS = 24 * 60 * 60 * 1000;

// "2026-10-04" como fecha LOCAL (Date.parse la tomaria en UTC).
const fechaLocal = (iso: string): number => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : Date.parse(iso);
};

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// CASO DE USO: lo que el administrador necesita atender hoy, calculado a
// partir de las mismas listas del panel web. Todo se pide en paralelo.
export class ObtenerResumenAdmin {
  constructor(
    private readonly admin: AdminRepository,
    private readonly servicios: ServicioRepository,
    private readonly vehiculos: VehiculoRepository,
    private readonly alertas: AlertaRepository,
    private readonly catalogos: CatalogoRepository
  ) {}

  async ejecutar(ahora = new Date()): Promise<ResumenAdmin> {
    const [cuentas, servicios, vehiculos, documentos, alertas, catalogos] = await Promise.all([
      this.admin.cuentas(),
      this.servicios.listar(),
      this.vehiculos.listar(),
      this.vehiculos.documentos(),
      this.alertas.listar(),
      this.catalogos.cargar()
    ]);

    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const estado = (id: number) => nombreEstado(catalogos, id);
    const abiertos = servicios.filter((s) => !estaCerrado(estado(s.id_estado)));

    return {
      cuentasPendientes: cuentas.filter((c) => c.estado === 'pendiente').length,
      serviciosHoy: servicios.filter((s) => mismoDia(new Date(s.fecha_salida), ahora)).length,
      serviciosEnCurso: abiertos.filter((s) => /curso|ruta|transito|tránsito/i.test(estado(s.id_estado))).length,
      serviciosRetrasados: abiertos.filter(vaConRetraso).length,
      vehiculosFueraDeServicio: vehiculos.filter((v) => !v.estado_operativo).length,
      documentosVencidos: documentos.filter((d) => fechaLocal(d.fecha_vencimiento) < hoy).length,
      documentosPorVencer: documentos.filter((d) => {
        const vence = fechaLocal(d.fecha_vencimiento);
        return vence >= hoy && vence <= hoy + 30 * DIA_MS;
      }).length,
      alertasSinResolver: alertas.filter((a) => !a.estado_resuelta).length
    };
  }
}

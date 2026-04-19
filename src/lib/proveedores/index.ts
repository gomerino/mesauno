export {
  PROVEEDOR_CATEGORIAS,
  PROVEEDOR_REGIONES,
  CAP_SOLICITUDES_MES_FREE,
  CAP_MEDIOS_FREE,
  CAP_SOLICITUDES_DIA_POR_REMITENTE,
  labelCategoria,
  labelRegion,
  esCategoriaProveedor,
} from "./constants";

export { slugify, asegurarSlugUnico } from "./slug";

export {
  listarTarjetasMarketplace,
  obtenerProveedorPorSlug,
  obtenerProveedorPropio,
  slugExiste,
  type FiltrosListado,
} from "./queries";

export {
  crearSolicitud,
  CrearSolicitudError,
  listarSolicitudesRecibidasProveedor,
  type CrearSolicitudInput,
  type CrearSolicitudErrorCode,
  type CrearSolicitudResult,
} from "./solicitudes";

export {
  listarServiciosProveedorPropio,
  crearServicioProveedorPropio,
  actualizarServicioProveedorPropio,
  eliminarServicioProveedorPropio,
  ServicioProveedorError,
  type CrearServicioProveedorInput,
  type ActualizarServicioProveedorInput,
} from "./servicios-crud";

export {
  agregarFavorito,
  eliminarFavorito,
  listarFavoritosPorEvento,
  type AgregarFavoritoInput,
  type AgregarFavoritoResult,
} from "./favoritos";

export {
  registrarProveedor,
  RegistroProveedorError,
  type RegistroProveedorInput,
  type RegistroProveedorErrorCode,
  type RegistroProveedorResult,
} from "./registro";

export {
  actualizarProveedorPropio,
  ActualizarProveedorError,
  type ActualizarProveedorInput,
} from "./actualizar";

export {
  subirMedioProveedor,
  eliminarMedioProveedor,
  reordenarMediosProveedor,
  SubirMedioError,
  type SubirMedioInput,
  type SubirMedioResult,
} from "./medios";

export {
  listarProveedoresAdmin,
  aprobarProveedor,
  suspenderProveedor,
  parseMotivoSuspension,
  esMotivoSuspension,
  MOTIVOS_SUSPENSION,
  type MotivoSuspension,
  type AdminProveedorListaItem,
} from "./admin";

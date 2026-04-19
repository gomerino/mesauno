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
  type CrearSolicitudInput,
  type CrearSolicitudErrorCode,
  type CrearSolicitudResult,
} from "./solicitudes";

export {
  agregarFavorito,
  eliminarFavorito,
  listarFavoritosPorEvento,
  type AgregarFavoritoInput,
  type AgregarFavoritoResult,
} from "./favoritos";

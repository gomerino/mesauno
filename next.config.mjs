/** @type {import('next').NextConfig} */
function buildImageRemotePatterns() {
  const patterns = [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
      pathname: "/**",
    },
  ];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      const u = new URL(raw);
      patterns.push({
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        pathname: "/storage/v1/object/public/**",
      });
    } catch {
      // ignorar URL inválida
    }
  }
  return patterns;
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  async redirects() {
    return [
      { source: "/panel/overview", destination: "/panel", permanent: true },
      { source: "/panel/evento", destination: "/panel/viaje", permanent: true },
      { source: "/panel/evento/:path*", destination: "/panel/viaje/:path*", permanent: true },
      { source: "/panel/invitados", destination: "/panel/pasajeros", permanent: true },
      { source: "/panel/invitados/:path*", destination: "/panel/pasajeros/:path*", permanent: true },
      { source: "/panel/equipo", destination: "/panel/ajustes", permanent: true },
      { source: "/panel/equipo/:path*", destination: "/panel/ajustes/:path*", permanent: true },
      { source: "/panel/programa", destination: "/panel/viaje/programa", permanent: true },
      { source: "/panel/invitacion", destination: "/panel/pasajeros/envios", permanent: true },
      { source: "/panel/experiencia", destination: "/panel/viaje", permanent: true },
      { source: "/dashboard", destination: "/panel", permanent: true },
      {
        source: "/dashboard/:evento_id/programa",
        destination: "/panel/viaje/programa",
        permanent: true,
      },
      {
        source: "/dashboard/:evento_id/equipo",
        destination: "/panel/ajustes",
        permanent: true,
      },
      {
        source: "/dashboard/:evento_id/pago/success",
        destination: "/panel/finanzas?pago=exitoso",
        permanent: false,
      },
      {
        source: "/dashboard/:evento_id/pago/pending",
        destination: "/panel/finanzas?pago=pendiente",
        permanent: false,
      },
      {
        source: "/dashboard/:evento_id/pago/failure",
        destination: "/panel/finanzas?pago=fallido",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/invitacion/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

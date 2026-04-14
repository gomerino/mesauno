/** @type {import('next').NextConfig} */
function buildImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [
      {
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/panel/overview", permanent: true },
      {
        source: "/dashboard/:evento_id/programa",
        destination: "/panel/programa",
        permanent: true,
      },
      {
        source: "/dashboard/:evento_id/equipo",
        destination: "/panel/equipo",
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

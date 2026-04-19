"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PROVEEDOR_CATEGORIAS,
  PROVEEDOR_REGIONES,
} from "@/lib/proveedores/constants";
import {
  guardarDraftRegistro,
  leerDraftRegistro,
  limpiarDraftRegistro,
  type DraftRegistro,
} from "@/lib/proveedores/draft-registro";
import { trackEvent } from "@/lib/analytics";

type Step = 1 | 2 | 3;

type FormState = {
  email: string;
  password: string;
  passwordConfirm: string;
  nombreNegocio: string;
  categoriaPrincipal: string;
  region: string;
  ciudad: string;
  eslogan: string;
  biografia: string;
  whatsapp: string;
  instagram: string;
  sitioWeb: string;
};

const INITIAL: FormState = {
  email: "",
  password: "",
  passwordConfirm: "",
  nombreNegocio: "",
  categoriaPrincipal: "",
  region: "",
  ciudad: "",
  eslogan: "",
  biografia: "",
  whatsapp: "",
  instagram: "",
  sitioWeb: "",
};

export function RegistroProveedorFlow({
  userEmail,
}: {
  userEmail: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fotos, setFotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{
    slug: string;
    nombreNegocio: string;
  } | null>(null);
  const stepStartRef = useRef<number>(Date.now());

  useEffect(() => {
    trackEvent("provider_landing_viewed");
  }, []);

  useEffect(() => {
    trackEvent("provider_registration_started");
    const draft = leerDraftRegistro();
    if (draft) {
      setForm((f) => ({
        ...f,
        email: draft.email ?? "",
        nombreNegocio: draft.nombreNegocio ?? "",
        categoriaPrincipal: draft.categoriaPrincipal ?? "",
        region: draft.region ?? "",
        ciudad: draft.ciudad ?? "",
        eslogan: draft.eslogan ?? "",
        biografia: draft.biografia ?? "",
        whatsapp: draft.whatsapp ?? "",
        instagram: draft.instagram ?? "",
        sitioWeb: draft.sitioWeb ?? "",
      }));
      setStep(draft.step ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (completed) return;
    const draft: DraftRegistro = {
      step,
      email: form.email,
      nombreNegocio: form.nombreNegocio,
      categoriaPrincipal: form.categoriaPrincipal,
      region: form.region,
      ciudad: form.ciudad,
      eslogan: form.eslogan,
      biografia: form.biografia,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      sitioWeb: form.sitioWeb,
    };
    guardarDraftRegistro(draft);
  }, [form, step, completed]);

  useEffect(() => {
    const onUnload = () => {
      if (completed) return;
      try {
        const payload = JSON.stringify({
          event: "provider_registration_abandoned",
          last_step: step,
        });
        navigator.sendBeacon?.(
          "/api/analytics/beacon",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        // noop
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [step, completed]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validarPaso1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "El correo no parece válido.";
    }
    if (form.password.length < 8) {
      errs.password = "Mínimo 8 caracteres.";
    }
    if (form.password !== form.passwordConfirm) {
      errs.passwordConfirm = "Las contraseñas no coinciden.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validarPaso2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.nombreNegocio.trim().length < 2) {
      errs.nombreNegocio = "Cuéntanos el nombre del negocio.";
    }
    if (!form.categoriaPrincipal) {
      errs.categoriaPrincipal = "Selecciona una categoría.";
    }
    if (!form.region) {
      errs.region = "Selecciona tu región.";
    }
    if (form.eslogan.length > 120) {
      errs.eslogan = "El eslogan debe ser corto (máx. 120).";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validarPaso3 = (): boolean => {
    const errs: Record<string, string> = {};
    const wa = form.whatsapp.trim();
    if (wa && !/^\+[1-9]\d{7,14}$/.test(wa)) {
      errs.whatsapp =
        "Debe empezar con + y el código de país (ej.: +56912345678).";
    }
    if (!wa && !form.instagram.trim() && !form.sitioWeb.trim()) {
      errs.whatsapp =
        "Deja al menos un canal de contacto (WhatsApp, Instagram o sitio web).";
    }
    if (fotos.length === 0) {
      errs.fotos = "Sube al menos 1 foto de tus trabajos.";
    }
    if (fotos.length > 6) {
      errs.fotos = "En plan Free puedes subir hasta 6 fotos.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const avanzar = useCallback(() => {
    const ok =
      step === 1 ? validarPaso1() : step === 2 ? validarPaso2() : validarPaso3();
    if (!ok) return;

    const durationMs = Date.now() - stepStartRef.current;
    trackEvent("provider_registration_step_completed", {
      step,
      duration_ms: durationMs,
    });

    if (step === 3) {
      void enviar();
      return;
    }
    const next = (step + 1) as Step;
    setStep(next);
    stepStartRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form, fotos]);

  const retroceder = () => {
    if (step === 1) return;
    setStep((s) => (s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enviar = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/proveedores/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          nombreNegocio: form.nombreNegocio.trim(),
          categoriaPrincipal: form.categoriaPrincipal,
          region: form.region,
          ciudad: form.ciudad.trim() || null,
          eslogan: form.eslogan.trim() || null,
          biografia: form.biografia.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          sitioWeb: form.sitioWeb.trim() || null,
        }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        proveedor?: { slug: string; nombre_negocio: string };
        error?: string;
      };

      if (!res.ok || !json.ok || !json.proveedor) {
        throw new Error(json.error || "No pudimos completar el registro.");
      }

      const slug = json.proveedor.slug;
      const nombreNegocio = json.proveedor.nombre_negocio;

      // Subir fotos secuencialmente (best-effort; errores individuales se ignoran visualmente).
      let subidasOk = 0;
      for (const foto of fotos) {
        try {
          const fd = new FormData();
          fd.append("archivo", foto);
          const rr = await fetch("/api/proveedores/me/medios", {
            method: "POST",
            body: fd,
          });
          if (rr.ok) {
            subidasOk += 1;
            trackEvent("provider_media_uploaded", {
              size_kb: Math.round(foto.size / 1024),
              is_first: subidasOk === 1,
            });
          }
        } catch {
          // noop — seguimos con las siguientes
        }
      }

      trackEvent("provider_registration_completed", {
        primary_category: form.categoriaPrincipal,
        region: form.region,
        media_count: subidasOk,
      });

      limpiarDraftRegistro();
      setCompleted({ slug, nombreNegocio });
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error inesperado al registrar.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return <PantallaConfirmacion nombreNegocio={completed.nombreNegocio} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-8 md:pt-14">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/para-proveedores" className="text-sm text-slate-400 hover:text-white">
          ← Volver
        </Link>
        <p className="text-xs uppercase tracking-wider text-amber-200">
          Registro proveedor
        </p>
      </header>

      <StepperProgress step={step} />

      <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
        {step === 1 && (
          <PasoCuenta
            form={form}
            setField={setField}
            errors={errors}
            sesionPreviaEmail={userEmail}
          />
        )}
        {step === 2 && (
          <PasoNegocio form={form} setField={setField} errors={errors} />
        )}
        {step === 3 && (
          <PasoContactoVisual
            form={form}
            setField={setField}
            errors={errors}
            fotos={fotos}
            setFotos={setFotos}
          />
        )}

        {submitError && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {submitError}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={retroceder}
              className="text-sm text-slate-400 hover:text-white"
              disabled={submitting}
            >
              ← Atrás
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={avanzar}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {submitting
              ? "Guardando…"
              : step === 3
                ? "Terminar"
                : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepperProgress({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Cuenta" },
    { n: 2, label: "Negocio" },
    { n: 3, label: "Cómo te conocen" },
  ];
  return (
    <div>
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const isActive = s.n === step;
          const isPast = s.n < step;
          return (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  isActive
                    ? "bg-amber-300 text-slate-950 ring-4 ring-amber-300/20"
                    : isPast
                      ? "bg-amber-300/70 text-slate-950"
                      : "bg-slate-800 text-slate-400"
                }`}
              >
                {isPast ? "✓" : s.n}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${isPast ? "bg-amber-300/60" : "bg-slate-800"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {steps.map((s) => (
          <p
            key={s.n}
            className={
              s.n === step ? "font-semibold text-amber-200" : "text-slate-500"
            }
          >
            {s.label}
          </p>
        ))}
      </div>
    </div>
  );
}

type PasoProps = {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: Record<string, string>;
};

function PasoCuenta({
  form,
  setField,
  errors,
  sesionPreviaEmail,
}: PasoProps & { sesionPreviaEmail: string | null }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-slate-400">
          Con este correo gestionarás tu perfil y recibirás notificaciones.
        </p>
      </div>

      {sesionPreviaEmail && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Tienes una sesión activa como{" "}
          <strong className="font-semibold">{sesionPreviaEmail}</strong>. Estás
          creando una cuenta nueva como proveedor: al finalizar, se iniciará
          sesión con el correo que registres aquí.
        </div>
      )}

      <Field label="Correo electrónico" error={errors.email}>
        <input
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          className="input-jurnex"
          placeholder="hola@tuestudio.cl"
        />
      </Field>

      <Field label="Contraseña" error={errors.password}>
        <input
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          className="input-jurnex"
          placeholder="Mínimo 8 caracteres"
        />
      </Field>
      <Field label="Confirma tu contraseña" error={errors.passwordConfirm}>
        <input
          type="password"
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={(e) => setField("passwordConfirm", e.target.value)}
          className="input-jurnex"
        />
      </Field>
    </div>
  );
}

function PasoNegocio({ form, setField, errors }: PasoProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Sobre tu negocio</h2>
        <p className="mt-1 text-sm text-slate-400">
          Lo que ven las parejas al descubrir tu perfil.
        </p>
      </div>

      <Field label="Nombre del negocio" error={errors.nombreNegocio}>
        <input
          type="text"
          value={form.nombreNegocio}
          onChange={(e) => setField("nombreNegocio", e.target.value)}
          className="input-jurnex"
          placeholder="Studio Luz, DJ Aurora, Catering Pacha…"
          maxLength={80}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Categoría principal" error={errors.categoriaPrincipal}>
          <select
            value={form.categoriaPrincipal}
            onChange={(e) => setField("categoriaPrincipal", e.target.value)}
            className="input-jurnex"
          >
            <option value="">Elige una</option>
            {PROVEEDOR_CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Región" error={errors.region}>
          <select
            value={form.region}
            onChange={(e) => setField("region", e.target.value)}
            className="input-jurnex"
          >
            <option value="">Elige tu región</option>
            {PROVEEDOR_REGIONES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Ciudad" optional>
        <input
          type="text"
          value={form.ciudad}
          onChange={(e) => setField("ciudad", e.target.value)}
          className="input-jurnex"
          placeholder="Santiago, Viña del Mar…"
          maxLength={60}
        />
      </Field>

      <Field
        label="Eslogan corto"
        hint={`${form.eslogan.length}/120`}
        error={errors.eslogan}
        optional
      >
        <input
          type="text"
          value={form.eslogan}
          onChange={(e) => setField("eslogan", e.target.value)}
          className="input-jurnex"
          placeholder="Fotografía documental con alma"
          maxLength={120}
        />
      </Field>

      <Field label="Tu historia" optional>
        <textarea
          value={form.biografia}
          onChange={(e) => setField("biografia", e.target.value)}
          className="input-jurnex min-h-32 resize-y"
          placeholder="Cuéntanos qué te hace único. ¿Cuántos matrimonios has realizado? ¿Qué estilo te define?"
          maxLength={2000}
        />
      </Field>
    </div>
  );
}

function PasoContactoVisual({
  form,
  setField,
  errors,
  fotos,
  setFotos,
}: PasoProps & {
  fotos: File[];
  setFotos: (f: File[]) => void;
}) {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const combined = [...fotos, ...arr].slice(0, 6);
    setFotos(combined);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Cómo te conocen</h2>
        <p className="mt-1 text-sm text-slate-400">
          Contactos para que las parejas te escriban + tus mejores fotos.
        </p>
      </div>

      <Field
        label="WhatsApp"
        hint="Formato +56912345678"
        error={errors.whatsapp}
      >
        <input
          type="tel"
          value={form.whatsapp}
          onChange={(e) => setField("whatsapp", e.target.value)}
          className="input-jurnex"
          placeholder="+56912345678"
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Instagram" optional>
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-white/10 bg-slate-800 px-3 text-sm text-slate-400">
              @
            </span>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setField("instagram", e.target.value)}
              className="input-jurnex rounded-l-none"
              placeholder="tuestudio"
              maxLength={30}
            />
          </div>
        </Field>
        <Field label="Sitio web" optional>
          <input
            type="url"
            value={form.sitioWeb}
            onChange={(e) => setField("sitioWeb", e.target.value)}
            className="input-jurnex"
            placeholder="https://tuestudio.cl"
          />
        </Field>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-200">Tus mejores fotos</p>
        <p className="mt-1 text-xs text-slate-400">
          1 a 6 fotos en plan Free. La primera es la foto de portada. JPG, PNG o WebP · máx. 10 MB c/u.
        </p>

        {errors.fotos && (
          <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {errors.fotos}
          </p>
        )}

        {fotos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {fotos.map((f, idx) => (
              <PreviewFoto
                key={`${f.name}-${idx}`}
                file={f}
                esPortada={idx === 0}
                onRemove={() => setFotos(fotos.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        )}

        {fotos.length < 6 && (
          <button
            type="button"
            onClick={() => inputFileRef.current?.click()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-6 text-sm text-slate-300 transition hover:border-amber-300/50 hover:bg-amber-300/5"
          >
            <span className="text-2xl">📸</span>
            <span>
              {fotos.length === 0
                ? "Subir fotos"
                : `Agregar más (${6 - fotos.length} disponibles)`}
            </span>
          </button>
        )}
        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            onFilesSelected(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}

function PreviewFoto({
  file,
  esPortada,
  onRemove,
}: {
  file: File;
  esPortada: boolean;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      )}
      {esPortada && (
        <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold text-slate-950">
          PORTADA
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-slate-950/70 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
      >
        Quitar
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-slate-200">
        <span>
          {label}{" "}
          {optional && (
            <span className="text-xs font-normal text-slate-500">(opcional)</span>
          )}
        </span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </label>
  );
}

function PantallaConfirmacion({ nombreNegocio }: { nombreNegocio: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-300/15 text-4xl">
        ✈️
      </div>
      <h1 className="font-display text-3xl font-bold md:text-4xl">
        {nombreNegocio}, tu perfil está en revisión.
      </h1>
      <p className="mt-4 max-w-md text-slate-300">
        Te escribiremos al correo en un máximo de 48 horas con la aprobación.
        Mientras tanto puedes seguir editando tu perfil desde el panel.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/proveedor"
          className="inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Ir a mi panel
        </Link>
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-white/40 hover:bg-white/5"
        >
          Ver el marketplace
        </Link>
      </div>
    </div>
  );
}

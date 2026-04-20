"use client";

import { WhatsAppInviteButton } from "@/components/dashboard/WhatsAppInviteButton";
import type { Invitado } from "@/types/database";
import { Loader2, Mail, Pencil, Trash2 } from "lucide-react";
import { type ReactNode } from "react";

const pressableIcon =
  "transition-[transform,box-shadow] duration-150 ease-in-out hover:scale-[1.01] hover:shadow-[0_0_14px_rgba(212,175,55,0.14)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const tableIconBase =
  "transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

type Props = {
  row: Invitado;
  variant: "table" | "card";
  sendingId: string | null;
  deletingId: string | null;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
};

function ActionIconButton({
  title,
  ariaLabel,
  disabled,
  onClick,
  children,
  variant,
  className,
}: {
  title: string;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  variant: "table" | "card";
  className?: string;
}) {
  if (variant === "table") {
    return (
      <button
        type="button"
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        onClick={onClick}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 shadow-none ${tableIconBase} ${className ?? ""}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border shadow-sm ${pressableIcon} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function TableToolbar({
  row,
  token,
  sendingId,
  deletingId,
  onEdit,
  onDelete,
  onSendEmail,
  layout = "table",
}: {
  row: Invitado;
  token: string;
  sendingId: string | null;
  deletingId: string | null;
  onEdit: (row: Invitado) => void;
  onDelete: (id: string) => void;
  onSendEmail: (id: string) => void;
  layout?: "table" | "card";
}) {
  const iconSz = "h-4 w-4";
  const isTableLayout = layout === "table";
  const waCls = isTableLayout
    ? `${tableIconBase} !inline-flex !h-8 !w-8 !min-h-8 !min-w-8 !items-center !justify-center !rounded-md !border-0 !bg-transparent !p-0 !text-emerald-300 !shadow-none hover:!bg-white/[0.08] [&_svg]:!h-4 [&_svg]:!w-4 disabled:!cursor-not-allowed disabled:!opacity-50`
    : `${pressableIcon} !min-h-9 !min-w-9 !p-0 [&_svg]:!h-4 [&_svg]:!w-4 !border-white/15 !bg-white/[0.06] !text-sky-200 !shadow-none hover:!bg-white/10`;

  return (
    <div
      role="toolbar"
      aria-label={`Acciones para ${row.nombre_pasajero ?? "invitado"}`}
      className={
        isTableLayout
          ? "flex w-full shrink-0 flex-nowrap items-center justify-end gap-1"
          : "inline-flex max-w-full flex-wrap items-center justify-start gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1 transition-colors hover:bg-white/[0.06]"
      }
    >
      <ActionIconButton
        variant={isTableLayout ? "table" : "card"}
        title="Enviar invitación por correo"
        ariaLabel={
          sendingId === row.id ? "Enviando invitación por correo" : "Enviar invitación por correo"
        }
        disabled={sendingId === row.id}
        onClick={() => onSendEmail(row.id)}
        className={
          isTableLayout
            ? "text-sky-200"
            : "border-[#1e3a8a]/50 bg-[#172554]/50 text-sky-200 hover:bg-[#1e3a8a]/60"
        }
      >
        {sendingId === row.id ? (
          <Loader2 className={`${iconSz} animate-spin`} aria-hidden />
        ) : (
          <Mail className={iconSz} strokeWidth={2} aria-hidden />
        )}
      </ActionIconButton>
      <WhatsAppInviteButton
        nombreInvitado={row.nombre_pasajero ?? ""}
        telefono={row.telefono ?? ""}
        tokenAcceso={token}
        iconOnly
        className={waCls}
      />
      <ActionIconButton
        variant={isTableLayout ? "table" : "card"}
        title="Editar datos del invitado"
        ariaLabel="Editar datos del invitado"
        onClick={() => onEdit(row)}
        className={
          isTableLayout
            ? "text-[#E8D5A3]"
            : "border-white/12 bg-white/[0.06] text-[#E8D5A3] hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/10"
        }
      >
        <Pencil className={iconSz} strokeWidth={2} aria-hidden />
      </ActionIconButton>
      <ActionIconButton
        variant={isTableLayout ? "table" : "card"}
        title="Eliminar de la lista"
        ariaLabel="Eliminar de la lista"
        disabled={deletingId === row.id}
        onClick={() => onDelete(row.id)}
        className={
          isTableLayout
            ? "text-red-200"
            : "border-red-500/25 bg-red-950/25 text-red-200 hover:bg-red-950/40"
        }
      >
        {deletingId === row.id ? (
          <Loader2 className={`${iconSz} animate-spin`} aria-hidden />
        ) : (
          <Trash2 className={iconSz} strokeWidth={2} aria-hidden />
        )}
      </ActionIconButton>
    </div>
  );
}

export function InvitadosRowActionsMenu({
  row,
  variant,
  sendingId,
  deletingId,
  onEdit,
  onDelete,
  onSendEmail,
}: Props) {
  const token = String(row.token_acceso ?? row.id);
  const isTable = variant === "table";

  return isTable ? (
    <TableToolbar
      row={row}
      token={token}
      sendingId={sendingId}
      deletingId={deletingId}
      onEdit={onEdit}
      onDelete={onDelete}
      onSendEmail={onSendEmail}
      layout="table"
    />
  ) : (
    <div className="w-full">
      <TableToolbar
        row={row}
        token={token}
        sendingId={sendingId}
        deletingId={deletingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onSendEmail={onSendEmail}
        layout="card"
      />
    </div>
  );
}

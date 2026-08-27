"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tournament, TournamentTier } from "@/types/tournament";
import { subscribeToTournament, updateTournamentInDb, deleteTournamentFromDb } from "@/lib/db";
import { 
  Settings, 
  Sparkles, 
  Trash2, 
  Check, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  X,
  Building,
  ShieldAlert
} from "lucide-react";

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [adminEmailsStr, setAdminEmailsStr] = useState("");
  const [tier, setTier] = useState<TournamentTier>("amateur");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tournamentId) return;
    const unsub = subscribeToTournament(tournamentId, (t) => {
      if (t) {
        setTournament(t);
        setName(t.name);
        setOrg(t.organizationName || "");
        setAdminEmailsStr(t.adminEmails ? t.adminEmails.join(", ") : "");
        setTier(t.tier);
        setLogoUrl(t.logoUrl || "");
      }
    });
    return () => unsub();
  }, [tournamentId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (máx 2MB para base64 rápido)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Por favor sube un archivo menor a 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || !name.trim()) return;

    const cleanEmails = adminEmailsStr
      .split(/[,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes('@'));

    setIsSaving(true);
    await updateTournamentInDb(tournamentId, {
      name: name.trim(),
      organizationName: org.trim(),
      adminEmails: cleanEmails,
      tier,
      logoUrl: logoUrl.trim() || undefined,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este torneo y todos sus datos asociados? Esta acción no se puede deshacer.")) {
      await deleteTournamentFromDb(tournamentId);
      router.push("/");
    }
  };

  if (!tournament) return <div className="p-8 text-center text-zinc-500">Cargando configuración...</div>;

  return (
    <div className="space-y-8 max-w-3xl font-sans">
      {/* Header */}
      <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="text-orange-500" />
          <span>Configuración del Torneo</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Ajusta la identidad gráfica, parámetros generales y permisos del torneo.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* MÓDULO: LOGO DEL TORNEO */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={16} className="text-orange-500" />
                <span>Logo Oficial del Torneo</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Se mostrará en la barra lateral, en las transmisiones y en el portal público de fanáticos.
              </p>
            </div>

            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-1"
              >
                <X size={13} />
                <span>Remover Logo</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Preview del Logo */}
            <div className="relative w-24 h-24 rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo del Torneo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-2">
                  <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-1" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Sin Logo</span>
                </div>
              )}
            </div>

            {/* Controles de Subida */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700 shadow-sm"
                >
                  <Upload size={14} className="text-orange-400" />
                  <span>Subir Archivo de Imagen</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  O pega el enlace URL de la imagen:
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full pl-9 pr-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MÓDULO: INFORMACIÓN GENERAL */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
            Información General
          </h3>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Nombre Oficial del Torneo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Organización / Club Anfitrión
            </label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Ej: ABASAP"
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Administradores Asignados (Emails)
            </label>
            <input
              type="text"
              value={adminEmailsStr}
              onChange={(e) => setAdminEmailsStr(e.target.value)}
              placeholder="admin1@gmail.com, admin2@gmail.com"
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-orange-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Correos electrónicos separados por coma con acceso administrativo a este torneo.
            </p>
          </div>
        </div>

        {/* Selector de Nivel (Tier Upgrade / Switch) */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
            Nivel de Operación
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTier("amateur")}
              className={`p-4 rounded-xl border-2 text-left transition ${
                tier === "amateur"
                  ? "border-zinc-300 bg-zinc-800 text-white font-bold"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-xs">Liguita Amateur</div>
              <div className="text-[11px] text-zinc-400 mt-1">Estadísticas básicas y flujo ágil</div>
            </button>

            <button
              type="button"
              onClick={() => setTier("pro")}
              className={`p-4 rounded-xl border-2 text-left transition ${
                tier === "pro"
                  ? "border-orange-500 bg-orange-500/10 text-white font-bold"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <div className="font-bold text-xs flex items-center gap-1.5 text-orange-400">
                <Sparkles size={14} />
                <span>Torneo Profesional PRO</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Play-by-play en vivo, árbitros y box score avanzado</div>
            </button>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-bold text-zinc-950 text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <Save size={15} />
            <span>{isSaving ? "Guardando Cambios..." : "Guardar Configuración"}</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-bold text-green-400 flex items-center gap-1 animate-in fade-in">
              <Check size={14} />
              <span>¡Configuración y logo actualizados correctamente!</span>
            </span>
          )}
        </div>
      </form>

      {/* Zona de Peligro */}
      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
        <h3 className="font-bold text-red-400 text-sm mb-1 flex items-center gap-1.5">
          <ShieldAlert size={16} />
          <span>Zona de Peligro</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Eliminar este torneo borrará de forma permanente todos los partidos, equipos y estadísticas asociadas.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          <span>Eliminar Torneo Permanentemente</span>
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

function ConfirmModal({ open, title = "Confirmar Exclusão", message = "Tem certeza que deseja excluir?", confirmText = "Excluir", cancelText = "Cancelar", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-red-900/80 to-slate-900/80 backdrop-blur-md" onClick={onCancel} />

      {/* Modal Container - Moderno e Glassmorphic */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-white via-red-50/30 to-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-red-200/50">
        {/* Header com gradiente vermelho */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">{title}</h2>
          </div>
          <button onClick={onCancel} aria-label="Fechar" className="text-white/80 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90">
            <X size={22} />
          </button>
        </div>

        {/* Mensagem */}
        <div className="px-6 py-6 text-sm text-slate-700 font-medium bg-white/50">
          {message}
        </div>

        {/* Ações */}
        <div className="bg-gradient-to-r from-slate-50 via-red-50/50 to-slate-50 border-t-2 border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button type="button" className="px-6 py-3 text-slate-700 font-bold border-2 border-slate-300 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 text-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] text-sm" onClick={onConfirm}>
            <Trash2 size={16} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

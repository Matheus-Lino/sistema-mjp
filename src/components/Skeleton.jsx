// Componente de Skeleton Loading reutilizável
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6 mt-20">
      {/* Cards de estatísticas */}
      <div className="flex gap-6">
        <div className="bg-gray-200 h-24 rounded-box flex-1"></div>
        <div className="bg-gray-200 h-24 rounded-box flex-1"></div>
        <div className="bg-gray-200 h-24 rounded-box flex-1"></div>
        <div className="bg-gray-200 h-24 rounded-box flex-1"></div>
      </div>

      {/* Tabela */}
      <div className="bg-base-200 rounded-box border border-base-content/5 p-4">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;

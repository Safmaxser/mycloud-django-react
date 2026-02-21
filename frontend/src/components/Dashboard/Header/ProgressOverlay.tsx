interface ProgressOverlayProps {
  progress: number | null;
}

/** Линейный индикатор прогресса загрузки, фиксируемый в нижней части контейнера. */
export function ProgressOverlay({ progress }: ProgressOverlayProps) {
  if (progress === null) {
    return null;
  }

  return (
    <div className="absolute left-0 bottom-0 z-20 h-1 w-full bg-gray-100">
      <div
        className="bg-linear-to-r h-full from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.5)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

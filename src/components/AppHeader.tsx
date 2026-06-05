export function AppHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            German Tutor
          </h1>
          <p className="text-xs text-zinc-500">English → German practice</p>
        </div>
      </div>
    </header>
  );
}

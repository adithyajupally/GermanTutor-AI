export type TabId = 'practice' | 'notebook' | 'history' | 'explorer' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'history', label: 'History' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'settings', label: 'Settings' },
];

type TabNavProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav
      className="border-b border-zinc-800 bg-zinc-950"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-2 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

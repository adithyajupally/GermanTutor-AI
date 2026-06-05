import { useState } from 'react';
import { AppHeader, TabNav, type TabId } from './components';
import {
  HistoryPage,
  NotebookPage,
  PracticePage,
  SettingsPage,
} from './pages';
import { useHistory } from './hooks/useHistory';
import { useNotebook } from './hooks/useNotebook';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('practice');
  const { entries: historyEntries, addEntry: addHistoryEntry } = useHistory();
  const { entries: notebookEntries, addEntries: addNotebookEntries } = useNotebook();

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <AppHeader />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {activeTab === 'practice' && (
          <PracticePage
            onAttemptSaved={addHistoryEntry}
            onNotebookSave={addNotebookEntries}
          />
        )}
        {activeTab === 'notebook' && <NotebookPage entries={notebookEntries} />}
        {activeTab === 'history' && <HistoryPage entries={historyEntries} />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;

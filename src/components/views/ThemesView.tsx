import { Theme } from '../../types';
import { CONQUER_LEVEL_IDS } from '../../data/shopItems';
import { Trash2 } from 'lucide-react';

interface ThemesViewProps {
  themes: Theme[];
  onCreateTheme: () => void;
  onEditTheme: (themeId: string) => void;
  onDeleteTheme: (themeId: string) => void;
}

const audienceLabel: Record<Theme['audience'], string> = {
  common: '通用',
  male: '仅男方',
  female: '仅女方'
};

export function ThemesView({ themes, onCreateTheme, onEditTheme, onDeleteTheme }: ThemesViewProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">任务主题库</h2>
        <button
          className="h-9 px-4 rounded-full bg-white text-black text-sm font-semibold ios-btn"
          onClick={onCreateTheme}
        >
          新建主题
        </button>
      </div>
      <div className="space-y-3">
        {themes.map(theme => {
          const isDefault = CONQUER_LEVEL_IDS.includes(theme.id);
          return (
            <div
              key={theme.id}
              className="ios-card p-4 border border-white/5 ios-btn cursor-pointer"
              onClick={() => onEditTheme(theme.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-semibold">
                    {theme.name}
                    {isDefault && <span className="ml-2 text-[10px] text-gray-500">内置</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{theme.desc}</div>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                      {audienceLabel[theme.audience]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                    {theme.tasks.length}卡
                  </div>
                  {!isDefault && (
                    <button
                      aria-label={`删除 ${theme.name}`}
                      className="h-8 w-8 rounded-lg bg-black/20 text-[#FF453A] ios-btn flex items-center justify-center"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`删除主题「${theme.name}」？`)) onDeleteTheme(theme.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

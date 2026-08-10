import { Theme } from '../../types';
import { Check } from 'lucide-react';
import { ModalSheet } from '../ModalSheet';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  themes: Theme[];
  selectedThemeId: string | null;
  onSelect: (themeId: string) => void;
  onClose: () => void;
}

export function ThemeSelectorModal({
  isOpen,
  themes,
  selectedThemeId,
  onSelect,
  onClose
}: ThemeSelectorModalProps) {
  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">选择主题</h3>
      </div>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pb-8">
        {themes.map(theme => (
          <div
            key={theme.id}
            onClick={() => {
              onSelect(theme.id);
              onClose();
            }}
            className="p-4 bg-[#2C2C2E] rounded-xl flex justify-between items-center active:bg-[#3A3A3C] transition-colors cursor-pointer"
          >
            <span className="text-white font-medium">{theme.name}</span>
            {selectedThemeId === theme.id && (
              <Check className="text-[#0A84FF]" size={20} />
            )}
          </div>
        ))}
      </div>
    </ModalSheet>
  );
}

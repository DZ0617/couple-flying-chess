import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Theme } from '../../types';
import { ModalSheet } from '../ModalSheet';

type TaskField = 'tasks' | 'duoTasks';

interface ThemeEditorModalProps {
  isOpen: boolean;
  theme: Theme | null;
  onClose: () => void;
  onSaveMeta: (themeId: string, patch: Partial<Pick<Theme, 'name' | 'desc' | 'audience'>> & { band?: number | null }) => void;
  onAddTask: (themeId: string, taskText: string, field: TaskField) => void;
  onRemoveTask: (themeId: string, index: number, field: TaskField) => void;
  onOpenAiImport: (themeId: string, field: TaskField) => void;
}

const audienceOptions: Array<{ value: Theme['audience']; label: string }> = [
  { value: 'common', label: '通用' },
  { value: 'male', label: '仅限男方' },
  { value: 'female', label: '仅限女方' }
];

const FIELD_TABS: Array<{ value: TaskField; label: string; hint: string }> = [
  { value: 'tasks', label: '任务卡', hint: '普通任务' },
  { value: 'duoTasks', label: '双人卡组', hint: '双人任务格使用' }
];

export function ThemeEditorModal({
  isOpen,
  theme,
  onClose,
  onSaveMeta,
  onAddTask,
  onRemoveTask,
  onOpenAiImport
}: ThemeEditorModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [audience, setAudience] = useState<Theme['audience']>('common');
  const [band, setBand] = useState<number | null>(null);
  const [taskText, setTaskText] = useState('');
  const [field, setField] = useState<TaskField>('tasks');

  useEffect(() => {
    if (!isOpen || !theme) return;
    setName(theme.name);
    setDesc(theme.desc);
    setAudience(theme.audience);
    setBand(theme.band ?? null);
    setTaskText('');
    setField('tasks');
  }, [isOpen, theme]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  if (!isOpen || !theme) return null;

  const taskList = theme[field];

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xl font-bold text-white">编辑主题</h3>
        <button
          className="h-9 px-4 rounded-full bg-white text-black text-sm font-semibold ios-btn disabled:opacity-40"
          disabled={!canSave}
          onClick={() => {
            onSaveMeta(theme.id, { name: name.trim(), desc: desc.trim(), audience, band });
            onClose();
          }}
        >
          保存
        </button>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
        <div className="space-y-2">
          <div className="text-xs text-gray-400">主题名称</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-[#2C2C2E] text-white outline-none border border-white/5 focus:border-white/20"
            maxLength={24}
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">描述</div>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-[#2C2C2E] text-white outline-none border border-white/5 focus:border-white/20"
            maxLength={60}
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">适用对象</div>
          <div className="grid grid-cols-3 gap-2">
            {audienceOptions.map(opt => (
              <button
                key={opt.value}
                className={`h-10 rounded-xl text-sm font-semibold ios-btn border ${
                  audience === opt.value
                    ? 'bg-white text-black border-white'
                    : 'bg-[#2C2C2E] text-gray-200 border-white/5'
                }`}
                onClick={() => setAudience(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">渐进之夜归属（不参与温度池可留空）</div>
          <div className="grid grid-cols-3 gap-2">
            {['甜蜜带', '暧昧带', '烈火带', '诱惑带', '灵肉带'].map((name, i) => (
              <button
                key={name}
                className={`h-9 rounded-xl text-xs font-semibold ios-btn border ${
                  band === i ? 'bg-white text-black border-white' : 'bg-[#2C2C2E] text-gray-200 border-white/5'
                }`}
                onClick={() => setBand(band === i ? null : i)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FIELD_TABS.map(tab => (
            <button
              key={tab.value}
              className={`h-11 rounded-xl text-sm font-semibold ios-btn border flex flex-col items-center justify-center ${
                field === tab.value
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2C2C2E] text-gray-200 border-white/5'
              }`}
              onClick={() => setField(tab.value)}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] ${field === tab.value ? 'text-gray-600' : 'text-gray-500'}`}>
                {tab.hint} · {theme[tab.value].length} 卡
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#BF5AF2] via-[#FF375F] to-[#FF9F0A] text-white font-bold ios-btn shadow-[0_0_15px_rgba(255,55,95,0.3)] flex items-center justify-center gap-2 border-none"
            onClick={() => onOpenAiImport(theme.id, field)}
          >
            <Wand2 size={18} className="animate-pulse" />
            <span>AI 导入{field === 'duoTasks' ? '双人卡组' : '任务卡'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">新增{field === 'duoTasks' ? '双人任务' : '任务卡'}</div>
          <p className="text-[10px] text-gray-600 -mt-1">
            任务按列表顺序由轻到重出现——温和的放前面，深入的放后面
          </p>
          <div className="flex gap-2">
            <input
              value={taskText}
              onChange={e => setTaskText(e.target.value)}
              className="flex-1 h-11 px-4 rounded-xl bg-[#2C2C2E] text-white outline-none border border-white/5 focus:border-white/20"
              placeholder={field === 'duoTasks' ? '输入一句双人共同完成的任务' : '输入一句可执行的小任务'}
              maxLength={80}
            />
            <button
              className="h-11 px-4 rounded-xl bg-white text-black font-bold ios-btn disabled:opacity-40 flex items-center justify-center gap-1"
              disabled={!taskText.trim()}
              onClick={() => {
                onAddTask(theme.id, taskText, field);
                setTaskText('');
              }}
            >
              <Plus size={18} />
              添加
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">{field === 'duoTasks' ? '双人卡组列表' : '任务卡列表'}</div>
            <div className="text-[10px] text-gray-500">{taskList.length} 卡</div>
          </div>
          <div className="space-y-2">
            {taskList.map((t, idx) => (
              <div
                key={`${theme.id}_${field}_${idx}`}
                className="p-3 bg-[#2C2C2E] rounded-xl flex gap-3 items-start border border-white/5"
              >
                <div className="text-[11px] text-gray-500 mt-0.5">{idx + 1}</div>
                <div className="flex-1 text-sm text-white leading-relaxed">{t}</div>
                <button
                  className="h-8 w-8 rounded-lg bg-black/20 text-[#FF453A] ios-btn flex items-center justify-center"
                  onClick={() => onRemoveTask(theme.id, idx, field)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {taskList.length === 0 && (
              <div className="text-sm text-gray-500 bg-[#2C2C2E] rounded-xl p-4 border border-white/5">
                {field === 'duoTasks'
                  ? '还没有双人任务，踩到「双人任务」格时会回退到普通任务池'
                  : '还没有任务卡，先添加几条吧'}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalSheet>
  );
}

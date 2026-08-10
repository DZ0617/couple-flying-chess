import { useEffect, useMemo, useState } from 'react';
import { ModalSheet } from '../ModalSheet';

type TaskField = 'tasks' | 'duoTasks';

interface AiImportModalProps {
  isOpen: boolean;
  themeName: string;
  initialField: TaskField;
  onClose: () => void;
  onImport: (tasks: string[], mode: 'append' | 'replace', field: TaskField) => void;
}

export function AiImportModal({ isOpen, themeName, initialField, onClose, onImport }: AiImportModalProps) {
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [field, setField] = useState<TaskField>('tasks');

  useEffect(() => {
    if (!isOpen) return;
    setMode('append');
    setJsonText('');
    setError('');
    setCopied(false);
    setField(initialField);
  }, [isOpen, initialField]);

  const prompt = useMemo(() => {
    const duoHint = field === 'duoTasks'
      ? '本次生成的是「双人任务」：指令必须以"两人/一起/互相"等双方共同完成的措辞开头，任务本身需要两个人同时参与。'
      : '';
    const base = `# Role 
你是一位深谙亲密关系心理学的“情侣游戏设计师”。你的专长是设计既能升温感情，又具有趣味性和互动性的飞行棋任务卡片。 

 # Goal 
请根据主题「${themeName}」生成 20 条可执行的飞行棋任务指令。 

 # Content Rules 
1. **主题关联**：如果主题有意义，则任务必须深度契合「${themeName}」主题。 
2. **行动导向**：指令必须是具体的行动，避免抽象概念。 
3. **字数限制**：每条指令必须是中文，长度严格控制在 6 ~ 22 字之间，不能过长。 
4. **语气风格**：轻松、撩人、幽默或温馨，适合情侣互动。 
5. **排序要求**：20 条任务必须按尺度由轻到重排列，第 1 条最温和，第 20 条最大胆。 
6. ${duoHint}
7. **禁忌**：禁止出现编号、Emoji 表情、Markdown 格式、解释性文字。 
 
 # Output Format 
你必须且只能输出纯 JSON 字符串，不要包含 "\`\`\`json" 或 "\`\`\`" 包裹。 
格式严格如下： 
 { 
   "tasks": [ 
     "任务内容1", 
     "任务内容2" 
   ] 
 } 
 
 # Workflow 
1. 分析主题「${themeName}」的核心互动点。 
2. 构思 20 条符合规则的创意任务。 
3. 检查字数和格式。 
4. 输出最终 JSON。`;
    return base;
  }, [themeName, field]);

  if (!isOpen) return null;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-[#BF5AF2] to-[#FF375F] bg-clip-text text-transparent">
          AI 智能导入
        </h3>
        <button
          className={`h-9 px-4 rounded-full font-semibold ios-btn transition-all duration-300 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]'
          }`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? '已复制' : '复制提示词'}
        </button>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
        <div className="space-y-2">
          <div className="text-xs text-gray-400">导入目标</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`h-10 rounded-xl text-sm font-semibold ios-btn border ${
                field === 'tasks'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2C2C2E] text-gray-200 border-white/5'
              }`}
              onClick={() => setField('tasks')}
            >
              任务卡
            </button>
            <button
              className={`h-10 rounded-xl text-sm font-semibold ios-btn border ${
                field === 'duoTasks'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2C2C2E] text-gray-200 border-white/5'
              }`}
              onClick={() => setField('duoTasks')}
            >
              双人卡组
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">提示词（复制后可按喜好修改）</div>
          <textarea
            value={prompt}
            readOnly
            className="w-full h-36 p-4 rounded-xl bg-[#2C2C2E] text-gray-200 outline-none border border-white/5 resize-none"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">粘贴 AI 返回的 JSON</div>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            className="w-full h-40 p-4 rounded-xl bg-[#2C2C2E] text-white outline-none border border-white/5 focus:border-[#FF375F]/50 transition-colors resize-none"
            placeholder='例如：{"tasks":["一起拥抱30秒","互相说一句情话"]}'
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-400">导入方式</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`h-10 rounded-xl text-sm font-semibold ios-btn border ${
                mode === 'append'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2C2C2E] text-gray-200 border-white/5'
              }`}
              onClick={() => setMode('append')}
            >
              追加
            </button>
            <button
              className={`h-10 rounded-xl text-sm font-semibold ios-btn border ${
                mode === 'replace'
                  ? 'bg-white text-black border-white'
                  : 'bg-[#2C2C2E] text-gray-200 border-white/5'
              }`}
              onClick={() => setMode('replace')}
            >
              覆盖
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-[#FF453A]">{error}</div>}

        <div className="flex gap-3 pt-1">
          <button
            className="flex-1 h-12 rounded-full bg-[#3A3A3C] text-gray-200 font-bold text-sm ios-btn"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="flex-1 h-12 rounded-full bg-gradient-to-r from-[#BF5AF2] to-[#FF375F] text-white font-bold text-sm ios-btn shadow-lg"
            onClick={() => {
              setError('');
              const raw = jsonText.trim();
              if (!raw) {
                setError('请粘贴 JSON');
                return;
              }

              try {
                const parsed: unknown = JSON.parse(raw);

                const isRecord = (v: unknown): v is Record<string, unknown> =>
                  !!v && typeof v === 'object' && !Array.isArray(v);

                const list: unknown[] | null =
                  Array.isArray(parsed)
                    ? parsed
                    : isRecord(parsed) && Array.isArray(parsed.tasks)
                      ? parsed.tasks
                      : null;

                if (!list) {
                  setError('JSON 格式不正确：需要数组或包含 tasks 数组的对象');
                  return;
                }

                const tasks = list
                  .map(item => {
                    if (typeof item === 'string') return item.trim();
                    if (isRecord(item) && typeof item.task === 'string') return item.task.trim();
                    return '';
                  })
                  .filter((t): t is string => t.length > 0);

                if (tasks.length === 0) {
                  setError('没有解析到任何任务卡文本');
                  return;
                }

                onImport(tasks, mode, field);
                onClose();
              } catch {
                setError('JSON 解析失败：请确认粘贴的是完整 JSON 且没有多余字符');
              }
            }}
          >
            导入
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}

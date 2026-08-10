import { X } from 'lucide-react';
import { TILE_STYLE } from '../tileStyles';
import { TileType, GameMode } from '../../types';
import { ModalSheet } from '../ModalSheet';

interface RulesModalProps {
  isOpen: boolean;
  mode: GameMode;
  onClose: () => void;
}

const TILE_DESC: Record<TileType, string> = {
  lucky: '抽取你的主题任务，由对方执行；接受后你前进 1 格',
  trap: '抽取对方主题的任务，由你执行',
  duo: '抽取双人任务，双方共同完成；拒绝则你倒退 1~3 格',
  forward: '再前进 2 格，可连锁（最多 3 跳）',
  backward: '后退 2 格，可连锁（最多 3 跳）',
  extra: '本回合再掷一次（占用连掷次数）',
  swap: '与对方交换位置，落点不再触发效果',
  jump: '向前飞 6 格，落点正常结算（不再连锁位移）',
  vortex: '随机传送到任意格子，落点不触发任何效果',
  shield: '获得一次性护盾，自动抵挡一次陷阱或追尾任务',
  sync: '默契考验：双方同时写下答案，一致双方 +10 Hearts，不一致抽搞笑小惩罚',
  blank: '轻松一刻：无惩罚小互动',
};

const DICE_RULES: Record<GameMode, string[]> = {
  classic: [
    '每回合掷一颗骰子（1~6）',
    '掷出 6 可再掷一次，一回合最多 3 掷',
    '第三次掷出 6：回到起点并换人',
    '到达或超过终点即获胜',
    '踩到任务格会打断本回合的连掷',
  ],
  double: [
    '每回合掷两颗骰子，步数为之和（2~12）',
    '掷出对子可再掷一次，一回合最多 3 掷',
    '第三次仍是对子：回到起点并换人',
    '到达或超过终点即获胜',
    '踩到任务格会打断本回合的连掷',
  ],
  truth: [
    '每回合掷两颗骰子，步数为之和（2~12）',
    '掷出对子可再掷一次，一回合最多 3 掷',
    '第三次仍是对子：回到起点并换人',
    '到达或超过终点即获胜',
    '踩到任务格会打断本回合的连掷',
  ],
  heat: [
    '每回合掷两颗骰子，步数为之和（2~12）',
    '掷出对子可再掷一次，一回合最多 3 掷',
    '完成任务温度上升，到闸口由你们决定是否升温',
    '拒绝任务会被记入欠账清单，终局清算',
    '到达或超过终点即获胜',
  ],
};

const TASK_RULES = [
  '幸运格任务由对方执行，陷阱格任务由你执行',
  '拒绝任务：倒退 1~3 格（追尾回到起点）',
  '双人任务双方共同完成，拒绝则触发方倒退',
  '每张任务卡可倒退 1 格换一张，每卡限一次',
  '真心话模式：幸运格=真心话（对方回答，拒答退 1 格），陷阱格=大冒险',
];

export function RulesModal({ isOpen, mode, onClose }: RulesModalProps) {
  const tileTypes = Object.keys(TILE_STYLE) as TileType[];

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">规则说明</h3>
        <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white" aria-label="关闭">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
        <h4 className="text-sm font-semibold text-white/80 mb-2">格子图例</h4>
        <div className="flex flex-col gap-2 mb-5">
          {tileTypes.map(type => {
            const s = TILE_STYLE[type];
            const Icon = s.Icon;
            return (
              <div key={type} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.className}`}>
                  {Icon && <Icon className="w-4 h-4 text-white/70" />}
                </div>
                <div className="text-xs text-white/70">
                  <span className="text-white font-medium mr-1.5">{s.label}</span>
                  {TILE_DESC[type]}
                </div>
              </div>
            );
          })}
        </div>

        <h4 className="text-sm font-semibold text-white/80 mb-2">骰子与终点</h4>
        <ul className="list-disc list-inside text-xs text-white/70 space-y-1 mb-5">
          {DICE_RULES[mode].map(r => <li key={r}>{r}</li>)}
        </ul>

        <h4 className="text-sm font-semibold text-white/80 mb-2">任务卡</h4>
        <ul className="list-disc list-inside text-xs text-white/70 space-y-1">
          {TASK_RULES.map(r => <li key={r}>{r}</li>)}
        </ul>
      </div>
    </ModalSheet>
  );
}

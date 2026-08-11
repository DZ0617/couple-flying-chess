export type ShopCategory = 'tactical' | 'service' | 'gamble' | 'privilege';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  desc: string;
  price: number;
  limitPerMatch?: number;
  leaderRestricted?: boolean; // 仅当 buyer.hearts <= 对方 × 1.5 时可买
  needsRigTotal?: boolean;    // 遥控骰子需要选点数
  femaleOnly?: boolean;       // 仅女方可购买
}

export const SHOP_ITEMS: ShopItem[] = [
  // 战术
  { id: 'charm',    category: 'tactical', name: '护身符',   price: 45,  desc: '立即获得一层护盾，抵挡一次陷阱或追尾' },
  { id: 'leap',     category: 'tactical', name: '飞跃卡',   price: 35,  desc: '立即前进 4 格（可直接冲线获胜），落点不触发效果' },
  { id: 'recall',   category: 'tactical', name: '回溯卡',   price: 35,  desc: '对方后退 4 格，落点不触发效果', leaderRestricted: true },
  { id: 'freeze',   category: 'tactical', name: '定身符',   price: 30,  desc: '对方下一回合跳过掷骰', leaderRestricted: true },
  { id: 'remote',   category: 'tactical', name: '遥控骰子', price: 60,  desc: '指定对方下次掷骰的总点数', leaderRestricted: true, needsRigTotal: true },
  { id: 'swapcard', category: 'tactical', name: '换位卡',   price: 70,  desc: '立即与对方交换位置' },
  { id: 'nuke',     category: 'tactical', name: '核平卡',   price: 100, desc: '对方 Hearts 清零', limitPerMatch: 1 },
  // 服务
  { id: 'hug',      category: 'service', name: '拥抱券',   price: 10, desc: '对方给你一个 30 秒拥抱' },
  { id: 'feed',     category: 'service', name: '投喂券',   price: 15, desc: '对方喂你一口吃的或喝的' },
  { id: 'praise',   category: 'service', name: '夸奖券',   price: 15, desc: '对方认真说出你 3 个优点' },
  { id: 'backrub',  category: 'service', name: '捶背券',   price: 25, desc: '对方捶背 3 分钟，游戏可继续' },
  { id: 'song',     category: 'service', name: '点歌券',   price: 25, desc: '对方手机立刻播放你指定的歌' },
  { id: 'massage',  category: 'service', name: '按摩券',   price: 40, desc: '5 分钟肩颈按摩，可暂停游戏' },
  { id: 'obey',     category: 'service', name: '听令券',   price: 60, desc: '对方无条件答应一个合理小要求' },
  // 娱乐
  { id: 'mystery',   category: 'gamble', name: '心愿盲盒', price: 50, desc: '随机开出 20~120 Hearts' },
  { id: 'roulette',  category: 'gamble', name: '命运轮盘', price: 30, desc: '前进3（可直接冲线）/ 后退3 / 双方+15 / 换位 / 无事发生' },
  { id: 'robinhood', category: 'gamble', name: '劫富济贫', price: 40, desc: 'Hearts 多的一方转 30 给少的一方' },
  // 特权（女方专属）
  { id: 'princess', category: 'privilege', name: '公主令', price: 50, desc: '命令男方立刻完成一张他的欠账卡；没有欠账则按当前尺度抽一张，不可拒绝；任务完成你 +10 Hearts 并前进 1 格', limitPerMatch: 1, femaleOnly: true },
  { id: 'queen',    category: 'privilege', name: '女王时刻', price: 80, desc: '接下来 3 个回合，男方获得的 Hearts 全部归你', limitPerMatch: 1, femaleOnly: true },
];

export interface WishItem {
  id: string;
  name: string;
  desc: string;
  price: number;        // 心愿银行
  needsConquerAll?: boolean; // 需要征服全部难度
}

export const WISH_ITEMS: WishItem[] = [
  // —— 今晚立兑档（300~600）——
  { id: 'milktea',   name: '奶茶投喂券',     price: 300,  desc: '回去路上（或下次见面）对方请你喝指定奶茶' },
  { id: 'breakfast', name: '晨吻唤醒券',     price: 350,  desc: '明早对方用亲吻叫你起床' },
  { id: 'snack',     name: '水果切盘券',     price: 400,  desc: '对方下楼或外卖一份你爱吃的水果/零食，亲手喂你' },
  { id: 'movie',     name: '酒店观影券',     price: 450,  desc: '今晚酒店放什么电影由你选，对方陪看到底' },
  { id: 'bath',      name: '吹头发服务券',   price: 500,  desc: '洗完澡对方帮你吹干并梳理头发' },
  { id: 'massage',   name: '全身按摩券',     price: 600,  desc: '20 分钟全身按摩，部位和力度都听你的' },

  // —— 亲密特权档（650~1200）——
  { id: 'date',      name: '约会安排券',     price: 650,  desc: '下次约会的地点和行程全部由你决定' },
  { id: 'chore',     name: '女王/国王券',    price: 700,  desc: '今晚接下来的 1 小时，对方对你言听计从' },
  { id: 'photo',     name: '专属模特券',     price: 750,  desc: '对方穿上你指定的装扮，摆三个你指定的 pose 拍照' },
  { id: 'bath2',     name: '搓背/沐浴券',    price: 800,  desc: '对方帮你洗头或搓背，服务到底' },
  { id: 'karaoke',   name: '专属演唱会券',   price: 850,  desc: '对方只对你清唱三首你点的情歌' },
  { id: 'gift',      name: '神秘礼物券',     price: 1000, desc: '下次见面时对方准备一份百元内惊喜' },

  // —— 深度承诺档（1200~1800）——
  { id: 'spa',       name: '双人 SPA 券',    price: 1200, desc: '下次约会对方安排一次双人 SPA 或温泉' },
  { id: 'dinner',    name: '大餐决定券',     price: 1300, desc: '下次见面吃什么你说了算，预算 200 元内对方买单' },
  { id: 'trip',      name: '短途旅行券',     price: 1500, desc: '对方策划一次周末周边游，全程不用你操心' },
  { id: 'letter',    name: '手写情书券',     price: 1600, desc: '对方手写一封不少于 500 字的情书，下次见面给你' },
  { id: 'memory',    name: '纪念相册券',     price: 1800, desc: '对方整理你们的照片做成一本实体相册送你' },

  // —— 七夕限定（仅当天可见）——
  {
    id: 'qixi2026',
    name: '七夕心愿券',
    price: 777,
    desc: '七夕限定：对方答应你今晚的一个小浪漫（只今天能兑换）',
  },

  // —— 终极 ——
  {
    id: 'ultimate',
    name: '终极心愿券',
    price: 3000,
    desc: '写下一个心愿，对方尽力实现（需先征服全部 5 个难度）',
    needsConquerAll: true,
  },
];

// 需要征服的默认难度 id（与 defaultThemes 一致）
export const CONQUER_LEVEL_IDS = ['sweet', 'love', 'couple', 'intimate', 'advanced'];

export const SHOP_CATEGORY_LABEL: Record<ShopCategory, string> = {
  tactical: '战术',
  service: '服务',
  gamble: '娱乐',
  privilege: '特权',
};

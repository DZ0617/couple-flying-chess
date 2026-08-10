import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { TaskEventData, GameMode } from './types';
import { WIN_STEP } from './utils/gameLogic';
import { isThirteenFourteen } from './utils/events';
import { HomeView } from './components/views/HomeView';
import { GameView } from './components/views/GameView';
import { ThemesView } from './components/views/ThemesView';
import { ThemeSelectorModal } from './components/modals/ThemeSelectorModal';
import { TaskCardModal } from './components/modals/TaskCardModal';
import { WinModal } from './components/modals/WinModal';
import { BottomNav } from './components/BottomNav';
import { ThemeCreateModal } from './components/modals/ThemeCreateModal';
import { ThemeEditorModal } from './components/modals/ThemeEditorModal';
import { AiImportModal } from './components/modals/AiImportModal';
import { RulesModal } from './components/modals/RulesModal';
import { ShopModal } from './components/modals/ShopModal';
import { WishlistModal } from './components/modals/WishlistModal';
import { WishShopModal } from './components/modals/WishShopModal';
import { HeatGateModal } from './components/modals/HeatGateModal';
import { SyncTileModal } from './components/modals/SyncTileModal';
import { DebtListModal } from './components/modals/DebtListModal';
import { ModalSheet } from './components/ModalSheet';

function App() {
  const {
    state,
    switchView,
    selectTheme,
    renamePlayer,
    createTheme,
    updateThemeMeta,
    addThemeTask,
    removeThemeTask,
    importThemeTasks,
    startGame,
    rematch,
    continueHeatNight,
    movePlayer,
    applyMovement,
    endTurn,
    setIsRolling,
    recordRoll,
    applyBackfire,
    checkMilestones,
    settleMatch,
    setPendingTask,
    setPendingLanding,
    setPendingSync,
    grantThirteenFourteen,
    applyOutcomeMeta,
    gainShield,
    gainHearts,
    resolveLanding,
    resolveTask,
    resolveGate,
    resolveSync,
    swapTask,
    purchaseItem,
    consumeFrozen,
    consumeRigged,
    redeemWish,
    markWishRedeemed,
    removeDebt,
    payDebt,
    convertDebts,
    drawPunishment,
    deleteTheme,
    resetGame,
  } = useGameState();

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [isCreateThemeModalOpen, setIsCreateThemeModalOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [aiImportThemeId, setAiImportThemeId] = useState<string | null>(null);
  const [aiImportField, setAiImportField] = useState<'tasks' | 'duoTasks'>('tasks');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isWishShopOpen, setIsWishShopOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isDebtOpen, setIsDebtOpen] = useState(false);

  // 任务卡改由存档驱动（B3：防刷新逃避）
  const taskData = state.pendingTask;

  // 有弹层盖住时禁用 GameView 的空格掷骰与掷骰按钮（防穿透）
  const modalOpen =
    state.pendingGate !== null || !!state.pendingTask || !!state.pendingSync ||
    isShopOpen || isLeaveOpen || isRulesOpen || isDebtOpen;

  // 统一胜利监听：任何来源的位移到达终点都判胜（B2）
  // 结算幂等由 settleMatch 的 ended 标记保证：刷新胜利页不会重复入账
  useEffect(() => {
    if (state.view !== 'game' || winnerId !== null) return;
    const winner = state.players.find(p => p.step >= WIN_STEP);
    if (!winner) return;
    if (!state.match.ended) settleMatch(winner.id);
    setWinnerId(winner.id); // 刷新后也能恢复战报弹层，但不会重复结算
    setIsShopOpen(false); // 防止胜利弹层被商店盖住
  }, [state.players, state.view, winnerId, state.match.ended, settleMatch]);

  // 一生一世彩蛋：双方停在 13/14 时各 +14（每局限一次，未触发才调用避免重复音效）
  useEffect(() => {
    if (state.view !== 'game' || winnerId !== null) return;
    if (state.shopUsage['__1314__']) return;
    const [a, b] = state.players;
    if (isThirteenFourteen(a.step, b.step)) grantThirteenFourteen();
  }, [state.players, state.view, winnerId, state.shopUsage, grantThirteenFourteen]);

  const handleSelectTheme = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setIsThemeModalOpen(true);
  };

  const handleThemeSelect = (themeId: string) => {
    selectTheme(selectedPlayerId, themeId);
  };

  const selectedPlayer = state.players.find(p => p.id === selectedPlayerId) || state.players[0];
  const selectableThemes = state.themes.filter(
    t => t.audience === 'common' || t.audience === selectedPlayer.role
  );

  const handleStartGame = (mode: GameMode, heatCeiling: number) => {
    const success = startGame(mode, heatCeiling);
    if (!success) alert('请先为双方选择任务包');
  };

  const handleSyncTrigger = (question: string) => setPendingSync({ question });

  const handleTaskTrigger = (data: TaskEventData) => setPendingTask(data);
  const handleTaskAccept = () => {
    if (taskData) resolveTask(taskData, 'accept');
  };
  const handleTaskReject = () => {
    if (taskData) resolveTask(taskData, 'reject');
  };
  const handleTaskSwap = (): boolean => {
    if (!taskData) return false;
    return swapTask(taskData) !== null;
  };

  const handleWin = (id: number) => {
    // 去重守卫：GameView 的 onWin 与 App 层胜利监听可能先后触发，只结算一次（防战绩/银行翻倍）
    if (winnerId !== null) return;
    settleMatch(id);
    setWinnerId(id);
  };

  const handleNavigate = (view: 'home' | 'themes') => switchView(view);

  const handleBackFromGame = () => {
    setIsLeaveOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex justify-center bg-black">
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        {/* 桌面端氛围装饰 */}
        <div className="hidden md:block absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FF375F]/20 blur-[120px]" />
        <div className="hidden md:block absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#BF5AF2]/20 blur-[120px]" />
        <div className="hidden md:block absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-[#0A84FF]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[430px] md:max-w-[520px] h-full md:h-[calc(100%-3rem)] md:my-6 flex flex-col bg-black/20 md:bg-[#0F0F10]/80 md:rounded-[32px] md:border md:border-white/10 md:shadow-2xl md:overflow-hidden">
        <header className="pt-12 pb-2 px-6 shrink-0 flex justify-between items-start">
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Couple's Game
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">情侣飞行棋</h1>
          </div>
          <div className="flex flex-col items-end gap-2 mt-1">
            <a
              href="https://github.com/woniu9524/couple-flying-chess"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <Github size={24} />
            </a>
          </div>
        </header>

        <main className="flex-1 min-h-0 relative overflow-hidden">
          <div
            className={`absolute inset-0 flex flex-col px-6 pt-10 pb-10 transition-all duration-500 ease-in-out ${
              state.view === 'home'
                ? 'translate-x-0 opacity-100'
                : 'opacity-0 pointer-events-none -translate-x-full'
            }`}
          >
            <HomeView
              players={state.players}
              themes={state.themes}
              records={state.records}
              debtCount={state.debtList.length}
              onSelectTheme={handleSelectTheme}
              onRenamePlayer={renamePlayer}
              onStartGame={handleStartGame}
              onOpenWishShop={() => setIsWishShopOpen(true)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
              onOpenDebts={() => setIsDebtOpen(true)}
            />
          </div>

          <div
            className={`absolute inset-0 flex flex-col min-h-0 px-6 pt-4 transition-all duration-500 ease-in-out ${
              state.view === 'themes'
                ? 'translate-x-0 opacity-100'
                : 'opacity-0 pointer-events-none translate-x-full'
            }`}
          >
            <ThemesView
              themes={state.themes}
              onCreateTheme={() => setIsCreateThemeModalOpen(true)}
              onEditTheme={themeId => setEditingThemeId(themeId)}
              onDeleteTheme={deleteTheme}
            />
          </div>
        </main>

        <BottomNav activeView={state.view} onNavigate={handleNavigate} />
      </div>

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        themes={selectableThemes}
        selectedThemeId={selectedPlayer?.themeId || null}
        onSelect={handleThemeSelect}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <TaskCardModal
        isOpen={!!taskData}
        taskData={taskData}
        onAccept={handleTaskAccept}
        onReject={handleTaskReject}
        onSwap={handleTaskSwap}
      />

      <WinModal
        isOpen={winnerId !== null}
        winner={state.players.find(p => p.id === winnerId) || null}
        players={state.players}
        match={state.match}
        records={state.records}
        debtList={state.debtList}
        mode={state.mode}
        maxBand={state.maxBand}
        heat={state.heat}
        heatCeiling={state.heatCeiling}
        heatRound={state.heatRound}
        onDrawPunishment={drawPunishment}
        onRemoveDebt={removeDebt}
        onPayDebt={payDebt}
        onConvertDebts={convertDebts}
        onContinueNight={() => {
          continueHeatNight();
          setWinnerId(null);
          setIsShopOpen(false);
        }}
        onOpenWishShop={() => {
          resetGame();
          setWinnerId(null);
          setIsWishShopOpen(true);
        }}
        onRematch={() => {
          rematch();
          setWinnerId(null);
          setIsShopOpen(false);
        }}
        onGoHome={() => {
          resetGame();
          setWinnerId(null);
        }}
      />

      <RulesModal isOpen={isRulesOpen} mode={state.mode} onClose={() => setIsRulesOpen(false)} />

      <ShopModal
        isOpen={isShopOpen}
        buyer={state.players[state.turn]}
        opponent={state.players[state.turn === 0 ? 1 : 0]}
        mode={state.mode}
        usage={state.shopUsage}
        onClose={() => setIsShopOpen(false)}
        onPurchase={purchaseItem}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        wishlist={state.wishlist}
        players={state.players}
        bank={state.records.bank}
        onClose={() => setIsWishlistOpen(false)}
        onFulfill={markWishRedeemed}
      />

      <WishShopModal
        isOpen={isWishShopOpen}
        players={state.players}
        records={state.records}
        themes={state.themes}
        onClose={() => setIsWishShopOpen(false)}
        onRedeem={redeemWish}
      />

      <DebtListModal
        isOpen={isDebtOpen}
        debtList={state.debtList}
        players={state.players}
        bank={state.records.bank}
        onClose={() => setIsDebtOpen(false)}
        onRemove={removeDebt}
        onPay={payDebt}
      />

      <HeatGateModal
        isOpen={state.pendingGate !== null}
        band={state.pendingGate ?? 0}
        onChoice={resolveGate}
      />

      <SyncTileModal
        isOpen={!!state.pendingSync}
        challenge={state.pendingSync}
        players={state.players}
        onResolve={resolveSync}
        onClose={() => setPendingSync(null)}
      />

      <ModalSheet isOpen={isLeaveOpen} onClose={() => setIsLeaveOpen(false)}>
        <h3 className="text-xl font-bold text-white mb-2">离开游戏？</h3>
        <p className="text-xs text-gray-500 mb-6">进度已自动保存，离开后可在首页重新开始</p>
        <div className="flex gap-3">
          <button
            className="flex-1 h-11 rounded-full bg-[#3A3A3C] text-gray-200 font-bold text-sm ios-btn"
            onClick={() => setIsLeaveOpen(false)}
          >
            继续游戏
          </button>
          <button
            className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#FF375F] to-[#BF5AF2] text-white font-bold text-sm ios-btn"
            onClick={() => {
              resetGame();
              switchView('home');
              setIsLeaveOpen(false);
            }}
          >
            离开
          </button>
        </div>
      </ModalSheet>

      <ThemeCreateModal
        isOpen={isCreateThemeModalOpen}
        onClose={() => setIsCreateThemeModalOpen(false)}
        onCreate={input => {
          const id = createTheme(input);
          setIsCreateThemeModalOpen(false);
          if (id) setEditingThemeId(id);
        }}
      />

      <ThemeEditorModal
        isOpen={!!editingThemeId}
        theme={editingThemeId ? state.themes.find(t => t.id === editingThemeId) || null : null}
        onClose={() => {
          setEditingThemeId(null);
          setAiImportThemeId(null);
        }}
        onSaveMeta={(themeId, patch) => updateThemeMeta(themeId, patch)}
        onAddTask={(themeId, taskText, field) => addThemeTask(themeId, taskText, field)}
        onRemoveTask={(themeId, index, field) => removeThemeTask(themeId, index, field)}
        onOpenAiImport={(themeId, field) => {
          setAiImportThemeId(themeId);
          setAiImportField(field);
        }}
      />

      <AiImportModal
        isOpen={!!aiImportThemeId}
        themeName={aiImportThemeId ? state.themes.find(t => t.id === aiImportThemeId)?.name || '' : ''}
        initialField={aiImportField}
        onClose={() => setAiImportThemeId(null)}
        onImport={(tasks, mode, field) => {
          if (!aiImportThemeId) return;
          importThemeTasks(aiImportThemeId, tasks, mode, field);
        }}
      />

      {state.view === 'game' && (
        <GameView
          // key 用新局的 startedAt：startGame/rematch/continueHeatNight 都会生成新时间戳，
          // 强制重挂载清空 phase/diceValues/rollCount 等本地回合状态（否则先手不变时骰子卡死）；
          // 刷新时 startedAt 持久化不变，不会误伤 pendingLanding 恢复结算
          key={state.match.startedAt}
          players={state.players}
          boardMap={state.boardMap}
          pathCoords={state.pathCoords}
          currentTurn={state.turn}
          mode={state.mode}
          frozenPlayerId={state.frozenPlayerId}
          riggedRoll={state.riggedRoll}
          grantFeed={state.grantFeed}
          pendingLanding={state.pendingLanding}
          heat={state.heat}
          heatCeiling={state.heatCeiling}
          modalOpen={modalOpen}
          onMove={movePlayer}
          onResolveLanding={resolveLanding}
          onApplyMovement={applyMovement}
          onApplyOutcomeMeta={applyOutcomeMeta}
          onGainShield={gainShield}
          onGainHearts={gainHearts}
          onCheckMilestones={checkMilestones}
          onConsumeFrozen={consumeFrozen}
          onConsumeRigged={consumeRigged}
          onEndTurn={endTurn}
          onSetRolling={setIsRolling}
          onRecordRoll={recordRoll}
          onApplyBackfire={applyBackfire}
          onSetPendingLanding={setPendingLanding}
          onWin={handleWin}
          onTaskTrigger={handleTaskTrigger}
          onSyncTrigger={handleSyncTrigger}
          onOpenShop={() => setIsShopOpen(true)}
          onBack={handleBackFromGame}
          onOpenRules={() => setIsRulesOpen(true)}
        />
      )}
    </div>
  );
}

export default App;

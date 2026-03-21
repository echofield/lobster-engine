'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { workflows, getWorkflowById, getNodeById } from '@/data/workflows';
import { getChainById } from '@/data/signal-chains';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Mic,
  Sliders,
  Crown,
  Headphones,
  CheckCircle,
  Cable,
} from 'lucide-react';

const workflowIcons: Record<string, React.ReactNode> = {
  record: <Mic className="w-6 h-6" />,
  mix: <Sliders className="w-6 h-6" />,
  master: <Crown className="w-6 h-6" />,
  monitor: <Headphones className="w-6 h-6" />,
};

function GuidePageContent() {
  const { t, tr } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const workflowId = searchParams.get('workflow');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<{
    chainId?: string;
    message?: { fr: string; en: string };
  } | null>(null);

  // Get current workflow
  const workflow = workflowId ? getWorkflowById(workflowId) : null;

  // Initialize when workflow changes
  useEffect(() => {
    if (workflow) {
      setCurrentNodeId(workflow.entryNodeId);
      setHistory([]);
      setResult(null);
    } else {
      setCurrentNodeId(null);
      setHistory([]);
      setResult(null);
    }
  }, [workflow]);

  const currentNode = workflow && currentNodeId ? getNodeById(workflow, currentNodeId) : null;

  const handleOptionSelect = (optionId: string) => {
    if (!currentNode) return;

    const option = currentNode.options.find(o => o.id === optionId);
    if (!option) return;

    // Save to history
    setHistory(prev => [...prev, currentNodeId!]);

    // Check if this is a terminal option
    if (option.resultChainId || option.resultMessage) {
      setResult({
        chainId: option.resultChainId,
        message: option.resultMessage,
      });
      setCurrentNodeId(null);
    } else if (option.nextNodeId) {
      setCurrentNodeId(option.nextNodeId);
    }
  };

  const handleBack = () => {
    if (result) {
      // Go back from result to last question
      setResult(null);
      const lastNodeId = history[history.length - 1];
      if (lastNodeId) {
        setCurrentNodeId(lastNodeId);
        setHistory(prev => prev.slice(0, -1));
      }
    } else if (history.length > 0) {
      // Go back to previous question
      const previousNodeId = history[history.length - 1];
      setCurrentNodeId(previousNodeId);
      setHistory(prev => prev.slice(0, -1));
    } else {
      // Go back to workflow selection
      router.push('/guide');
    }
  };

  const handleRestart = () => {
    if (workflow) {
      setCurrentNodeId(workflow.entryNodeId);
      setHistory([]);
      setResult(null);
    }
  };

  // Workflow selection screen
  if (!workflow) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Compass className="w-8 h-8" />
            {t('nav_guide')}
          </h1>
          <p className="text-[var(--foreground-secondary)]">
            {t('guide_select_workflow')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map(w => (
            <Link
              key={w.id}
              href={`/guide?workflow=${w.id}`}
              className="p-6 rounded-lg bg-[var(--background-secondary)] border border-white/5 hover:border-[var(--accent)]/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center mb-4 text-[var(--accent)]">
                {workflowIcons[w.id] || <Compass className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-medium mb-2 group-hover:text-[var(--accent)] transition-colors">
                {tr(w.name)}
              </h2>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {tr(w.description)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    const chain = result.chainId ? getChainById(result.chainId) : null;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common_back')}
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <RotateCcw className="w-4 h-4" />
            {t('guide_restart')}
          </button>
        </div>

        {/* Result */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('guide_result')}</h1>
        </div>

        {/* Message */}
        {result.message && (
          <div className="p-4 rounded-lg bg-[var(--background-secondary)] mb-6">
            <p className="text-center">{tr(result.message)}</p>
          </div>
        )}

        {/* Chain Card */}
        {chain && (
          <div className="p-6 rounded-lg bg-[var(--background-secondary)] border border-white/5">
            <h2 className="text-xl font-medium mb-2">{tr(chain.name)}</h2>
            <p className="text-sm text-[var(--foreground-secondary)] mb-4">
              {tr(chain.description)}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-[var(--foreground-secondary)]">
                {chain.steps.length} {t('chain_steps').toLowerCase()}
              </span>
              <span className="text-[var(--foreground-secondary)]">·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                chain.difficulty === 'beginner'
                  ? 'bg-green-500/20 text-green-400'
                  : chain.difficulty === 'intermediate'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {t(`chain_${chain.difficulty}` as 'chain_beginner' | 'chain_intermediate' | 'chain_advanced')}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/chains/${chain.id}`}
                className="flex-1 py-2 px-4 rounded-md bg-white/10 hover:bg-white/20 text-center transition-colors"
              >
                {t('chain_view_chain')}
              </Link>
              <Link
                href={`/patchbay?chain=${chain.id}`}
                className="flex-1 py-2 px-4 rounded-md bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] text-center transition-colors flex items-center justify-center gap-2"
              >
                <Cable className="w-4 h-4" />
                {t('guide_open_in_patchbay')}
              </Link>
            </div>
          </div>
        )}

        {/* Back to guides */}
        <div className="mt-8 text-center">
          <Link
            href="/guide"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {t('guide_back_to_workflows')}
          </Link>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          {history.length > 0 ? t('common_back') : t('guide_back_to_workflows')}
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--foreground-secondary)]">
            {tr(workflow.name)}
          </span>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <RotateCcw className="w-4 h-4" />
            {t('guide_restart')}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-2">
          <span>{t('guide_step')} {history.length + 1}</span>
        </div>
        <div className="h-1 bg-[var(--background-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all"
            style={{ width: `${((history.length + 1) / (workflow.nodes.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {currentNode && (
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {tr(currentNode.question)}
          </h1>
          {currentNode.helpText && (
            <p className="text-[var(--foreground-secondary)] mb-6">
              {tr(currentNode.helpText)}
            </p>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {currentNode.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className="p-4 rounded-lg bg-[var(--background-secondary)] border border-white/5 hover:border-[var(--accent)]/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium group-hover:text-[var(--accent)] transition-colors">
                    {tr(option.label)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--foreground-secondary)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>}>
      <GuidePageContent />
    </Suspense>
  );
}

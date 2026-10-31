import React, { useMemo, useState } from 'react';
import { getHeliosAnswer, HELIOS_WELCOME } from '../../utils/helios';

export const HeliosWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(HELIOS_WELCOME);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('Product help · no account data loaded');

  const quickPrompts = useMemo(
    () => ['How do solar savings work?', 'Which installer fits my roof?', 'What is VNM?', 'Help me compare CAPEX vs RESCO'],
    []
  );

  const handleAsk = async (prompt: string) => {
    const nextQuestion = prompt.trim();
    if (!nextQuestion) return;
    if (loading) return;

    setLoading(true);
    setQuestion(nextQuestion);
    try {
      const reply = await getHeliosAnswer(nextQuestion);
      setAnswer(reply.answer);
      setSource(reply.source || 'Curated offline product help');
    } catch (error) { setAnswer((error as Error).message); setSource('Answer unavailable'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      {open && (
        <div className="mb-3 w-[300px] rounded-2xl border border-[#dbe9e2] bg-white p-3 shadow-[0_18px_40px_rgba(16,61,53,0.18)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006b57] text-lg text-white">☀️</span>
              <div>
                <div className="text-xs font-bold text-[#002620]">HELIOS</div>
                <div className="text-[10px] text-[#404846]">Solar sidekick</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-[#404846]">Close</button>
          </div>

          <div role="status" className="mb-2 rounded-xl bg-[#e8f6ff] p-2 text-[11px] leading-relaxed text-[#002620]">{answer}<div className="mt-2 text-[9px] text-[#677e72]">{source}</div></div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => handleAsk(prompt)}
                className="rounded-full border border-[#d6e5ee] bg-[#f4faff] px-2 py-1 text-[10px] text-[#006b57]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              aria-label="Ask Helios"
              maxLength={1500}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleAsk(question);
                }
              }}
              className="flex-1 rounded-lg border border-[#d6e5ee] bg-[#f8fbff] px-2.5 py-2 text-[11px] text-[#002620] outline-none"
              placeholder="Ask Helios..."
            />
            <button
              type="button"
              onClick={() => handleAsk(question)}
              disabled={loading}
              className="rounded-lg bg-[#006b57] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#006b57] text-2xl text-white shadow-[0_12px_28px_rgba(0,107,87,0.35)] transition-transform hover:scale-105"
        aria-label="Open Helios assistant"
      >
        ☀️
      </button>
    </div>
  );
};

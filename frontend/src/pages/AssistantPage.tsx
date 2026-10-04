import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Send, Sparkles, Clock, GitCommit } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [input, setInput] = useState('');

  const suggestedPrompts = [
    'Why did payment-service fail after 10:00 UTC?',
    'What was the blast radius of the v2.4 deployment?',
    'Show me all IAM security drift in production this week',
    'Which service has the highest MTTR in the last 14 days?',
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Reliability Assistant</h1>
            <p className="text-xs text-slate-400">
              Ask questions in plain English grounded in your telemetry, deployment audit logs, and incidents.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInput(prompt)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-left flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Display Box */}
      <Card className="min-h-[380px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
            <Bot className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-slate-200">
                ChangeSense Intelligence Agent Ready
              </p>
              <p className="text-slate-400">
                I can explain correlated anomalies, cite verified CloudTrail deployment IDs, and suggest remediation steps.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Cited Evidence:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/50 font-mono text-[10px] flex items-center gap-1">
                  <GitCommit className="w-3 h-3" /> payment-service:v2.4
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/50 font-mono text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 10:02 UTC Anomaly
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about incidents, root causes, or infrastructure drift..."
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Button
            variant="primary"
            size="sm"
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Ask
          </Button>
        </div>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { CustomerInsight } from '../types';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface CustomerInsightsProps {
  customerId: string;
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = ({ customerId }) => {
  const [insights, setInsights] = useState<CustomerInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.ai.customerInsights, { customerId });
      setInsights(res.data.data);
      setHasGenerated(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-500';
    if (score >= 4) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 7) return 'bg-emerald-500/15';
    if (score >= 4) return 'bg-amber-500/15';
    return 'bg-red-500/15';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return 'text-emerald-500 bg-emerald-500/15';
    if (risk === 'medium') return 'text-amber-500 bg-amber-500/15';
    return 'text-red-500 bg-red-500/15';
  };

  if (!hasGenerated) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <Brain size={40} className="mx-auto text-brand-accent/40 mb-3" />
        <h4 className="text-sm font-semibold text-brand-dark mb-1">AI-Powered Insights</h4>
        <p className="text-xs text-brand-muted mb-4">Generate engagement scores, churn risk analysis, and actionable recommendations.</p>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-xl hover:bg-brand-accent/90 transition-all disabled:opacity-50 shadow-md shadow-brand-accent/20"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap size={14} />
              Generate Insights
            </>
          )}
        </button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-brand-accent" />
          <h4 className="text-sm font-bold text-brand-dark">AI Insights</h4>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl p-4 ${getScoreBg(insights.engagement_score)}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className={getScoreColor(insights.engagement_score)} />
            <span className="text-xs font-medium text-brand-muted">Engagement</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(insights.engagement_score)}`}>
            {insights.engagement_score}<span className="text-sm font-normal text-brand-muted">/10</span>
          </p>
        </div>
        <div className={`rounded-xl p-4 ${getRiskColor(insights.churn_risk).split(' ')[1]}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={14} className={getRiskColor(insights.churn_risk).split(' ')[0]} />
            <span className="text-xs font-medium text-brand-muted">Churn Risk</span>
          </div>
          <p className={`text-lg font-bold capitalize ${getRiskColor(insights.churn_risk).split(' ')[0]}`}>
            {insights.churn_risk}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-background rounded-xl p-4 border border-border">
        <p className="text-sm text-brand-dark leading-relaxed">{insights.summary}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-0.5">Recommended Action</p>
            <p className="text-sm text-brand-dark">{insights.recommended_action}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Zap size={14} className="text-brand-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-0.5">Next Best Step</p>
            <p className="text-sm text-brand-dark">{insights.next_best_step}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

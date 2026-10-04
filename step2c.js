const fs = require('fs');

let row = fs.readFileSync('client/src/components/dashboard/ReviewRow.tsx', 'utf8');

if (!row.includes('mapErrorCode')) {
  const code = `
function mapErrorCode(errorData?: any) {
  if (!errorData) return 'An unknown error occurred during analysis.';
  const code = typeof errorData === 'string' ? errorData : errorData.code;
  switch (code) {
    case 'REPO_UNREACHABLE': return 'Repository is unreachable or private.';
    case 'NO_CODE_CHANGED': return 'No supported code files found to review.';
    case 'API_RATE_LIMIT': return 'GitHub API rate limit exceeded. Try again later.';
    case 'AI_SERVICE_UNAVAILABLE': return 'Analysis engine is temporarily unavailable.';
    case 'USAGE_LIMIT_EXCEEDED': return 'Subscription quota exhausted.';
    default: return typeof errorData === 'string' ? errorData : (errorData.message || 'An unknown error occurred.');
  }
}
`;

  row = row.replace('import { getScoreBand, getReviewTitleFallback } from \'@/lib/utils\';', "import { getScoreBand, getReviewTitleFallback } from '@/lib/utils';\nimport { useState } from 'react';");
  row = row.replace("import { Trash2, AlertCircle, Clock, RefreshCw } from 'lucide-react';", "import { Trash2, AlertCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';");
  
  // Add mapping function
  row = row + code;
  
  // Update failure render
  const failRenderOld = `<span className="text-[12px] font-medium text-red-400">Failed</span>
            {onRetry && (
              <button 
                onClick={(e) => { e.preventDefault(); onRetry(review.id); }}
                className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title="Retry review"
              >
                <RefreshCw size={14} />
              </button>
            )}`;
            
  const failRenderNew = `<div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[12px] font-medium text-[#f87171]">Failed</span>
                <span className="text-[10px] text-[#616161] max-w-[150px] truncate" title={mapErrorCode(review.error)}>{mapErrorCode(review.error)}</span>
              </div>
              {onRetry && (
                <button 
                  onClick={(e) => { e.preventDefault(); onRetry(review.id); }}
                  className="p-1.5 text-[#898989] hover:text-[#e8e8e8] hover:bg-white/10 rounded-md transition-colors"
                  title="Retry review"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>`;
            
  row = row.replace(failRenderOld, failRenderNew);
  fs.writeFileSync('client/src/components/dashboard/ReviewRow.tsx', row);
}

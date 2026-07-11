import { TrendingUp, TrendingDown, DollarSign, Percent, Building2, Globe } from 'lucide-react';

export default function MarketDataCard({ data }) {
  if (!data) return null;
  
  const formatMarketCap = (cap) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  return (
    <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-900">{data.name}</h4>
          <span className="text-sm font-mono text-slate-500">{data.symbol}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            ${data.price?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">{data.currency}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {data.pe_ratio && (
          <div className="flex items-center gap-2 text-sm">
            <Percent className="w-4 h-4 text-blue-500" />
            <span className="text-slate-600">P/E: <span className="font-semibold text-slate-900">{data.pe_ratio}</span></span>
          </div>
        )}
        {data.dividend_yield !== null && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600">Div: <span className="font-semibold text-slate-900">{data.dividend_yield}%</span></span>
          </div>
        )}
        {data.market_cap && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span className="text-slate-600">Cap: <span className="font-semibold text-slate-900">{formatMarketCap(data.market_cap)}</span></span>
          </div>
        )}
        {data.sector && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-orange-500" />
            <span className="text-slate-600">Sector: <span className="font-semibold text-slate-900">{data.sector}</span></span>
          </div>
        )}
      </div>
      
      {(data.fifty_two_week_high && data.fifty_two_week_low) && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>52W Low: ${data.fifty_two_week_low}</span>
            <span>52W High: ${data.fifty_two_week_high}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, ((data.price - data.fifty_two_week_low) / (data.fifty_two_week_high - data.fifty_two_week_low)) * 100))}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
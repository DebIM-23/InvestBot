import { User, Bot } from 'lucide-react';
import MarketDataCard from './MarketDataCard';

export default function MessageBubble({ message, marketData }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-slate-200'
      }`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-slate-700" />}
      </div>
      
      <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
        {!isUser && marketData && marketData.map((data, i) => (
          <MarketDataCard key={i} data={data} />
        ))}
      </div>
    </div>
  );
}
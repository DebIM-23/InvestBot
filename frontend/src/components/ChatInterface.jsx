import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import MessageBubble from './MessageBubble';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '⚠️ This is educational information, not financial advice.\n\nHi! I\'m InvestBot. Ask me about any US stock (like AAPL or MSFT), ETF, or investment concept. I\'ll fetch live data and explain it in plain English.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('investbot_session') || crypto.randomUUID());
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Save session ID
  useEffect(() => {
    localStorage.setItem('investbot_session', sessionId);
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    setLoading(true);
    
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const res = await axios.post(`${API_URL}/api/chat`, {
        message: userMessage,
        sessionId
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message,
        marketData: res.data.marketData
      }]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">₹</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">InvestBot</h1>
            <p className="text-xs text-slate-500">Educational Investment Assistant • Live Market Data</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <MessageBubble 
              key={i} 
              message={msg} 
              marketData={msg.marketData} 
            />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing markets...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about AAPL, MSFT, ETFs, or investment concepts..."
              className="flex-1 px-4 py-3 bg-slate-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 placeholder-slate-400"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            ⚠️ This bot provides educational information only. Not financial advice. Market data delayed.
          </p>
        </div>
      </div>
    </div>
  );
}
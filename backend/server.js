import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// SQLite setup
const db = await open({
  filename: './chat.db',
  driver: sqlite3.Database
});

// Ensure tables exist
await db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    market_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id, created_at);
`);

// Extract stock symbols
function extractSymbols(text) {
  const commonWords = new Set([
    'I','A','AN','THE','IS','IT','TO','OF','IN','FOR','ON','AT','BE','ARE','WAS',
    'WERE','BEEN','HAVE','HAS','HAD','DO','DOES','DID','WILL','WOULD','COULD',
    'SHOULD','MAY','MIGHT','CAN','SHALL','US','WE','HE','SHE','THEY','THEM','ME',
    'MY','YOUR','HIS','HER','ITS','OUR','AND','OR','BUT','SO','YET','IF','THEN',
    'THAN','THAT','THIS','THESE','THOSE','WITH','FROM','UP','ABOUT','INTO','OVER',
    'AFTER','BEFORE','UNDER','AGAIN','FURTHER','ONCE','HERE','THERE','WHEN','WHERE',
    'WHY','HOW','ALL','ANY','BOTH','EACH','FEW','MORE','MOST','OTHER','SOME','SUCH',
    'NO','NOR','NOT','ONLY','OWN','SAME','VERY','JUST','NOW','ALSO','BACK','GO','GOING',
    'GONE','GET','GETTING','GOT','MAKE','MAKING','MADE','TAKE','TAKING','TAKEN','COME',
    'CAME','COMING','KNOW','KNEW','KNOWN','SEE','SAW','SEEN','THINK','THOUGHT','LOOK',
    'LOOKED','WANT','WANTED','USE','USED','FIND','FOUND','GIVE','GAVE','GIVEN','TELL',
    'TOLD','ASK','ASKED','WORK','WORKED','FEEL','FELT','TRY','TRIED','LEAVE','LEFT',
    'CALL','CALLED','GOOD','NEW','FIRST','LAST','LONG','GREAT','LITTLE','OLD','RIGHT',
    'BIG','HIGH','DIFFERENT','SMALL','LARGE','NEXT','EARLY','YOUNG','IMPORTANT','PUBLIC',
    'BAD','BEST','BETTER','SURE','FREE','FULL','HALF','REAL','TRUE','WHOLE','YES','WAY',
    'DAY','MAN','TIME','THING','YEAR','PEOPLE','WORLD','LIFE','HAND','PART','EYE','PLACE',
    'WEEK','CASE','POINT','GOVERNMENT','COMPANY','NUMBER','GROUP','PROBLEM','FACT','SAY',
    'SEEM','TRY','LEAVE','GOOD','BAD','BUY','SELL','STOCK','MARKET','PRICE','MONEY','INVEST',
    'INVESTING','INVESTOR','PORTFOLIO','SHARE','DIVIDEND','YIELD','EARNINGS','REVENUE',
    'PROFIT','LOSS','TRADE','TRADING','FUND','ETF','BOND','INDEX','NASDAQ','DOW','SP500',
    'CRYPTO','BITCOIN','ETHEREUM','FOREX','GOLD','SILVER','OIL','GAS','TECH','ENERGY',
    'HEALTHCARE','FINANCE','BANK','REIT','IPO','MERGER','ACQUISITION','BULL','BEAR','SHORT',
    'LONG','CALL','PUT','OPTION','FUTURE','COMMODITY','SECTOR','INDUSTRY','ANALYST','RATING',
    'OUTPERFORM','UNDERPERFORM','HOLD','STRONG','WEAK','GROWTH','VALUE','INCOME','CAPITAL',
    'GAINS','TAXES','RETIREMENT','K','IRA','ROTH','PENSION','SAVINGS','CHECKING','DEBIT',
    'CREDIT','LOAN','MORTGAGE','INTEREST','RATE','FED','FEDERAL','RESERVE','INFLATION',
    'RECESSION','DEPRESSION','EXPANSION','CONTRACTION','GDP','UNEMPLOYMENT','EMPLOYMENT',
    'JOBS','WAGES','SALARY','INCOME','EXPENSE','BUDGET','DEBT','EQUITY','ASSET','LIABILITY',
    'NET','WORTH','CASH','FLOW','LIQUID','SOLVENT','BANKRUPT','DEFAULT','CREDIT','SCORE',
    'REPORT','BUREAU','TRANSUNION','EQUIFAX','EXPERIAN','FICO','VANTAGE','SCORE','RATING',
    'GRADE','RANK','LEVEL','TIER','CLASS','CATEGORY','TYPE','KIND','SORT','FORM','SHAPE',
    'SIZE','COLOR','RED','BLUE','GREEN','YELLOW','BLACK','WHITE','GRAY','PINK','PURPLE',
    'ORANGE','BROWN','TAN','BEIGE','CREAM','IVORY','GOLD','SILVER','BRONZE','COPPER','METAL',
    'STEEL','IRON','ALUMINUM','TITANIUM','PLATINUM','NICKEL','ZINC','LEAD','TIN','MERCURY',
    'CARBON','OXYGEN','NITROGEN','HYDROGEN','HELIUM','NEON','ARGON','KRYPTON','XENON','RADON',
    'URANIUM','PLUTONIUM','THORIUM','RADIUM','POLONIUM','BISMUTH','ANTIMONY','ARSENIC','SELENIUM',
    'BROMINE','IODINE','ASTATINE','TENNESSINE','CHLORINE','FLUORINE','PHOSPHORUS','SULFUR','BORON',
    'SILICON','GERMANIUM','ARSENIC','ANTIMONY','TELLURIUM','POLONIUM','LIVERMORIUM','MOSCOVIUM',
    'TENNESSINE','OGANESSON','UNUNennium','ROENTGENIUM','COPERNICIUM','NIHONIUM','FLEROVIUM',
    'MENDELEVIUM','FERMIUM','EINSTEINIUM','CALIFORNIUM','BERKELIUM','CURIUM','AMERICIUM',
    'PLUTONIUM','NEPTUNIUM','URANIUM','PROTACTINIUM','THORIUM','ACTINIUM','RADIUM','FRANCIUM',
    'RADIUM','ASTATINE','POLONIUM','BISMUTH','LEAD','THALLIUM','MERCURY','GOLD','PLATINUM',
    'IRIDIUM','OSMIUM','TUNGSTEN','TANTALUM','HAFNIUM','RHENIUM','TECHNETIUM','MANGANESE',
    'CHROMIUM','VANADIUM','TITANIUM','SCANDIUM','CALCIUM','POTASSIUM','ARGON','CHLORINE','SULFUR',
    'PHOSPHORUS','SILICON','ALUMINUM','MAGNESIUM','SODIUM','NEON','FLUORINE','OXYGEN','NITROGEN',
    'CARBON','BORON','BERYLLIUM','LITHIUM','HELIUM','HYDROGEN'
  ]);
  
  const matches = text.match(/\b[A-Z]{1,5}\b/g);
  if (!matches) return [];
  return matches.filter(sym => !commonWords.has(sym) && sym.length >= 1);
}

// Fetch market data
async function fetchMarketData(symbols) {
  const results = [];
  for (const symbol of symbols.slice(0, 3)) {
    try {
      const res = await axios.post(`${PYTHON_SERVICE}/api/stock`, { symbol }, { timeout: 8000 });
      results.push(res.data);
    } catch (err) {
      console.log(`Failed to fetch ${symbol}:`, err.message);
    }
  }
  return results;
}

// Build system instruction for Gemini
function buildSystemInstruction(marketData) {
  const dataContext = marketData.length > 0
    ? `CURRENT MARKET DATA:\n${JSON.stringify(marketData, null, 2)}`
    : 'No specific stock data requested. Provide general investment education.';

  return `You are InvestBot, an educational investment assistant. Your goal is to demystify the US stock market using plain English.

CRITICAL RULES:
1. ALWAYS start your response with exactly: "⚠️ This is educational information, not financial advice."
2. When discussing volatile, speculative, or high-risk assets, explicitly flag: "🚨 Risk Alert: This asset carries significant volatility."
3. If market data is provided, reference specific numbers (price, P/E, dividend yield) naturally in your explanation.
4. Explain concepts simply. Avoid jargon unless you immediately define it.
5. If the user asks about a specific stock, provide: current price context, valuation perspective (P/E), income perspective (dividend), and one risk factor.
6. Keep responses concise (3-5 paragraphs max).
7. If you don't know something, say so rather than making up data.
8. Maintain conversation context — if the user asks a follow-up question, reference previous topics.

${dataContext}`;
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const sid = sessionId || uuidv4();
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Save user message
    await db.run(
      'INSERT INTO conversations (session_id, role, content) VALUES (?, ?, ?)',
      [sid, 'user', message]
    );
    
    // Extract symbols and fetch data
    const symbols = extractSymbols(message);
    const marketData = await fetchMarketData(symbols);
    
    // Get conversation history (last 10 messages)
    const history = await db.all(
      `SELECT role, content FROM conversations 
       WHERE session_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [sid]
    );
    history.reverse();
    
    // Build Gemini conversation
    // Gemini expects: user, model, user, model... alternating
    const geminiHistory = [];
    for (let i = 0; i < history.length - 1; i++) {
      const h = history[i];
      if (h.role === 'user') {
        geminiHistory.push({ role: 'user', parts: [{ text: h.content }] });
      } else if (h.role === 'assistant') {
        geminiHistory.push({ role: 'model', parts: [{ text: h.content }] });
      }
    }
    
    // Current user message
    const userMessage = history[history.length - 1].content;
    
    // Start chat with system instruction + history
    const chat = model.startChat({
      systemInstruction: buildSystemInstruction(marketData),
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      }
    });
    
    const result = await chat.sendMessage(userMessage);
    const assistantContent = result.response.text();
    
    // Save assistant message
    await db.run(
      'INSERT INTO conversations (session_id, role, content, market_data) VALUES (?, ?, ?, ?)',
      [sid, 'assistant', assistantContent, marketData.length > 0 ? JSON.stringify(marketData) : null]
    );
    
    res.json({
      message: assistantContent,
      sessionId: sid,
      marketData: marketData.length > 0 ? marketData : null
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversation history
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT role, content, market_data, created_at FROM conversations 
       WHERE session_id = ? 
       ORDER BY created_at ASC`,
      [req.params.sessionId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-api-gemini', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Chat API (Gemini 1.5 Flash) running on port ${PORT}`);
  console.log(`📊 Python service: ${PYTHON_SERVICE}`);
});
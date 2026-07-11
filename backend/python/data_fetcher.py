from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
import uvicorn

app = FastAPI(title="Market Data Service")

class StockRequest(BaseModel):
    symbol: str

@app.post("/api/stock")
async def get_stock_data(request: StockRequest):
    try:
        ticker = yf.Ticker(request.symbol)
        info = ticker.info
        
        # Get latest price
        hist = ticker.history(period="5d")
        current_price = hist['Close'].iloc[-1] if not hist.empty else info.get('currentPrice')
        
        # Handle None values gracefully
        dividend_yield = info.get('dividendYield')
        if dividend_yield and dividend_yield > 1:
            dividend_yield = dividend_yield / 100  # yfinance sometimes returns raw %

        trailing_pe = info.get('trailingPE')
        pe_ratio = round(trailing_pe, 2) if trailing_pe is not None else None

        return {
            "symbol": request.symbol.upper(),
            "name": info.get('longName') or info.get('shortName') or request.symbol.upper(),
            "price": round(current_price, 2) if current_price else None,
            "currency": info.get('currency', 'USD'),
            "market_cap": info.get('marketCap'),
            "pe_ratio": pe_ratio,
            "dividend_yield": round(dividend_yield * 100, 2) if dividend_yield else None,
            "fifty_two_week_high": info.get('fiftyTwoWeekHigh'),
            "fifty_two_week_low": info.get('fiftyTwoWeekLow'),
            "sector": info.get('sector'),
            "industry": info.get('industry'),
            "website": info.get('website')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "market-data"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
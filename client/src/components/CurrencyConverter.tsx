import { useState, useEffect } from 'react';
import { currencyAPI } from '../utils/api';
import CurrencyTrendChart from './CurrencyTrendChart';
import './CurrencyConverter.css';

function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  // Default currencies in case API fails
  const defaultCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'INR', 'BRL', 'ZAR', 'KRW'];
  const [currencies, setCurrencies] = useState<string[]>(defaultCurrencies);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await currencyAPI.getSupported();
      if (response.data && response.data.currencies && response.data.currencies.length > 0) {
        setCurrencies(response.data.currencies);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Keep default currencies if API fails
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await currencyAPI.convert(parseFloat(amount), from, to);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="currency-converter">
      <h3>Currency Converter</h3>
      <form onSubmit={handleConvert}>
        <div className="converter-input-group">
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="converter-select-group">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {currencies.length > 0 ? (
              currencies.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))
            ) : (
              <>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </>
            )}
          </select>
          <button type="button" onClick={swapCurrencies} className="swap-btn" title="Swap currencies">
            ⇄
          </button>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {currencies.length > 0 ? (
              currencies.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))
            ) : (
              <>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </>
            )}
          </select>
        </div>
        {error && <div className="converter-error">{error}</div>}
        <button type="submit" disabled={loading} className="convert-btn">
          {loading ? 'Converting...' : 'Convert'}
        </button>
        {result && (
          <div className="converter-result">
            <div className="result-amount">
              {result.amount} {result.from} = <strong>{result.convertedAmount} {result.to}</strong>
            </div>
            <div className="result-rate">
              Rate: 1 {result.from} = {result.rate.toFixed(4)} {result.to}
            </div>
            {result.updateFrequency && (
              <div className="result-note">
                <small>Note: {result.updateFrequency}</small>
              </div>
            )}
          </div>
        )}
      </form>
      {/* 实时汇率趋势图 */}
      <CurrencyTrendChart from={from} to={to} />
    </div>
  );
}

export default CurrencyConverter;



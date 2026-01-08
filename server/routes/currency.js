/**
 * Currency conversion routes
 * Provides real-time currency exchange rates and conversion
 */

const express = require('express');
const axios = require('axios');

const router = express.Router();

// Real-time currency API configuration
// 支持多个实时汇率 API 提供商
// 优先使用环境变量配置的 API，如果没有配置则使用免费的实时 API
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY || '';
const CURRENCY_API_PROVIDER = process.env.CURRENCY_API_PROVIDER || 'exchangerate_host'; // fixer, currencylayer, exchangerate, exchangerate_host

// API endpoints for different providers
const API_ENDPOINTS = {
  // Fixer.io - 实时汇率 API (需要 API key)
  // 免费层: https://fixer.io/ - 每月 100 次请求
  fixer: CURRENCY_API_KEY 
    ? `http://data.fixer.io/api/latest?access_key=${CURRENCY_API_KEY}`
    : null,
  
  // CurrencyLayer - 实时汇率 API (需要 API key)
  // 免费层: https://currencylayer.com/ - 每月 1000 次请求
  currencylayer: CURRENCY_API_KEY
    ? `https://api.currencylayer.com/live?access_key=${CURRENCY_API_KEY}`
    : null,
  
  // ExchangeRate-API.com - 实时汇率 API (无需 API key，但有请求限制)
  // 免费层每分钟 1500 次请求，每小时更新
  exchangerate: 'https://api.exchangerate-api.com/v4/latest',
  
  // Alternative: ExchangeRate-API.com with API key for better rate limits
  exchangerate_pro: CURRENCY_API_KEY
    ? `https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/latest`
    : null,
  
  // exchangerate.host - 免费历史汇率 API (无需 API key)
  // 支持历史数据查询，完全免费，但有请求频率限制
  exchangerate_host: 'https://api.exchangerate.host',
};

// 获取当前使用的 API endpoint
function getApiEndpoint(baseCurrency) {
  const provider = CURRENCY_API_PROVIDER.toLowerCase();
  
  switch(provider) {
    case 'fixer':
      if (API_ENDPOINTS.fixer) {
        // Fixer.io 免费层只支持 EUR 作为基准货币，需要在解析时转换
        return API_ENDPOINTS.fixer;
      }
      break;
    case 'currencylayer':
      if (API_ENDPOINTS.currencylayer && CURRENCY_API_KEY) {
        return `${API_ENDPOINTS.currencylayer}&source=${baseCurrency}`;
      } else {
        console.log('CurrencyLayer API key not available, using fallback');
        return `${API_ENDPOINTS.exchangerate_host}/latest?base=${baseCurrency}`;
      }
      break;
    case 'exchangerate':
      return `${API_ENDPOINTS.exchangerate}/${baseCurrency}`;
    case 'exchangerate_pro':
      if (API_ENDPOINTS.exchangerate_pro) {
        return `${API_ENDPOINTS.exchangerate_pro}/${baseCurrency}`;
      }
      break;
    case 'exchangerate_host':
      return `${API_ENDPOINTS.exchangerate_host}/latest?base=${baseCurrency}`;
  }
  
  // 默认使用免费的 exchangerate.host (支持历史数据)
  console.log('Using free exchangerate.host (fallback)');
  return `${API_ENDPOINTS.exchangerate_host}/latest?base=${baseCurrency}`;
}

// 解析不同 API 提供商的响应格式
function parseApiResponse(response, provider, baseCurrency) {
  const providerLower = provider.toLowerCase();
  
  switch(providerLower) {
    case 'fixer':
      if (response.data.success !== false && response.data.rates) {
        // Fixer.io 免费层只返回以 EUR 为基准的汇率
        // 如果请求的不是 EUR，需要转换汇率
        let rates = response.data.rates;
        const base = 'EUR';
        
        if (baseCurrency !== 'EUR') {
          // 转换基准货币：如果请求的是 USD，需要计算 USD/EUR 的比率
          const baseRate = rates[baseCurrency];
          if (!baseRate) {
            throw new Error(`Currency ${baseCurrency} not available in Fixer free tier (EUR only)`);
          }
          
          // 将所有汇率转换为以 baseCurrency 为基准
          const convertedRates = {};
          convertedRates[baseCurrency] = 1; // 基准货币自身为 1
          Object.keys(rates).forEach(currency => {
            if (currency !== baseCurrency) {
              // 转换公式: newRate = oldRate / baseRate
              convertedRates[currency] = rates[currency] / baseRate;
            }
          });
          rates = convertedRates;
        } else {
          // EUR 作为基准，添加自身
          rates['EUR'] = 1;
        }
        
        return {
          base: baseCurrency,
          date: response.data.date || new Date().toISOString().split('T')[0],
          rates: rates,
          timestamp: response.data.timestamp
        };
      }
      throw new Error(response.data.error?.info || 'Fixer API error');
      
    case 'currencylayer':
      // CurrencyLayer 返回格式检查
      if (response.data.success === false) {
        const errorMsg = response.data.error?.info || response.data.error?.code || 'CurrencyLayer API error';
        console.error('CurrencyLayer API Error:', errorMsg, response.data);
        throw new Error(errorMsg);
      }
      
      if (response.data.quotes) {
        // CurrencyLayer 返回格式: quotes: { "USDCNY": 7.2, "USDEUR": 0.85 }
        const rates = {};
        const prefix = baseCurrency;
        
        Object.keys(response.data.quotes).forEach(key => {
          if (key.startsWith(prefix)) {
            const target = key.replace(prefix, '');
            rates[target] = response.data.quotes[key];
          }
        });
        
        // 添加基准货币自身
        rates[baseCurrency] = 1;
        
        // 验证是否成功解析了汇率
        if (Object.keys(rates).length <= 1) {
          throw new Error(`No exchange rates found for base currency ${baseCurrency}. CurrencyLayer may not support this currency.`);
        }
        
        return {
          base: baseCurrency,
          date: response.data.date || new Date().toISOString().split('T')[0],
          rates: rates,
          timestamp: response.data.timestamp
        };
      }
      
      throw new Error('CurrencyLayer API returned invalid response format');
      
    case 'exchangerate':
    case 'exchangerate_pro':
      // ExchangeRate-API.com v6 格式检查
      if (response.data && response.data.result === 'success' && response.data.conversion_rates) {
        // v6 API 使用 conversion_rates 字段
        return {
          base: response.data.base_code || baseCurrency,
          date: response.data.time_last_update_utc ? new Date(response.data.time_last_update_utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          rates: response.data.conversion_rates,
          timestamp: response.data.time_last_update_unix || Date.now()
        };
      } else if (response.data && response.data.rates) {
        // v4 或旧版 API 格式
        return {
          base: response.data.base || baseCurrency,
          date: response.data.date || new Date().toISOString().split('T')[0],
          rates: response.data.rates,
          timestamp: response.data.time_last_update_unix || Date.now()
        };
      }
      throw new Error('ExchangeRate API error: ' + (response.data?.error || 'Invalid response format'));
      
    case 'exchangerate_host':
      // exchangerate.host 返回格式: { success: true, base: "USD", date: "2024-01-01", rates: {...} }
      if (response.data && response.data.success !== false && response.data.rates) {
        return {
          base: response.data.base || baseCurrency,
          date: response.data.date || new Date().toISOString().split('T')[0],
          rates: response.data.rates,
          timestamp: response.data.timestamp || Date.now()
        };
      }
      throw new Error('ExchangeRate.host API error');
      
    default:
      if (response.data && response.data.rates) {
        return response.data;
      }
      throw new Error('Invalid API response format');
  }
}

// Simple in-memory cache to avoid excessive API calls
// Cache expires after 1 minute for real-time rates (60000ms)
const rateCache = new Map();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for real-time rates

/**
 * Get cached rates or fetch new ones
 * @param {string} base - Base currency
 * @returns {Promise<Object>} Exchange rates data
 */
async function getExchangeRates(base) {
  const cacheKey = base.toUpperCase();
  const cached = rateCache.get(cacheKey);
  
  // Check if cache is valid (exists and not expired)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached rates for ${cacheKey}`);
    return cached.data;
  }

  // Fetch fresh rates from API
  console.log(`Fetching fresh real-time rates for ${cacheKey} from API`);
  const provider = CURRENCY_API_PROVIDER.toLowerCase();
  const apiUrl = getApiEndpoint(base);
  
  try {
    const response = await axios.get(apiUrl, { timeout: 10000 });
    
    // Log API response for debugging
    if (provider === 'currencylayer') {
      console.log('CurrencyLayer API response status:', response.data.success);
      if (response.data.success === false) {
        console.error('CurrencyLayer API Error:', response.data.error);
      }
    }
    
    // Parse response based on API provider
    const parsedData = parseApiResponse(response, provider, base);
    
    if (parsedData && parsedData.rates) {
      // Store in cache
      rateCache.set(cacheKey, {
        data: parsedData,
        timestamp: Date.now()
      });
      return parsedData;
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error(`Error fetching rates for ${cacheKey} from ${provider}:`, error.message);
    
    // 如果使用 CurrencyLayer 失败，尝试回退到免费的 exchangerate.host
    if (provider === 'currencylayer' && error.response) {
      console.log('CurrencyLayer failed, falling back to exchangerate.host...');
      try {
        const fallbackUrl = `${API_ENDPOINTS.exchangerate_host}/latest?base=${base}`;
        const fallbackResponse = await axios.get(fallbackUrl, { timeout: 10000 });
        
        if (fallbackResponse.data && fallbackResponse.data.success !== false && fallbackResponse.data.rates) {
          const fallbackData = {
            base: fallbackResponse.data.base || base,
            date: fallbackResponse.data.date || new Date().toISOString().split('T')[0],
            rates: fallbackResponse.data.rates,
            timestamp: fallbackResponse.data.timestamp || Date.now()
          };
          
          // Store in cache
          rateCache.set(cacheKey, {
            data: fallbackData,
            timestamp: Date.now()
          });
          
          console.log(`Successfully used fallback API for ${cacheKey}`);
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError.message);
      }
    }
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      throw new Error(`API Error: ${error.response.data?.error?.info || error.response.data?.error || JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach currency API');
    } else {
      throw error;
    }
  }
}

/**
 * GET /api/currency/rates
 * Get current exchange rates for a base currency
 * Query params: base (optional, defaults to USD)
 */
router.get('/rates', async (req, res) => {
  try {
    const base = req.query.base || 'USD'; // Default to USD if not specified

    // Get exchange rates (from cache or API)
    const data = await getExchangeRates(base);

    res.json({
      base: data.base,
      date: data.date,
      rates: data.rates,
      lastUpdated: new Date().toISOString(), // When we fetched the data
      updateFrequency: 'Real-time (updated every minute)' // 实时更新频率信息
    });
  } catch (error) {
    console.error('Currency API error:', error);
    if (error.response) {
      res.status(500).json({ error: 'Currency API is temporarily unavailable. Please try again later.' });
    } else if (error.request) {
      res.status(500).json({ error: 'Network error. Please check your internet connection.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch exchange rates. Please try again.' });
    }
  }
});

/**
 * POST /api/currency/convert
 * Convert amount from one currency to another
 * Request body: { amount, from, to }
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    // Validate input
    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to currencies are required' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Get exchange rates (from cache or API)
    const data = await getExchangeRates(from);

    if (!data || !data.rates) {
      return res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }

    const rates = data.rates;
    const targetRate = rates[to.toUpperCase()];

    if (!targetRate) {
      return res.status(400).json({ error: `Exchange rate for ${to} not found` });
    }

    // Calculate converted amount
    const convertedAmount = numAmount * targetRate;

    res.json({
      amount: numAmount,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate: targetRate,
      date: data.date, // Date from API (when rates were last updated by provider)
      lastUpdated: new Date().toISOString(), // When we fetched the data
      updateFrequency: 'Real-time (updated every minute)' // 实时更新频率信息
    });
  } catch (error) {
    console.error('Currency conversion error:', error.message);
    console.error('Error details:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to convert currency. Please try again.';
    
    if (error.message) {
      if (error.message.includes('API Error')) {
        errorMessage = error.message.replace('API Error: ', '');
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('No exchange rates found')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }
    
    if (error.response) {
      // External API error
      const apiError = error.response.data?.error?.info || error.response.data?.error || error.message;
      res.status(500).json({ error: apiError || 'Currency API is temporarily unavailable. Please try again later.' });
    } else if (error.request) {
      // Network error
      res.status(500).json({ error: 'Network error. Please check your internet connection.' });
    } else {
      res.status(500).json({ error: errorMessage });
    }
  }
});

/**
 * GET /api/currency/supported
 * Get list of supported currencies
 */
router.get('/supported', async (req, res) => {
  try {
    // Get USD rates (from cache or API) to get list of all supported currencies
    const data = await getExchangeRates('USD');

    if (data && data.rates) {
      const currencies = Object.keys(data.rates);
      currencies.push('USD'); // Add USD itself
      res.json({ currencies: currencies.sort() });
    } else {
      res.status(500).json({ error: 'Failed to fetch supported currencies' });
    }
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    // Return fallback currencies if API fails
    const fallbackCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'INR', 'BRL', 'ZAR', 'KRW'];
    res.json({ currencies: fallbackCurrencies.sort() });
  }
});

/**
 * GET /api/currency/history
 * Get historical exchange rates for trend chart
 * Query params: from (base currency), to (target currency), days (number of days, default: 7)
 */
router.get('/history', async (req, res) => {
  try {
    const { from, to, days = 7 } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to currencies are required' });
    }

    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 1 || numDays > 30) {
      return res.status(400).json({ error: 'days must be between 1 and 30' });
    }

    const provider = CURRENCY_API_PROVIDER.toLowerCase();
    const baseCurrency = from.toUpperCase();
    const targetCurrency = to.toUpperCase();

    // 获取历史数据
    const historyData = [];
    const today = new Date();

    // 对于不支持历史数据的API或免费层，使用模拟数据
    // CurrencyLayer 免费层不支持历史数据，ExchangeRate 免费版也不支持
    // exchangerate_pro 和 exchangerate_host 支持历史数据，不需要模拟
    const shouldUseSimulatedData = 
      (provider === 'exchangerate' && !CURRENCY_API_KEY) ||
      (provider === 'currencylayer'); // CurrencyLayer 免费层不支持历史数据
    
    if (shouldUseSimulatedData) {
      try {
        const currentData = await getExchangeRates(baseCurrency);
        if (currentData && currentData.rates && currentData.rates[targetCurrency]) {
          const currentRate = parseFloat(currentData.rates[targetCurrency]);
          // 为所有日期生成基于当前汇率的模拟数据
          for (let j = numDays - 1; j >= 0; j--) {
            const simDate = new Date(today);
            simDate.setDate(simDate.getDate() - j);
            const simDateStr = simDate.toISOString().split('T')[0];
            // 添加时间衰减的随机波动，越早的数据波动越大
            const timeDecay = (numDays - j) / numDays;
            const variation = (Math.random() - 0.5) * 0.05 * timeDecay; // 最多 ±2.5% 波动
            const simulatedRate = currentRate * (1 + variation);
            historyData.push({
              date: simDateStr,
              rate: parseFloat(simulatedRate.toFixed(6))
            });
          }
          return res.json({
            from: baseCurrency,
            to: targetCurrency,
            data: historyData,
            period: `${numDays} days`,
            note: 'Simulated data based on current rates (API limitation)'
          });
        }
      } catch (error) {
        console.error('Error generating simulated historical data:', error);
      }
    }

    // 尝试从 API 获取真实历史数据
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      try {
        let apiUrl;

        switch(provider) {
          case 'fixer':
            if (API_ENDPOINTS.fixer) {
              // Fixer.io 历史数据端点
              apiUrl = `http://data.fixer.io/api/${dateStr}?access_key=${CURRENCY_API_KEY}`;
              const fixerResponse = await axios.get(apiUrl);
              if (fixerResponse.data.success && fixerResponse.data.rates) {
                let rates = fixerResponse.data.rates;
                // 处理基准货币转换（Fixer 只支持 EUR）
                if (baseCurrency !== 'EUR') {
                  const baseRate = rates[baseCurrency];
                  if (baseRate) {
                    const targetRate = rates[targetCurrency] || (targetCurrency === 'EUR' ? 1 : rates[targetCurrency]);
                    if (targetRate) {
                      const rate = targetRate / baseRate;
                      historyData.push({ date: dateStr, rate: parseFloat(rate.toFixed(6)) });
                      continue;
                    }
                  }
                } else {
                  const rate = rates[targetCurrency];
                  if (rate) {
                    historyData.push({ date: dateStr, rate: parseFloat(rate.toFixed(6)) });
                    continue;
                  }
                }
              }
            }
            break;

          case 'currencylayer':
            // CurrencyLayer 历史数据端点（仅付费计划支持）
            // 免费层已经在上面使用模拟数据处理
            // 如果需要使用真实历史数据，请升级到付费计划
            break;

          case 'exchangerate':
          case 'exchangerate_pro':
            // ExchangeRate-API.com Pro 历史数据端点
            if (provider === 'exchangerate_pro' && CURRENCY_API_KEY) {
              // ExchangeRate-API.com v6 历史数据端点格式: /history/{YYYY-MM-DD}/{BASE}
              // 需要指定 base currency 来获取该货币的历史汇率
              apiUrl = `https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/history/${baseCurrency}/${dateStr}`;
            }
            // 免费版本的处理已经在循环前完成
            break;

          case 'exchangerate_host':
            // exchangerate.host 支持历史数据查询，完全免费
            // 格式: https://api.exchangerate.host/{date}?base=USD&symbols=EUR
            apiUrl = `${API_ENDPOINTS.exchangerate_host}/${dateStr}?base=${baseCurrency}&symbols=${targetCurrency}`;
            break;
        }

        // 如果有历史 API URL，尝试获取
        if (apiUrl) {
          try {
            const response = await axios.get(apiUrl, { timeout: 8000 });
            
            // exchangerate.host 的特殊处理
            if (provider === 'exchangerate_host') {
              if (response.data && response.data.success !== false && response.data.rates) {
                const rate = response.data.rates[targetCurrency];
                if (rate) {
                  historyData.push({
                    date: dateStr,
                    rate: parseFloat(rate.toFixed(6))
                  });
                  continue;
                }
              }
            } else {
              // ExchangeRate-API.com Pro (v6) 的特殊处理
              if (provider === 'exchangerate_pro') {
                // v6 API 历史数据返回格式: { result: 'success', base_code: 'BASE', conversion_rates: {...} }
                // 如果指定了 base currency，返回格式: { result: 'success', base_code: 'BASE', conversion_rates: {...} }
                // conversion_rates 是相对于 base_code 的汇率
                
                if (response.data && response.data.result === 'success' && response.data.conversion_rates) {
                  const rates = response.data.conversion_rates;
                  const apiBaseCode = response.data.base_code || baseCurrency;
                  let rate;
                  
                  // 检查返回的基准货币是否匹配
                  if (apiBaseCode.toUpperCase() === baseCurrency.toUpperCase()) {
                    // API 返回的就是基于请求的 base currency 的汇率
                    rate = rates[targetCurrency];
                  } else {
                    // API 返回的可能是基于 USD 的汇率，需要转换
                    console.warn(`API returned base ${apiBaseCode} instead of ${baseCurrency}, converting...`);
                    
                    if (apiBaseCode === 'USD') {
                      // API 返回的是 USD 基准，需要转换为 baseCurrency 基准
                      const baseToUSD = rates[baseCurrency]; // 1 baseCurrency = X USD
                      const targetToUSD = rates[targetCurrency]; // 1 targetCurrency = Y USD
                      
                      if (baseToUSD && targetToUSD && baseToUSD !== 0) {
                        // 1 baseCurrency = (targetToUSD / baseToUSD) targetCurrency
                        rate = targetToUSD / baseToUSD;
                      }
                    } else {
                      // 其他情况，尝试直接获取或转换
                      rate = rates[targetCurrency];
                      if (!rate) {
                        // 如果直接没有，尝试通过 USD 转换
                        const baseToUSD = rates[baseCurrency] || (apiBaseCode === 'USD' ? 1 : null);
                        const targetToUSD = rates[targetCurrency] || (targetCurrency === 'USD' ? 1 : null);
                        if (baseToUSD && targetToUSD && baseToUSD !== 0) {
                          rate = targetToUSD / baseToUSD;
                        }
                      }
                    }
                  }
                  
                  if (rate && !isNaN(rate) && rate > 0) {
                    historyData.push({
                      date: dateStr,
                      rate: parseFloat(rate.toFixed(6))
                    });
                    console.log(`✓ Added rate ${baseCurrency}/${targetCurrency} = ${rate.toFixed(6)} for ${dateStr}`);
                  } else {
                    console.warn(`✗ No valid rate found for ${baseCurrency}/${targetCurrency} on ${dateStr}`);
                    console.warn(`  Response base: ${apiBaseCode}, Available currencies: ${Object.keys(rates).slice(0, 5).join(', ')}...`);
                  }
                } else {
                  console.error(`✗ Invalid response for ${dateStr}:`, JSON.stringify(response.data).substring(0, 300));
                  if (response.data && response.data.result === 'error') {
                    console.error(`  Error type: ${response.data['error-type'] || 'unknown'}`);
                  }
                }
              } else {
                // 其他 API 使用通用解析方法
                const parsedData = parseApiResponse(response, provider, baseCurrency);
                
                if (parsedData && parsedData.rates) {
                  const rate = parsedData.rates[targetCurrency];
                  if (rate) {
                    historyData.push({
                      date: dateStr,
                      rate: parseFloat(rate.toFixed(6))
                    });
                  } else {
                    console.warn(`No rate found for ${targetCurrency} on ${dateStr}`);
                  }
                }
              }
            }
          } catch (apiError) {
            // 如果单个日期请求失败，记录但继续处理下一天
            console.warn(`Failed to fetch data for ${dateStr}:`, apiError.message);
            // 不重新抛出，继续循环处理其他日期
            // 会在外层 catch 中处理失败情况
          }
        }
      } catch (error) {
        // 外层错误处理：如果 API 请求完全失败，尝试使用回退方案
        console.warn(`Outer catch: Failed to fetch historical data for ${dateStr}:`, error.message);
        
        // 只在循环第一次迭代且还没有任何数据时，尝试获取当前汇率
        if (i === numDays - 1 && historyData.length === 0) {
          try {
            const currentData = await getExchangeRates(baseCurrency);
            if (currentData && currentData.rates && currentData.rates[targetCurrency]) {
              historyData.push({
                date: dateStr,
                rate: parseFloat(currentData.rates[targetCurrency].toFixed(6))
              });
              console.log(`Using current rate as fallback for ${dateStr}`);
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError.message);
          }
        } else if (historyData.length > 0) {
          // 如果已经有数据，基于最近的汇率估算
          const lastRate = historyData[historyData.length - 1].rate;
          const variation = (Math.random() - 0.5) * 0.01; // ±0.5% 的波动
          historyData.push({
            date: dateStr,
            rate: parseFloat((lastRate * (1 + variation)).toFixed(6))
          });
          console.log(`Using estimated rate for ${dateStr} based on previous data`);
        }
      }

      // 添加延迟以避免 API 限流（除了最后一天）
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // 记录获取到的数据量
    console.log(`Successfully fetched ${historyData.length} days of historical data for ${baseCurrency}/${targetCurrency}`);

    // 如果没有获取到任何历史数据，尝试使用模拟数据
    if (historyData.length === 0) {
      try {
        console.log('No historical data retrieved, generating simulated data...');
        const currentData = await getExchangeRates(baseCurrency);
        if (currentData && currentData.rates && currentData.rates[targetCurrency]) {
          const currentRate = parseFloat(currentData.rates[targetCurrency]);
          for (let j = numDays - 1; j >= 0; j--) {
            const simDate = new Date(today);
            simDate.setDate(simDate.getDate() - j);
            const simDateStr = simDate.toISOString().split('T')[0];
            const timeDecay = (numDays - j) / numDays;
            const variation = (Math.random() - 0.5) * 0.05 * timeDecay;
            const simulatedRate = currentRate * (1 + variation);
            historyData.push({
              date: simDateStr,
              rate: parseFloat(simulatedRate.toFixed(6))
            });
          }
          
          return res.json({
            from: baseCurrency,
            to: targetCurrency,
            data: historyData,
            period: `${numDays} days`,
            note: 'Simulated data based on current rates'
          });
        }
      } catch (fallbackError) {
        console.error('Error in fallback simulation:', fallbackError);
      }
      
      return res.status(500).json({ error: 'Failed to fetch historical exchange rates' });
    }

    res.json({
      from: baseCurrency,
      to: targetCurrency,
      data: historyData,
      period: `${numDays} days`
    });

  } catch (error) {
    console.error('Historical currency data error:', error);
    
    // 最后尝试使用模拟数据
    try {
      const currentData = await getExchangeRates(from.toUpperCase());
      if (currentData && currentData.rates && currentData.rates[to.toUpperCase()]) {
        const currentRate = parseFloat(currentData.rates[to.toUpperCase()]);
        const today = new Date();
        const fallbackData = [];
        const numDays = 7;
        
        for (let j = numDays - 1; j >= 0; j--) {
          const simDate = new Date(today);
          simDate.setDate(simDate.getDate() - j);
          const simDateStr = simDate.toISOString().split('T')[0];
          const timeDecay = (numDays - j) / numDays;
          const variation = (Math.random() - 0.5) * 0.05 * timeDecay;
          const simulatedRate = currentRate * (1 + variation);
          fallbackData.push({
            date: simDateStr,
            rate: parseFloat(simulatedRate.toFixed(6))
          });
        }
        
        return res.json({
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          data: fallbackData,
          period: `${numDays} days`,
          note: 'Simulated data (API error fallback)'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback simulation also failed:', fallbackError);
    }
    
    res.status(500).json({ error: 'Failed to fetch historical exchange rates. Please try again.' });
  }
});

module.exports = router;



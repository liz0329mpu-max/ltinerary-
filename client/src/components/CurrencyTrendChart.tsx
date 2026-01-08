import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { currencyAPI } from '../utils/api';
import './CurrencyTrendChart.css';

interface TrendDataPoint {
  date: string;
  rate: number;
  timestamp: string;
}

interface CurrencyTrendChartProps {
  from: string;
  to: string;
}

function CurrencyTrendChart({ from, to }: CurrencyTrendChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDataPoints = 60; // 保留最近60个数据点（60分钟）

  useEffect(() => {
    // 清理之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 重置数据当货币对改变时
    setData([]);
    setError('');

    if (from && to) {
      startRealTimeUpdates();
    }

    // 清理定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [from, to]);

  const startRealTimeUpdates = async () => {
    // 立即获取一次数据
    await fetchCurrentRate();
    
    // 设置定时器，每分钟更新一次
    intervalRef.current = setInterval(async () => {
      await fetchCurrentRate();
    }, 60000); // 60000ms = 1分钟
  };

  const fetchCurrentRate = async () => {
    try {
      setError('');
      const response = await currencyAPI.convert(1, from, to);
      
      if (response.data && response.data.rate) {
        const now = new Date();
        const timeStr = formatTime(now);
        const newDataPoint: TrendDataPoint = {
          date: timeStr,
          rate: response.data.rate,
          timestamp: now.toISOString()
        };

        setData(prevData => {
          // 添加新数据点
          const updated = [...prevData, newDataPoint];
          
          // 如果超过最大数据点数，删除最旧的数据
          if (updated.length > maxDataPoints) {
            return updated.slice(-maxDataPoints);
          }
          
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Error fetching current rate:', err);
      setError(err.response?.data?.error || '无法获取实时汇率');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (error && data.length === 0) {
    return (
      <div className="trend-chart-container">
        <h4>实时汇率趋势图 ({from}/{to})</h4>
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="trend-chart-container">
        <h4>实时汇率趋势图 ({from}/{to})</h4>
        <div className="chart-loading">正在获取实时汇率数据...</div>
      </div>
    );
  }

  // 计算汇率变化
  const currentRate = data[data.length - 1]?.rate || 0;
  const previousRate = data.length > 1 ? data[data.length - 2]?.rate : currentRate;
  const change = currentRate - previousRate;
  const changePercent = previousRate !== 0 ? ((change / previousRate) * 100).toFixed(2) : '0.00';
  const isPositive = change >= 0;

  return (
    <div className="trend-chart-container">
      <div className="chart-header">
        <h4>实时汇率趋势图 ({from}/{to})</h4>
        <div className="chart-summary">
          <span className="current-rate">当前汇率: {currentRate.toFixed(6)}</span>
          {data.length > 1 && (
            <span className={`rate-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(changePercent))}%
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#10b981', marginLeft: '10px' }}>
            ● 实时更新中
          </span>
        </div>
      </div>
      {error && (
        <div style={{ padding: '5px 10px', background: '#fee', color: '#c33', borderRadius: '4px', margin: '10px 0', fontSize: '12px' }}>
          警告: {error}
        </div>
      )}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => value.toFixed(4)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '5px',
                padding: '10px'
              }}
              labelFormatter={(label) => `时间: ${label}`}
              formatter={(value: number) => [value.toFixed(6), `汇率 (${to})`]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#667eea" 
              strokeWidth={2}
              dot={{ fill: '#667eea', r: 3 }}
              activeDot={{ r: 6 }}
              name={`1 ${from} = ${to}`}
              isAnimationActive={true}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <small>实时更新中 - 显示最近 {data.length} 分钟的数据（每分钟更新）</small>
      </div>
    </div>
  );
}

export default CurrencyTrendChart;


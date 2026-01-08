import { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../utils/api';

interface TravelSuggestion {
  content: string;
  loading: boolean;
  error: string | null;
}

/**
 * 自定义 Hook：自动检测输入中的地点关键词并获取旅游建议
 * @param inputValue - 输入框的值
 * @param debounceMs - 防抖延迟时间（毫秒），默认 800ms
 */
export function useTravelSuggestions(inputValue: string, debounceMs: number = 800): TravelSuggestion {
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果输入为空或太短，清除建议（至少3个字符才触发）
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || trimmedValue.length < 3) {
      setSuggestion('');
      setError(null);
      setLoading(false);
      lastQueryRef.current = '';
      return;
    }

    // 防止重复请求相同的内容
    if (trimmedValue === lastQueryRef.current) {
      return;
    }

    // 设置防抖定时器
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      lastQueryRef.current = trimmedValue;

      try {
        // 构建 AI 提示词，要求针对地点提供旅游建议
        // 如果是景点名称，提供景点相关的建议；如果是城市/国家名称，提供旅游建议
        const prompt = `用户输入了"${trimmedValue}"，这可能是：
- 一个旅游目的地（城市、国家、地区）
- 一个旅游景点（著名地标、景点名称）
- 一个旅行相关关键词

请识别这是一个地点还是景点，然后提供相关的旅游建议：

如果是目的地（城市/国家）：
1. 最佳旅游时间
2. 必游景点推荐
3. 当地美食推荐
4. 交通建议
5. 注意事项

如果是景点：
1. 景点简介和特色
2. 开放时间和门票信息
3. 最佳参观时间
4. 交通方式和周边景点
5. 参观建议和注意事项

请用简洁明了的中文回答，控制在200字以内，使用列表格式。`;

        const response = await aiAPI.chat(prompt);
        
        if (response.data && response.data.response) {
          setSuggestion(response.data.response);
        } else {
          setSuggestion('');
          setError('无法获取建议');
        }
      } catch (err: any) {
        console.error('Error fetching travel suggestions:', err);
        setError('获取建议失败，请稍后重试');
        setSuggestion('');
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, debounceMs]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    content: suggestion,
    loading,
    error
  };
}


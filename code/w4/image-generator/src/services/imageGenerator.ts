import axios from 'axios';
import { GenerateImageRequest, GenerateImageResponse } from '../types';

/**
 * 调用 LLM API 生成图片
 * @param request 生成请求参数
 * @param apiKey API 密钥
 * @param apiUrl API 地址
 * @param llmName LLM 名称
 * @returns 生成的图片响应
 */
/**
 * 增强提示词，让图片更完整
 */
function enhancePrompt(originalPrompt: string): string {
  const enhancements = [
    'full shot',
    'complete image',
    'full composition',
    'no cropping',
    'centered composition'
  ];
  
  const lowerPrompt = originalPrompt.toLowerCase();
  const hasEnhancement = enhancements.some(e => lowerPrompt.includes(e));
  
  if (hasEnhancement) {
    return originalPrompt;
  }
  
  return `${originalPrompt}, full shot, complete image, full composition, centered, no cropping, high quality`;
}

export const generateImage = async (
  request: GenerateImageRequest,
  apiKey: string,
  apiUrl: string,
  llmName: string,
  shouldEnhance: boolean = true
): Promise<GenerateImageResponse> => {
  const finalPrompt = shouldEnhance ? enhancePrompt(request.prompt) : request.prompt;
  console.log('=== 开始生成图片 ===');
  console.log('API URL:', apiUrl);
  console.log('Model:', llmName);
  console.log('是否增强Prompt:', shouldEnhance);
  console.log('原始Prompt:', request.prompt);
  console.log('最终Prompt:', finalPrompt);
  
  try {
    const response = await axios.post(
      apiUrl,
      {
        model: llmName,
        prompt: finalPrompt,
        size: '512x512',
        n: 1,
        response_format: 'b64_json'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 // 60秒超时
      }
    );

    console.log('=== API 响应成功 ===');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // 处理 API 响应 - 支持多种可能的返回格式
    let imageData: string | null = null;
    
    // 格式1: OpenAI 格式 { data: [{ b64_json: '...' }] } 或 { data: [{ url: '...' }] }
    if (response.data && response.data.data && response.data.data[0]) {
      const firstDataItem = response.data.data[0];
      if (firstDataItem.b64_json) {
        imageData = firstDataItem.b64_json;
      } else if (firstDataItem.url) {
        console.log('检测到图片URL格式');
        return {
          imageUrl: firstDataItem.url,
          imageData: ''
        };
      } else if (firstDataItem.image_url) {
        console.log('检测到图片image_url格式');
        return {
          imageUrl: firstDataItem.image_url,
          imageData: ''
        };
      }
    }
    // 格式2: 直接返回 base64
    else if (response.data && typeof response.data === 'string') {
      imageData = response.data;
    }
    // 格式3: { image: 'base64...' } 或 { url: 'http...' } 结构
    else if (response.data) {
      if (response.data.url) {
        console.log('检测到顶层url格式');
        return {
          imageUrl: response.data.url,
          imageData: ''
        };
      } else if (response.data.image_url) {
        console.log('检测到顶层image_url格式');
        return {
          imageUrl: response.data.image_url,
          imageData: ''
        };
      } else if (response.data.image) {
        imageData = response.data.image;
      }
    }
    // 格式4: { result: { image: '...' } } 等嵌套结构
    else if (response.data && response.data.result) {
      if (response.data.result.b64_json) {
        imageData = response.data.result.b64_json;
      } else if (response.data.result.image) {
        imageData = response.data.result.image;
      } else if (response.data.result.url) {
        console.log('检测到result.url格式');
        return {
          imageUrl: response.data.result.url,
          imageData: ''
        };
      }
    }

    if (imageData) {
      // 检查是否已经是data URL
      if (imageData.startsWith('data:')) {
        return {
          imageUrl: imageData,
          imageData: imageData.split(',')[1] || imageData
        };
      }
      
      // 检查是否已经是base64格式，或者需要添加前缀
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      if (base64Regex.test(imageData)) {
        return {
          imageUrl: `data:image/png;base64,${imageData}`,
          imageData
        };
      } else {
        // 假设是原始数据，尝试直接使用
        return {
          imageUrl: `data:image/png;base64,${imageData}`,
          imageData
        };
      }
    }

    console.error('无法解析的API响应格式:', response.data);
    throw new Error(`API 返回格式异常，请检查控制台日志`);
  } catch (error: any) {
    console.error('=== 图片生成错误 ===');
    console.error('Error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        const message = errorData?.error?.message || errorData?.message || error.message;
        
        console.error('Error response details:', { status, data: errorData });
        
        if (status === 401) {
          throw new Error('API KEY 无效，请检查您的密钥');
        } else if (status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        } else if (status === 400) {
          throw new Error(`请求参数错误: ${message}`);
        } else if (status >= 500) {
          throw new Error(`服务器错误: ${message} (状态码: ${status})`);
        }
        
        throw new Error(`生成失败: ${message} (状态码: ${status})`);
      } else if (error.request) {
        throw new Error('网络错误，请检查您的网络连接或API地址是否正确');
      }
    }
    throw new Error(error?.message || '图片生成失败，请查看控制台');
  }
};

/**
 * 模拟图片生成（用于开发测试）
 */
export const generateMockImage = async (
  request: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 返回一个简单的 SVG 作为测试图片
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="#374151">
        Mock Image: ${request.prompt.substring(0, 20)}...
      </text>
    </svg>
  `;
  const imageData = btoa(unescape(encodeURIComponent(svg)));
  
  return {
    imageUrl: `data:image/svg+xml;base64,${imageData}`,
    imageData
  };
};

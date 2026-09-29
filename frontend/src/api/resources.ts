import type { Resource } from '../types/resource';

const API_BASE_URL = 'http://localhost:8000/api/v1/resources';

const fallbackResources: Resource[] = [
  {
    id: 1,
    title: 'FastAPI Documentation',
    description: 'Interactive tutorial, dependency injection, and Pydantic validation.',
    url: 'https://fastapi.tiangolo.com/',
    category: 'Backend',
    order_index: 1,
  },
  {
    id: 2,
    title: 'NeetCode 150 Algorithms',
    description: 'Categorized DSA practice with video explanations & patterns.',
    url: 'https://neetcode.io/practice',
    category: 'DSA',
    order_index: 2,
  },
  {
    id: 3,
    title: 'ByteByteGo System Design',
    description: 'Visual architecture cheatsheets and scaling patterns.',
    url: 'https://bytebytego.com/',
    category: 'System Design',
    order_index: 3,
  },
];

export async function fetchResources(): Promise<Resource[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return fallbackResources;
  } catch (error) {
    console.warn('API unavailable, using fallback resources data:', error);
    return fallbackResources;
  }
}

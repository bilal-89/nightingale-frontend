export interface ApiConfig {
    baseUrl: string;
    headers?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

export class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    
    constructor(config: ApiConfig) {
        this.baseUrl = config.baseUrl;
        this.defaultHeaders = {
            "Content-Type": "application/json",
            ...config.headers
        };
    }
    
    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = new URL(this.baseUrl + endpoint);
        if (options.params) {
            Object.entries(options.params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        
        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        
        return response.json();
    }
}

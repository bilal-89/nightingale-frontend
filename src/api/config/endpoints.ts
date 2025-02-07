export const API_ENDPOINTS = {
    projects: {
        list: "/projects",
        create: "/projects/create",
        update: (id: string) => `/projects/${id}`,
        delete: (id: string) => `/projects/${id}`,
    },
    auth: {
        login: "/auth/login",
        logout: "/auth/logout",
    },
    tracks: {
        list: (projectId: string) => `/projects/${projectId}/tracks`,
        create: (projectId: string) => `/projects/${projectId}/tracks`,
        update: (projectId: string, trackId: string) => 
            `/projects/${projectId}/tracks/${trackId}`,
    }
};

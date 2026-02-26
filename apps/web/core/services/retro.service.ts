import { API_BASE_URL } from "@plane/constants";
import type { IRetroBoard, IRetroItem } from "@plane/types";

// Extract CSRF token from cookies
function getCookie(name: string) {
  let cookieValue = '';
  if (typeof document !== 'undefined' && document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export class RetroService {
 
  async createRetroBoard(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: { name: string; description?: string }
  ): Promise<IRetroBoard> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-boards/`;
    const csrftoken = getCookie('csrftoken');

    console.log("POST Request URL:", url);
    console.log("Sending Payload:", data);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return await response.json();
    } catch (err: any) {
      console.error("Retro board creation error:", err);
      const errorMessage = err?.detail || 
                          err?.name?.[0] || 
                          err?.message || 
                          "Failed to create retro board";
      throw new Error(errorMessage);
    }
  }

  async getRetroBoards(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<IRetroBoard[]> {

    const url = cycleId && cycleId.trim()
      ? `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-boards/`
      : `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/retro-boards/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) throw await response.json();
    return await response.json();
  }


  async createRetroItem(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<IRetroItem> 
  ): Promise<IRetroItem> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-items/`;
    const csrftoken = getCookie('csrftoken');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw await response.json();
    return await response.json();
  }

  async getRetroItems(
    workspaceSlug: string,
    projectId: string,
    cycleId: string
  ): Promise<IRetroItem[]> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-items/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) throw await response.json();
    return await response.json();
  }


  async updateRetroItem(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    retroItemId: string,
    data: Partial<IRetroItem>
  ): Promise<IRetroItem> {
    const url = `${API_BASE_URL}/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-items/${retroItemId}/`;
    const csrftoken = getCookie('csrftoken');

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw await response.json();
    return await response.json();
  }


  async deleteRetroItem(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    retroItemId: string
  ): Promise<void> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-items/${retroItemId}/`;
    const csrftoken = getCookie('csrftoken');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
    });

    if (!response.ok) throw await response.json();
  }

  async updateRetroBoard(
    workspaceSlug: string,
    projectId: string,
    boardId: string,
    data: Partial<IRetroBoard>
  ): Promise<IRetroBoard> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/retro-boards/${boardId}/`;
    const csrftoken = getCookie('csrftoken');

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw await response.json();
    return await response.json();
  }

   async deleteRetroBoard(
    workspaceSlug: string,
    projectId: string,
    boardId: string
  ): Promise<void> {
    const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/retro-boards/${boardId}/`;
    const csrftoken = getCookie('csrftoken');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
    });

    if (!response.ok) throw await response.json();
  }
}
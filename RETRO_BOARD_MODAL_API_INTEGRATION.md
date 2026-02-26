"""
Retro Board Creation API - Modal Implementation

This document explains how the retro board creation API is integrated with the modal in the web application.
"""

## Architecture Overview

### 1. **Modal Component** (`/apps/web/core/components/retros/modal.tsx`)
   - Opens when user clicks "Create Retro Board"
   - Manages modal state (isOpen, handleClose)
   - Passes form data to the form component
   - Handles API response and toast notifications

### 2. **Form Component** (`/apps/web/core/components/retros/form.tsx`)
   - Collects user input: name, description, cycle_id
   - Uses React Hook Form for validation
   - Submits data to the modal's handleFormSubmit

### 3. **Store/Hook** (`/apps/web/core/hooks/store/use-retro.ts`)
   - Provides `createBoard` method from RetroStore
   - Manages state with MobX (reactive state management)

### 4. **Service** (`/apps/web/core/services/retro.service.ts`)
   - Makes HTTP POST request to the API
   - Handles CSRF token for security
   - Maps to the Django backend endpoint

## Call Flow

```
User clicks "Create Retro" button
    ↓
Modal opens (RetroCreateUpdateModal)
    ↓
User fills form and submits
    ↓
Form calls handleFormSubmit with formData
    ↓
Modal: handleFormSubmit validates and calls createBoard
    ↓
Store (useRetro): createBoard calls retroService.createRetroBoard
    ↓
Service: Makes POST request to API
    ↓
API Response (201 Created)
    ↓
Store updates retroBoardMap with new board
    ↓
Modal closes and shows success toast
```

## Code Implementation

### Modal Implementation
```typescript
// File: /apps/web/core/components/retros/modal.tsx

export function RetroCreateUpdateModal({ isOpen, handleClose, data, workspaceSlug, projectId, cycleId }: Props) {
  const { createBoard } = useRetro(); 
  const { isMobile } = usePlatformOS();

  const handleFormSubmit = async (formData: Partial<IRetro>) => {
    if (!workspaceSlug || !projectId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Missing workspace or project information."
      });
      return;
    }

    if (!cycleId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "No active cycle found. Please select a cycle first.",
      });
      return;
    }

    try {
      // Call the API via store
      await createBoard(workspaceSlug, projectId, cycleId, { 
        name: formData.name || "", 
        description: formData.description 
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Retrospective created." });
      handleClose();
    } catch (err: any) {
      console.error("Error creating retro board:", err);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.detail || err?.message || "Something went wrong.",
      });
    }
  };

  return (
    <ModalCore 
      isOpen={isOpen} 
      handleClose={handleClose} 
      position={EModalPosition.TOP} 
      width={EModalWidth.XL}
    >
      <RetroForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        status={!!data}
        projectId={projectId}
        data={data}
        isMobile={isMobile}
      />
    </ModalCore>
  );
}
```

### Store Implementation
```typescript
// File: /apps/web/core/store/retro.store.ts

createBoard = async (
  workspaceSlug: string, 
  projectId: string, 
  cycleId: string, 
  data: { name: string; description?: string }
) => {
  try {
    // Call the service to make API request
    const response = await this.retroService.createRetroBoard(workspaceSlug, projectId, cycleId, data);
    
    // Update store state with new board
    runInAction(() => {
      this.retroBoardMap[response.id] = response;
    });
    return response;
  } catch (error) {
    throw error;
  }
};
```

### Service Implementation
```typescript
// File: /apps/web/core/services/retro.service.ts

async createRetroBoard(
  workspaceSlug: string,
  projectId: string,
  cycleId: string,
  data: { name: string; description?: string }
): Promise<IRetroBoard> {
  return this.post(
    `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}/retro-boards/`,
    data,
    {
      headers: { "X-CSRFToken": this.csrfToken },
    }
  )
    .then((res) => res?.data)
    .catch((err) => {
      throw err?.response?.data;
    });
}
```

## API Endpoint Details

**Endpoint:**
```
POST /workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/retro-boards/
```

**Request Headers:**
- `Content-Type: application/json`
- `X-CSRFToken: {csrf_token}` (automatically included)
- `Authorization: Token {auth_token}` (if using token auth)

**Request Body:**
```json
{
  "name": "Sprint 1 Retrospective",
  "description": "Retrospective for Sprint 1 cycle"
}
```

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Sprint 1 Retrospective",
  "description": "Retrospective for Sprint 1 cycle",
  "project": "uuid",
  "cycle": "uuid",
  "cycle_id": "uuid",
  "cycle_name": "Sprint 1",
  "progress_details": {
    "total_issues": 10,
    "completed_issues": 8,
    "percentage_completed": "80%",
    "status": "success"
  },
  "details": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "name": ["This field may not be blank."],
  "description": ["This field is required."]
}
```

## Testing the Modal

### 1. Open Modal
```typescript
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>Create Retro Board</button>

<RetroCreateUpdateModal
  isOpen={isOpen}
  handleClose={() => setIsOpen(false)}
  workspaceSlug="your-workspace"
  projectId="project-123"
  cycleId="cycle-456"
/>
```

### 2. Form Data Flow
```typescript
// User enters:
// Name: "Sprint 1 Retro"
// Description: "Retrospective for Sprint 1"
// Cycle: "Sprint 1"

// Form submits with:
{
  name: "Sprint 1 Retro",
  description: "Retrospective for Sprint 1",
  cycle_id: "cycle-456"
}

// Modal sends to API:
{
  name: "Sprint 1 Retro",
  description: "Retrospective for Sprint 1"
  // cycle_id is already in the URL path
}
```

### 3. Success Flow
```
API returns 201 ✓
  ↓
Store updates retroBoardMap
  ↓
Modal closes
  ↓
User sees success toast: "Success! Retrospective created."
  ↓
Retro board appears in the list
```

## State Management (MobX)

### Observable State
```typescript
retroBoardMap: Record<string, IRetroBoard> = {}
retroItemsMap: Record<string, IRetroItem[]> = {}
loader: boolean = false
```

### Computed Values
```typescript
get currentProjectRetros() {
  const projectId = this.rootStore.router.projectId;
  return Object.values(this.retroBoardMap).filter((b) => b.project === projectId);
}
```

## Error Handling

The modal includes comprehensive error handling:

1. **Missing workspace/project**: Shows error toast
2. **No active cycle selected**: Shows validation error
3. **API errors**: Catches and displays error message
4. **Network errors**: Handled by service layer

## Integration Points

### 1. Parent Component Usage
```typescript
import { RetroCreateUpdateModal } from "@/components/retros/modal";

function RetroProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Create Retro Board
      </button>
      
      <RetroCreateUpdateModal
        isOpen={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        cycleId={selectedCycleId}
      />
    </>
  );
}
```

### 2. List Component Integration
```typescript
// After successful creation, the list auto-updates
const { currentProjectRetros } = useRetro();

// This computed value automatically includes new board
const boards = currentProjectRetros; // Updated with new board
```

## Key Dependencies

- **@plane/types**: Type definitions for IRetro, IRetroBoard, IRetroItem
- **@plane/ui**: ModalCore, Input, TextArea components
- **mobx**: State management
- **react-hook-form**: Form handling
- **@plane/propel/toast**: Toast notifications

## Summary

The retro board creation is fully integrated:
✓ Modal opens with form
✓ User enters name, description, and selects cycle
✓ Form validates required fields
✓ Modal calls store.createBoard()
✓ Store calls retroService.createRetroBoard()
✓ Service makes POST request to API
✓ API creates board (Python/Django backend)
✓ Response updates store state
✓ Modal closes with success toast
✓ Retro board list auto-updates

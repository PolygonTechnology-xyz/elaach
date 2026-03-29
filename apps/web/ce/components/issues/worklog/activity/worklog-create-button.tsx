"use client";
import { useState, useRef, useEffect } from "react";
import { Plus, Clock, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";

type TIssueActivityWorklogCreateButton = {
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  disabled?: boolean;
  onClick?: () => void;
};


//extract csrf token from cookies
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


// Component for creating a worklog entry for an issue/task
export function IssueActivityWorklogCreateButton({
  workspaceSlug,
  projectId,
  issueId,
  disabled = false,
  onClick,
}: TIssueActivityWorklogCreateButton) {

  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };

  const handleSave = async () => {
    if (!hours && !minutes) return;

    setIsSubmitting(true);

    try {
      const totalSeconds = (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60);

      if (totalSeconds === 0) {
        setIsSubmitting(false);
        return;
      }

      const payload = {
        user_id: null,
        project_id: projectId,
        issue_id: issueId,
        total_spent_time: totalSeconds,
        description: description,
      };

      const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/tracked-times/`;
      const csrftoken = getCookie('csrftoken');
      // console.log("csrfToken:", csrftoken);

      console.log("POST Request URL:", url);
      console.log("Sending Payload:", payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log(document.cookie);


      console.log("Raw Response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server Error Response:", errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      console.log("Success:", data);

      setHours("");
      setMinutes("");
      setDescription("");
      setIsOpen(false);

    } catch (error) {
      console.error("Error saving worklog:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className="inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors 
        focus-visible:outline-none disabled:pointer-events-none bg-accent-primary hover:bg-accent-primary-hover 
        active:bg-accent-primary-active disabled:bg-layer-disabled text-on-color disabled:text-on-color-disabled 
        h-6 px-2 text-body-xs-medium rounded-md"
        >
        <div className="h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0">
          <Plus size={14} strokeWidth={2} />
        </div>
        Log work
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 z-50 
          w-[240px] sm:w-[280px]  {/* Reduced from 300px/340px */}
          p-3 rounded-lg shadow-xl text-left  {/* Reduced padding from p-4 to p-3 */}
           border border-gray-200 text-gray-700
          dark:bg-[#18181b] dark:border-gray-800 dark:text-gray-300"
        >
          {/* Header Section - Reduced bottom margin */}
          <div className="flex items-center mb-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-semibold
                bg-gray-100 text-gray-600
                dark:bg-[#27272a] dark:text-gray-400">
              <Clock size={12} />
              <span>{hours || '0'}h </span>
            </div>
          </div>

          {/* Input Section - Reduced bottom margin */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                placeholder="Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-transparent border rounded px-2 py-1.5 text-xs transition-colors outline-none
                border-gray-300 text-gray-900 focus:border-blue-500 placeholder-gray-400
                dark:border-gray-700 dark:text-white dark:focus:border-blue-500 dark:placeholder-gray-600"
              />
            </div>
          </div>

          {/* Textarea Section - Reduced rows and bottom margin */}
          <div className="mb-3">
            <textarea
              rows={3} // Reduced from 4
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border rounded p-2 text-xs resize-none transition-colors outline-none
              border-gray-300 text-gray-900 focus:border-blue-500 placeholder-gray-400
              dark:border-gray-700 dark:text-white dark:focus:border-blue-500 dark:placeholder-gray-600"
            />
          </div>

          {/* Buttons Section */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="px-3 py-1 text-xs font-medium rounded border transition-all disabled:opacity-10 text-black dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-3 py-1 text-xs font-medium rounded border transition-all disabled:opacity-50 text-black dark:text-white"
            >
              {isSubmitting && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
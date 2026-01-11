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
        className={`text-blue-500 bg-transparent border border-blue-500
          hover:bg-blue-500/20 focus:text-blue-500 focus:bg-blue-500/30
          px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap
          transition-all justify-center outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0">
          <Plus size={14} strokeWidth={2} />
        </div>
        Log work
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mt-2 z-50 w-[300px] sm:w-[340px] bg-[#18181b] border border-gray-800 rounded-lg shadow-xl p-4 text-gray-300 text-left">

          <div className="flex items-center mb-4">
            <div className="bg-[#27272a] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-400">
              <Clock size={14} />
              <span>{hours || '0'}h {minutes || '0'}m</span>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                placeholder="Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                placeholder="Minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-transparent border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <textarea
              rows={4}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded p-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 rounded border border-transparent hover:border-gray-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm flex items-center gap-2 disabled:bg-blue-600/50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { AICopilot } from "./AICopilot";
import { Trash2 } from "lucide-react";
import type { ComponentSchema } from "../types/editor";

interface Props {
  component: ComponentSchema;
  isAICopilotOpen: boolean;
  onToggleAICopilot: () => void;
  onDelete: (id: string) => void;
}

export const SetterHeader: React.FC<Props> = ({
  component,
  isAICopilotOpen,
  onToggleAICopilot,
  onDelete,
}) => {
  return (
    <header className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between shadow-sm">
      <h3 className="font-bold text-slate-800">属性面板</h3>
      <div className="flex items-center gap-2">
        <AICopilot isOpen={isAICopilotOpen} onToggle={onToggleAICopilot} />
        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-mono font-bold rounded-md border border-indigo-200">
          {component.type}
        </span>
        <button
          onClick={() => onDelete(component.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

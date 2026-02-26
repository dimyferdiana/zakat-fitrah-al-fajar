import { Card, CardContent } from '@/components/ui/card';
import type { DashboardWidget, TextNoteConfig } from '@/types/dashboard';

interface TextNoteWidgetProps {
  widget: DashboardWidget;
}

/**
 * Renders a markdown-style text note.
 * Supports: **bold**, *italic*, # headings, and bullet lists.
 */
export function TextNoteWidget({ widget }: TextNoteWidgetProps) {
  const config = widget.config as TextNoteConfig;
  const content = config.content ?? '';

  // Simple markdown renderer (no external lib needed)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Heading
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-semibold mt-2 mb-1">{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="text-lg font-bold mt-2 mb-1">{line.slice(2)}</h2>;
      }
      // Bullet list
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">
            {renderInline(line.slice(2))}
          </li>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <br key={i} />;
      }
      // Regular paragraph
      return <p key={i} className="text-sm text-muted-foreground">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="space-y-1">{renderContent(content)}</div>
      </CardContent>
    </Card>
  );
}

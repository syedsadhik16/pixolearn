import {
  LayoutDashboard, BarChart3, Clock, Sparkles, Settings2, Bell, FileText, ChevronDown,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { ChildData } from '@/pages/ParentDashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'time', label: 'Time Analytics', icon: Clock },
  { id: 'recommendations', label: 'AI Insights', icon: Sparkles },
  { id: 'controls', label: 'Parent Controls', icon: Settings2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'report', label: 'Weekly Report', icon: FileText },
];

interface ParentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: ChildData[];
  selectedChildId: string | null;
  onChildSelect: (id: string) => void;
}

export function ParentSidebar({ activeSection, onSectionChange, children: childrenData, selectedChildId, onChildSelect }: ParentSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Child Selector */}
        {childrenData.length > 0 && !collapsed && (
          <div className="p-3 border-b border-border">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 tracking-wider">Child</p>
            <Select value={selectedChildId || ''} onValueChange={onChildSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {childrenData.map(c => (
                  <SelectItem key={c.profile.id} value={c.profile.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {(c.profile.full_name || c.profile.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {c.profile.full_name || c.profile.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map(s => (
                <SidebarMenuItem key={s.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(s.id)}
                    isActive={activeSection === s.id}
                    tooltip={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                    {!collapsed && <span>{s.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

import {
  LayoutDashboard, BarChart3, Clock, Sparkles, Settings2, Bell, FileText,
  Brain, CalendarDays, Eye, GitBranch, Wand2, Users, Heart, BookOpen,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { ChildData } from '@/pages/ParentDashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const sections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'performance', label: 'Performance', icon: BarChart3, group: 'main' },
  { id: 'time', label: 'Time Analytics', icon: Clock, group: 'main' },
  { id: 'recommendations', label: 'AI Insights', icon: Sparkles, group: 'main' },
  { id: 'controls', label: 'Parent Controls', icon: Settings2, group: 'main' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'main' },
  { id: 'report', label: 'Weekly Report', icon: FileText, group: 'main' },
];

const advancedSections = [
  { id: 'ai-intelligence', label: 'AI Intelligence', icon: Brain, group: 'advanced' },
  { id: 'habits', label: 'Habit Tracker', icon: CalendarDays, group: 'advanced' },
  { id: 'focus', label: 'Focus Score', icon: Eye, group: 'advanced' },
  { id: 'timeline', label: 'Growth Timeline', icon: GitBranch, group: 'advanced' },
  { id: 'practice-plan', label: 'Practice Plan', icon: Wand2, group: 'advanced' },
  { id: 'benchmark', label: 'Benchmarks', icon: Users, group: 'advanced' },
  { id: 'engagement', label: 'Engagement', icon: Heart, group: 'advanced' },
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

        <SidebarGroup>
          <SidebarGroupLabel>Advanced Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedSections.map(s => (
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

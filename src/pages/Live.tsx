import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { BottomNav } from '@/components/layout/BottomNav';
import { HamburgerMenu } from '@/components/layout/HamburgerMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, Clock, Calendar, Users, Video, Bell, 
  GraduationCap, MessageSquare, Globe
} from 'lucide-react';

interface LiveClass {
  id: string;
  title: string;
  teacher: string;
  date: string;
  time: string;
  duration: string;
  level: string;
  topic: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'live' | 'completed';
  icon: React.ElementType;
}

const sampleClasses: LiveClass[] = [
  {
    id: '1',
    title: 'Pronunciation Masterclass',
    teacher: 'Ms. Sarah',
    date: 'Today',
    time: '4:00 PM',
    duration: '45 min',
    level: 'Beginner',
    topic: 'Vowel Sounds',
    participants: 12,
    maxParticipants: 25,
    status: 'live',
    icon: GraduationCap,
  },
  {
    id: '2',
    title: 'Conversation Club',
    teacher: 'Mr. James',
    date: 'Today',
    time: '6:00 PM',
    duration: '30 min',
    level: 'Intermediate',
    topic: 'Daily Routines',
    participants: 8,
    maxParticipants: 15,
    status: 'upcoming',
    icon: MessageSquare,
  },
  {
    id: '3',
    title: 'Grammar Workshop',
    teacher: 'Ms. Priya',
    date: 'Tomorrow',
    time: '10:00 AM',
    duration: '60 min',
    level: 'Beginner',
    topic: 'Present Tense',
    participants: 5,
    maxParticipants: 20,
    status: 'upcoming',
    icon: Globe,
  },
  {
    id: '4',
    title: 'Reading Aloud Session',
    teacher: 'Mr. David',
    date: 'Tomorrow',
    time: '3:00 PM',
    duration: '30 min',
    level: 'All Levels',
    topic: 'Short Stories',
    participants: 0,
    maxParticipants: 30,
    status: 'upcoming',
    icon: GraduationCap,
  },
];

export default function Live() {
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const filteredClasses = sampleClasses.filter(c => filter === 'all' || c.status === filter);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-destructive animate-pulse" />
            Live <span className="gradient-text">Classes</span>
          </h1>
          <p className="text-sm text-muted-foreground">Join live sessions with expert teachers</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'live', 'upcoming'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'live' && <Radio className="h-3 w-3 mr-1" />}
              {f}
            </Button>
          ))}
        </div>

        {/* Class List */}
        <div className="space-y-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Color bar */}
                  <div className={`w-1.5 ${cls.status === 'live' ? 'bg-destructive animate-pulse' : 'bg-primary/30'}`} />
                  
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <cls.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{cls.title}</h3>
                          <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                        </div>
                      </div>
                      {cls.status === 'live' ? (
                        <Badge variant="destructive" className="text-[10px] animate-pulse">● LIVE</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{cls.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cls.time}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{cls.participants}/{cls.maxParticipants}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px]">{cls.level}</Badge>
                        <Badge variant="outline" className="text-[10px]">{cls.topic}</Badge>
                      </div>
                      <Button size="sm" variant={cls.status === 'live' ? 'gradient' : 'outline'}>
                        {cls.status === 'live' ? (
                          <><Video className="h-3 w-3 mr-1" />Join Now</>
                        ) : (
                          <><Bell className="h-3 w-3 mr-1" />Remind Me</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No {filter} classes right now</p>
          </div>
        )}
      </div>
      <HamburgerMenu />
      <BottomNav />
    </Layout>
  );
}

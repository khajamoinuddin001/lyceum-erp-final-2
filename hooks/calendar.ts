import type { CalendarEvent } from '../types';

export const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 101,
    title: 'Mid-term Project Due',
    start: new Date(new Date().setDate(new Date().getDate() + 2)),
    end: new Date(new Date().setDate(new Date().getDate() + 2)),
    color: 'red',
    description: 'Submit the project for CS101.'
  },
  {
    id: 102,
    title: 'Study Group for Finals',
    start: new Date(new Date().setDate(new Date().getDate() + 5)),
    end: new Date(new Date().setDate(new Date().getDate() + 5)),
    color: 'blue',
  },
  {
    id: 103,
    title: 'Quiz 3',
    start: new Date(new Date().setDate(new Date().getDate() + 6)),
    end: new Date(new Date().setDate(new Date().getDate() + 6)),
    color: 'purple',
  }
];

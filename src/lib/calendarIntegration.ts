/**
 * Calendar Integration
 * 
 * Export reminders and financial milestones to native calendar apps.
 * Generates iCalendar (.ics) files, creates subscriptions, and handles deep links.
 */

export interface FinancialMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate: number;      // Unix timestamp (ms)
  category: 'savings' | 'investment' | 'debt' | 'income' | 'spending';
  amount?: number;
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: number;
  };
  metadata?: Record<string, any>;
}

export interface ICalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;       // Unix timestamp (ms)
  endTime?: number;
  location?: string;
  alarmMinutesBefore?: number[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endTime?: number;
  };
  url?: string;           // Deep link
  metadata?: Record<string, any>;
}

class CalendarIntegration {
  private static instance: CalendarIntegration;

  private constructor() {}

  static getInstance(): CalendarIntegration {
    if (!CalendarIntegration.instance) {
      CalendarIntegration.instance = new CalendarIntegration();
    }
    return CalendarIntegration.instance;
  }

  /**
   * Generate iCalendar (.ics) string from events
   */
  generateIcsForReminders(reminders: any[]): string {
    const events = reminders.map((r) => this.reminderToIcsEvent(r));
    return this.generateIcsContent(events, 'ARTH.OS Reminders');
  }

  /**
   * Generate iCalendar (.ics) for financial milestones
   */
  generateIcsForMilestones(milestones: FinancialMilestone[]): string {
    const events = milestones.map((m) => this.milestoneToIcsEvent(m));
    return this.generateIcsContent(events, 'ARTH.OS Financial Milestones');
  }

  /**
   * Download .ics file to user's device
   */
  downloadIcs(events: ICalendarEvent[], filename: string): void {
    const icsContent = this.generateIcsContent(events, 'ARTH.OS Events');
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info('ICS file downloaded', { filename });
  }

  /**
   * Generate calendar subscription link (Google Calendar format)
   */
  generateSubscriptionLink(filename: string): string {
    const baseUrl = window.location.origin;
    const downloadUrl = `${baseUrl}/api/calendar/export?filename=${encodeURIComponent(filename)}`;

    // Google Calendar can subscribe to .ics URLs
    return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(downloadUrl)}`;
  }

  /**
   * Open native calendar app with event (iOS/Android)
   */
  openNativeCalendarApp(event: ICalendarEvent): void {
    const startDate = new Date(event.startTime);

    // iOS calendar scheme
    const iosCalendarUrl = `calshow://${this.dateToCalendarFormat(startDate)}`;

    // Android intent (more complex, requires app-specific setup)
    // For now, fallback to Google Calendar link
    const googleCalendarUrl = this.generateGoogleCalendarLink(event);

    // Try iOS first, fallback to web
    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
      window.location.href = iosCalendarUrl;
    } else {
      window.open(googleCalendarUrl, '_blank');
    }

    console.info('Calendar app opened', { eventId: event.id });
  }

  /**
   * Save events to Google Calendar via OAuth (web)
   */
  async saveToGoogleCalendar(_events: ICalendarEvent[]): Promise<void> {
    // This would require Google Calendar API setup + OAuth flow
    // For now, provide instructions
    console.info('Google Calendar integration requires OAuth setup');
    console.info('See: https://developers.google.com/calendar/api');

    // Placeholder for future implementation
    throw new Error('Google Calendar OAuth not yet implemented');
  }

  /**
   * Save events to Microsoft Calendar via OAuth (web)
   */
  async saveToMicrosoftCalendar(_events: ICalendarEvent[]): Promise<void> {
    // This would require Microsoft Graph API setup + OAuth flow
    console.info('Microsoft Calendar integration requires OAuth setup');
    console.info('See: https://docs.microsoft.com/graph/api/resources/calendar');

    throw new Error('Microsoft Calendar OAuth not yet implemented');
  }

  /**
   * Generate deep link to app with calendar context
   */
  generateDeepLink(eventId: string, context: 'reminder' | 'milestone'): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/calendar/${context}/${eventId}`;
  }

  // ============ Private helpers ============

  private reminderToIcsEvent(reminder: any): ICalendarEvent {
    return {
      id: reminder.id,
      title: reminder.title,
      description: reminder.body,
      startTime: reminder.deliverAt,
      endTime: reminder.deliverAt + 30 * 60 * 1000, // 30 min duration
      url: reminder.actionUrl,
      alarmMinutesBefore: [15],
      metadata: reminder.metadata
    };
  }

  private milestoneToIcsEvent(milestone: FinancialMilestone): ICalendarEvent {
    const description = milestone.amount
      ? `Target: ${this.formatCurrency(milestone.amount)} (${milestone.category})`
      : milestone.category;

    return {
      id: milestone.id,
      title: milestone.title,
      description: `${description}${milestone.description ? ` - ${milestone.description}` : ''}`,
      startTime: milestone.targetDate,
      endTime: milestone.targetDate + 60 * 60 * 1000, // 1 hour
      alarmMinutesBefore: [60 * 24], // 1 day before
      recurrence: milestone.recurring ? {
        frequency: milestone.recurring.frequency,
        interval: milestone.recurring.interval,
        endTime: milestone.recurring.endDate
      } : undefined,
      metadata: milestone.metadata
    };
  }

  private generateIcsContent(events: ICalendarEvent[], calendarName: string): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ARTH.OS//Financial Wellness//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `NAME:${calendarName}`,
      `DESCRIPTION:${calendarName} from ARTH.OS`,
      'X-WR-CALNAME:' + calendarName,
      'X-WR-TIMEZONE:UTC'
    ];

    for (const event of events) {
      lines.push(this.eventToIcsVevent(event));
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  private eventToIcsVevent(event: ICalendarEvent): string {
    const uid = `${event.id}@arthOS.app`;
    const dtstamp = this.toIcsDateTime(new Date());
    const dtstart = this.toIcsDateTime(new Date(event.startTime));
    const dtend = this.toIcsDateTime(new Date(event.endTime || event.startTime + 60 * 60 * 1000));
    const summary = this.escapeIcsString(event.title);
    const description = event.description ? this.escapeIcsString(event.description) : '';

    const vevent: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`
    ];

    if (description) {
      vevent.push(`DESCRIPTION:${description}`);
    }

    if (event.location) {
      vevent.push(`LOCATION:${this.escapeIcsString(event.location)}`);
    }

    if (event.url) {
      vevent.push(`URL:${event.url}`);
    }

    if (event.recurrence) {
      const rrule = this.recurrenceToRrule(event.recurrence);
      vevent.push(`RRULE:${rrule}`);
    }

    if (event.alarmMinutesBefore && event.alarmMinutesBefore.length > 0) {
      for (const minutes of event.alarmMinutesBefore) {
        vevent.push('BEGIN:VALARM');
        vevent.push('ACTION:DISPLAY');
        vevent.push(`TRIGGER:-PT${minutes}M`);
        vevent.push(`DESCRIPTION:Reminder: ${summary}`);
        vevent.push('END:VALARM');
      }
    }

    vevent.push('END:VEVENT');

    return vevent.join('\r\n');
  }

  private toIcsDateTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  }

  private recurrenceToRrule(recurrence: {
    frequency: string;
    interval: number;
    endTime?: number;
  }): string {
    const freq = recurrence.frequency.toUpperCase();
    let rrule = `FREQ=${freq};INTERVAL=${recurrence.interval}`;

    if (recurrence.endTime) {
      const endDate = this.toIcsDateTime(new Date(recurrence.endTime));
      rrule += `;UNTIL=${endDate}`;
    }

    return rrule;
  }

  private escapeIcsString(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  private dateToCalendarFormat(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  private generateGoogleCalendarLink(event: ICalendarEvent): string {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime || event.startTime + 60 * 60 * 1000);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description || '',
      location: event.location || '',
      dates: `${this.dateToCalendarFormat(startDate)}/${this.dateToCalendarFormat(endDate)}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

/**
 * Global singleton getter
 */
export function getCalendarIntegration(): CalendarIntegration {
  return CalendarIntegration.getInstance();
}

export default CalendarIntegration;

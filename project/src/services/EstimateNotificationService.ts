import { supabase } from '../lib/supabase';
import { NotificationService } from './NotificationService';
import { Tables } from '../lib/dbTypes';

// Composite type for estimate with joined customer and ticket data
type EstimateWithJoins = Pick<
  Tables<'estimates'>,
  'id' | 'estimate_number' | 'total_amount' | 'accepted_date' | 'converted_to_ticket_id' | 'updated_by'
> & {
  customer: Pick<Tables<'customers'>, 'name'> | null;
  ticket: Pick<Tables<'tickets'>, 'ticket_number'> | null;
};

export interface EstimateAcceptanceDetails {
  estimateId: string;
  estimateNumber: string;
  ticketId: string | null;
  ticketNumber: string | null;
  customerName: string;
  total: number;
  acceptedAt: string;
  acceptedBy: string | null;
  ahsCoveredAmount: number | null;
  customerResponsibility: number | null;
}

export class EstimateNotificationService {
  /**
   * Handle estimate acceptance - creates notifications and optionally sends email
   */
  static async onEstimateAccepted(
    estimateId: string,
    acceptedBy?: string
  ): Promise<void> {
    try {
      // Get estimate details
      const details = await this.getEstimateDetails(estimateId);

      if (!details) {
        console.error('Could not find estimate details for notification');
        return;
      }

      const ahsCoveredAmount: number | null = null;
      const customerResponsibility: number | null = null;

      // Build notification message
      const message = this.buildNotificationMessage({
        ...details,
        ahsCoveredAmount,
        customerResponsibility,
      });

      // Create notification for dispatch/admin users
      await NotificationService.broadcastToRoles(['admin', 'dispatcher'], {
        notificationType: 'estimate_accepted',
        title: `Estimate ${details.estimateNumber} Accepted`,
        message,
        metadata: {
          estimateId,
          estimateNumber: details.estimateNumber,
          ticketId: details.ticketId,
          ticketNumber: details.ticketNumber,
          customerName: details.customerName,
          total: details.total,
          ahsCoveredAmount,
          customerResponsibility,
          acceptedBy: acceptedBy || details.acceptedBy,
        },
      });

      // Log the notification
      console.log(
        `Estimate acceptance notification sent for ${details.estimateNumber}`
      );
    } catch (error) {
      console.error('Error in onEstimateAccepted:', error);
    }
  }

  /**
   * Handle estimate decline
   */
  static async onEstimateDeclined(
    estimateId: string,
    declinedBy?: string,
    reason?: string
  ): Promise<void> {
    try {
      const details = await this.getEstimateDetails(estimateId);

      if (!details) {
        console.error('Could not find estimate details for decline notification');
        return;
      }

      const message = reason
        ? `Estimate ${details.estimateNumber} for ${details.customerName} was declined. Reason: ${reason}`
        : `Estimate ${details.estimateNumber} for ${details.customerName} was declined.`;

      await NotificationService.broadcastToRoles(['admin', 'dispatcher'], {
        notificationType: 'estimate_declined',
        title: `Estimate ${details.estimateNumber} Declined`,
        message,
        metadata: {
          estimateId,
          estimateNumber: details.estimateNumber,
          ticketId: details.ticketId,
          customerName: details.customerName,
          total: details.total,
          reason,
          declinedBy,
        },
      });
    } catch (error) {
      console.error('Error in onEstimateDeclined:', error);
    }
  }

  /**
   * Get estimate details for notification
   */
  private static async getEstimateDetails(
    estimateId: string
  ): Promise<EstimateAcceptanceDetails | null> {
    try {
      const { data, error } = await (supabase
        .from('estimates') as unknown as {
          select: (query: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{ data: EstimateWithJoins | null; error: Error | null }>;
            };
          };
        })
        .select(`
          id,
          estimate_number,
          total_amount,
          accepted_date,
          updated_by,
          converted_to_ticket_id,
          customer:customers(name),
          ticket:tickets(ticket_number)
        `)
        .eq('id', estimateId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching estimate details:', error);
        return null;
      }

      const customer = data.customer;
      const ticket = data.ticket;

      return {
        estimateId: data.id,
        estimateNumber: data.estimate_number,
        ticketId: data.converted_to_ticket_id,
        ticketNumber: ticket?.ticket_number || null,
        customerName: customer?.name || 'Unknown Customer',
        total: data.total_amount || 0,
        acceptedAt: data.accepted_date || new Date().toISOString(),
        acceptedBy: data.updated_by,
        ahsCoveredAmount: null,
        customerResponsibility: null,
      };
    } catch (error) {
      console.error('Error in getEstimateDetails:', error);
      return null;
    }
  }

  /**
   * Build notification message for estimate acceptance
   */
  private static buildNotificationMessage(
    details: EstimateAcceptanceDetails
  ): string {
    const parts: string[] = [];

    parts.push(`Customer: ${details.customerName}`);

    if (details.ticketNumber) {
      parts.push(`Ticket: ${details.ticketNumber}`);
    }

    parts.push(`Total: $${details.total.toFixed(2)}`);

    return parts.join(' | ');
  }

  /**
   * Subscribe to estimate acceptance events (for realtime updates)
   * Returns unsubscribe function
   */
  static subscribeToEstimateAcceptance(
    callback: (details: EstimateAcceptanceDetails) => void
  ): () => void {
    const subscription = supabase
      .channel('estimate-acceptance')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'estimates',
          filter: 'status=eq.accepted',
        },
        async (payload) => {
          if (payload.new && payload.new.id) {
            const details = await this.getEstimateDetails(payload.new.id);
            if (details) {
              callback(details);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

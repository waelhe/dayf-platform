/**
 * Booking Repository Implementation
 * تنفيذ مستودع الحجوزات
 * 
 * Implements IBookingRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseBooking } from '@/lib/supabase';
import type { Booking, BookingFilters, BookingStats, IBookingRepository } from '../../domain/interfaces';
import { BookingStatus } from '@/core/types/enums';
import { DatabaseError } from '@/core/database';

/**
 * Booking Repository
 * مستودع الحجوزات
 */
export class BookingRepository extends BaseRepository<Booking> implements IBookingRepository {
  constructor() {
    super(TABLES.BOOKINGS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Booking {
    const dbRow = row as unknown as SupabaseBooking;
    
    return {
      id: dbRow.id,
      guestId: dbRow.guest_id,
      hostId: dbRow.host_id,
      serviceId: dbRow.service_id,
      checkIn: dbRow.check_in,
      checkOut: dbRow.check_out,
      guests: dbRow.guests,
      totalPrice: dbRow.total_price,
      status: dbRow.status as BookingStatus,
      escrowId: dbRow.escrow_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Booking>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.guestId !== undefined) row.guest_id = entity.guestId;
    if (entity.hostId !== undefined) row.host_id = entity.hostId;
    if (entity.serviceId !== undefined) row.service_id = entity.serviceId;
    if (entity.checkIn !== undefined) row.check_in = entity.checkIn;
    if (entity.checkOut !== undefined) row.check_out = entity.checkOut;
    if (entity.guests !== undefined) row.guests = entity.guests;
    if (entity.totalPrice !== undefined) row.total_price = entity.totalPrice;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.escrowId !== undefined) row.escrow_id = entity.escrowId;

    return row;
  }

  // ============================================
  // Booking-Specific Repository Methods
  // ============================================

  /**
   * Find bookings by guest ID
   * البحث عن حجوزات بواسطة الضيف
   */
  async findByGuest(guestId: string): Promise<Booking[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, guestId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, guestId });
    }
  }

  /**
   * Find bookings by host ID
   * البحث عن حجوزات بواسطة المضيف
   */
  async findByHost(hostId: string): Promise<Booking[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, hostId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, hostId });
    }
  }

  /**
   * Find bookings with filters
   * البحث عن حجوزات مع فلاتر
   */
  async findWithFilters(filters: BookingFilters): Promise<Booking[]> {
    try {
      const client = this.getClient();
      let query = client.from(this.tableName).select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.guestId) {
        query = query.eq('guest_id', filters.guestId);
      }
      if (filters.hostId) {
        query = query.eq('host_id', filters.hostId);
      }
      if (filters.serviceId) {
        query = query.eq('service_id', filters.serviceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, filters });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters });
    }
  }

  /**
   * Update booking status
   * تحديث حالة الحجز
   */
  async updateStatus(bookingId: string, status: BookingStatus): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status,
          updated_at: now,
        })
        .eq('id', bookingId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, bookingId, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, bookingId, operation: 'updateStatus' });
    }
  }

  /**
   * Check service availability
   * التحقق من توفر الخدمة
   */
  async checkAvailability(
    serviceId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    try {
      const client = this.getClient();
      const checkInISO = checkIn.toISOString();
      const checkOutISO = checkOut.toISOString();

      // Find conflicting bookings
      const { data, error } = await client
        .from(this.tableName)
        .select('id')
        .eq('service_id', serviceId)
        .in('status', [BookingStatus.PENDING, BookingStatus.CONFIRMED])
        .or(`check_in.lte.${checkOutISO},check_out.gte.${checkInISO}`);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, serviceId, operation: 'checkAvailability' });
      }

      // Filter for actual conflicts
      const conflicts = (data || []).filter(booking => {
        const existingCheckIn = new Date((booking as any).check_in);
        const existingCheckOut = new Date((booking as any).check_out);
        
        // Check for overlap
        return (
          (checkIn >= existingCheckIn && checkIn < existingCheckOut) ||
          (checkOut > existingCheckIn && checkOut <= existingCheckOut) ||
          (checkIn <= existingCheckIn && checkOut >= existingCheckOut)
        );
      });

      return conflicts.length === 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, serviceId, operation: 'checkAvailability' });
    }
  }

  /**
   * Get booking stats for provider
   * الحصول على إحصائيات الحجوزات للمزود
   */
  async getStatsByHost(hostId: string): Promise<BookingStats> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client
        .from(this.tableName)
        .select('status, total_price')
        .eq('host_id', hostId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, hostId, operation: 'getStatsByHost' });
      }

      const stats: BookingStats = {
        totalEarnings: 0,
        totalBookings: data?.length || 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
      };

      for (const booking of (data || [])) {
        const status = booking.status as BookingStatus;
        const price = Number(booking.total_price) || 0;

        switch (status) {
          case BookingStatus.PENDING:
            stats.pendingBookings++;
            break;
          case BookingStatus.CONFIRMED:
            stats.confirmedBookings++;
            stats.totalEarnings += price;
            break;
          case BookingStatus.COMPLETED:
            stats.completedBookings++;
            stats.totalEarnings += price;
            break;
          case BookingStatus.CANCELLED:
            stats.cancelledBookings++;
            break;
        }
      }

      return stats;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, hostId, operation: 'getStatsByHost' });
    }
  }

  /**
   * Link booking to escrow
   * ربط الحجز بالضمان
   */
  async linkEscrow(bookingId: string, escrowId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          escrow_id: escrowId,
          updated_at: now,
        })
        .eq('id', bookingId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, bookingId, escrowId, operation: 'linkEscrow' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, bookingId, operation: 'linkEscrow' });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let bookingRepositoryInstance: BookingRepository | null = null;

/**
 * Get the BookingRepository singleton instance
 * الحصول على مثيل مستودع الحجوزات
 */
export function getBookingRepository(): BookingRepository {
  if (!bookingRepositoryInstance) {
    bookingRepositoryInstance = new BookingRepository();
  }
  return bookingRepositoryInstance;
}

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MessageType } from '../../generated/prisma/enums';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.participantId) {
      throw new BadRequestException('Cannot create a conversation with yourself');
    }

    // Verify participant exists
    const participant = await this.prisma.user.findUnique({
      where: { id: dto.participantId },
      select: { id: true },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // If bookingId provided, validate both users are participants on that booking
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        select: { customerId: true, workerId: true },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      const bookingParticipants = [booking.customerId, booking.workerId].filter(Boolean);
      if (!bookingParticipants.includes(userId) || !bookingParticipants.includes(dto.participantId)) {
        throw new ForbiddenException('Both users must be participants of the booking');
      }
    }

    // Always store smaller UUID as participantOneId for unique constraint consistency
    const [participantOneId, participantTwoId] =
      userId < dto.participantId ? [userId, dto.participantId] : [dto.participantId, userId];

    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        participantOneId_participantTwoId: { participantOneId, participantTwoId },
      },
      include: {
        participantOne: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        participantTwo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participantOneId,
          participantTwoId,
          bookingId: dto.bookingId,
        },
        include: {
          participantOne: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          participantTwo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      });
    }

    // Transform to include otherParticipant
    const otherParticipant =
      conversation.participantOneId === userId
        ? conversation.participantTwo
        : conversation.participantOne;

    return {
      ...conversation,
      otherParticipant,
    };
  }

  async getUserConversations(userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const where = {
      OR: [{ participantOneId: userId }, { participantTwoId: userId }],
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participantOne: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          participantTwo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, senderId: true },
          },
        },
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    // Get unread counts for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count.id]));

    const items = conversations.map((conv) => {
      const otherParticipant =
        conv.participantOneId === userId ? conv.participantTwo : conv.participantOne;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        bookingId: conv.bookingId,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        otherParticipant,
        lastMessage,
        unreadCount: unreadMap.get(conv.id) || 0,
      };
    });

    return {
      items,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMessages(userId: string, conversationId: string, query: MessageQueryDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    this.assertParticipant(conversation, userId);

    const where: any = { conversationId };

    // Cursor-based pagination: load messages older than cursor
    if (query.cursor) {
      const cursorMessage = await this.prisma.message.findUnique({
        where: { id: query.cursor },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    return {
      items: messages.reverse(), // Return in chronological order
      hasMore: messages.length === query.limit,
    };
  }

  async sendMessage(senderId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    this.assertParticipant(conversation, senderId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: dto.content,
          messageType: dto.messageType || MessageType.TEXT,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async markMessagesAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    this.assertParticipant(conversation, userId);

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { markedCount: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          OR: [{ participantOneId: userId }, { participantTwoId: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { count };
  }

  getRecipientId(conversation: { participantOneId: string; participantTwoId: string }, senderId: string): string {
    return conversation.participantOneId === senderId
      ? conversation.participantTwoId
      : conversation.participantOneId;
  }

  private assertParticipant(
    conversation: { participantOneId: string; participantTwoId: string },
    userId: string,
  ) {
    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }
  }
}

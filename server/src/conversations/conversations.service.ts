import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Get or create a conversation between two users about a shipment
   */
  async getOrCreateConversation(userId: string, userEmail: string, dto: CreateConversationDto) {
    // Ensure current user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      await this.prisma.user.create({
        data: { id: userId, email: userEmail },
      });
    }

    // Check if shipment exists
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: dto.shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Determine user roles (sender is always user1)
    const isSender = shipment.senderId === userId;
    const user1Id = shipment.senderId;
    const user2Id = isSender ? dto.recipientId : userId;

    // Don't allow conversation with self
    if (user1Id === user2Id) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Ensure recipient user exists (they might not be in DB yet)
    const recipientId = isSender ? dto.recipientId : shipment.senderId;
    const recipientExists = await this.prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipientExists) {
      // Create placeholder user - they'll update their profile when they sign in
      await this.prisma.user.create({
        data: { id: recipientId, email: `${recipientId}@placeholder.raven` },
      });
    }

    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        shipmentId: dto.shipmentId,
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
      include: {
        user1: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        user2: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        shipment: {
          select: { id: true, originCity: true, destCity: true, price: true, currency: true, status: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    // Create new conversation if not exists
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
          shipmentId: dto.shipmentId,
        },
        include: {
          user1: {
            select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
          },
          user2: {
            select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
          },
          shipment: {
            select: { id: true, originCity: true, destCity: true, price: true, currency: true, status: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      });

      // Send initial message if provided
      if (dto.initialMessage) {
        await this.sendMessage(userId, conversation.id, { content: dto.initialMessage });
        // Refresh conversation
        conversation = await this.getConversationById(userId, conversation.id);
        return conversation;
      }
    }

    // Determine other user and canMatch for client
    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return {
      ...conversation,
      otherUser,
      isSender,
      canMatch: isSender && shipment.status === 'OPEN',
    };
  }

  /**
   * Get all conversations for a user (Inbox)
   */
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        user2: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        shipment: {
          select: { id: true, originCity: true, destCity: true, price: true, currency: true, status: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add unread count and format for client
    return Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        // Determine the "other" user for display
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

        return {
          ...conv,
          otherUser,
          unreadCount,
          lastMessage: conv.messages[0] || null,
        };
      })
    );
  }

  /**
   * Get a single conversation by ID
   */
  async getConversationById(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        user2: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        shipment: {
          select: {
            id: true,
            originCity: true,
            destCity: true,
            price: true,
            currency: true,
            status: true,
            senderId: true,
            courierId: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check access
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Determine other user
    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const isSender = conversation.shipment.senderId === userId;

    return {
      ...conversation,
      otherUser,
      isSender,
      canMatch: isSender && conversation.shipment.status === 'OPEN',
    };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        shipment: { select: { senderId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check access
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Check if owner is responding - if so, activate the conversation
    const isOwner = conversation.shipment.senderId === userId;
    const shouldActivate = isOwner && conversation.status === 'PENDING';

    // Create message
    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        type: dto.type || 'TEXT',
        conversationId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update conversation - status and last message
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: dto.content,
        lastMessageAt: new Date(),
        ...(shouldActivate && { status: 'ACTIVE' }),
      },
    });

    return message;
  }

  /**
   * Get total unread message count for a user
   */
  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: { id: true },
    });

    const count = await this.prisma.message.count({
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Mark all messages in a conversation as read by the current user
   */
  async markMessagesAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check access
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Update all messages from the other user to READ
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        isRead: true,
      },
    });

    return { success: true };
  }
}

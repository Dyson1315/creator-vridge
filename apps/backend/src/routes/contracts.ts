import express from 'express';
import { PrismaClient, ContractStatus, ContractPriority } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createContractRequestSchema = z.object({
  artistUserId: z.string().uuid(),
  artworkId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  deadline: z.string().datetime().optional(),
  deliverables: z.array(z.string()).optional(),
  requirements: z.object({
    format: z.string().optional(),
    resolution: z.string().optional(),
    style: z.string().optional(),
    revisions: z.number().optional(),
    usage: z.string().optional(),
    additionalNotes: z.string().optional()
  }).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL')
});

const updateContractStatusSchema = z.object({
  status: z.enum(['VIEWED', 'IN_NEGOTIATION', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional()
});

/**
 * POST /api/contracts/request
 * Create a new contract request from VTuber to Artist
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const vtuberUserId = req.user!.userId;
    const {
      artistUserId,
      artworkId,
      title,
      description,
      budgetMin,
      budgetMax,
      deadline,
      deliverables,
      requirements,
      priority
    } = req.body;

    // Check if user is VTuber
    if (req.user!.userType !== 'VTUBER') {
      return res.status(403).json({ 
        error: 'Only VTuber users can create contract requests' 
      });
    }

    // Validate budget range
    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      return res.status(400).json({ 
        error: 'Minimum budget cannot be greater than maximum budget' 
      });
    }

    // Check if artist exists and is actually an artist
    const artist = await prisma.user.findUnique({
      where: { id: artistUserId },
      include: { profile: true }
    });

    if (!artist) {
      return res.status(404).json({ 
        error: 'Artist not found' 
      });
    }

    if (artist.userType !== 'ARTIST') {
      return res.status(400).json({ 
        error: 'Specified user is not an artist' 
      });
    }

    // Check if artwork exists and belongs to the artist (if provided)
    if (artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId }
      });

      if (!artwork) {
        return res.status(404).json({ 
          error: 'Artwork not found' 
        });
      }

      if (artwork.artistUserId !== artistUserId) {
        return res.status(400).json({ 
          error: 'Artwork does not belong to the specified artist' 
        });
      }
    }

    // Check for duplicate recent requests (prevent spam)
    const recentRequest = await prisma.contractRequest.findFirst({
      where: {
        vtuberUserId,
        artistUserId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        status: {
          in: ['PENDING', 'VIEWED', 'IN_NEGOTIATION']
        }
      }
    });

    if (recentRequest) {
      return res.status(409).json({ 
        error: 'You already have a pending request with this artist. Please wait for a response or cancel the existing request.' 
      });
    }

    // Create contract request
    const contractRequest = await prisma.contractRequest.create({
      data: {
        vtuberUserId,
        artistUserId,
        artworkId,
        title,
        description,
        budgetMin,
        budgetMax,
        deadline: deadline ? new Date(deadline) : null,
        deliverables: deliverables || [],
        requirements: requirements || {},
        priority: priority as ContractPriority,
        status: 'PENDING'
      },
      include: {
        vtuberUser: {
          include: { profile: true }
        },
        artistUser: {
          include: { profile: true }
        },
        artwork: true
      }
    });

    // Create notification record (could be extended with actual notification service)
    // TODO: Implement notification service

    res.status(201).json({
      success: true,
      contractRequest: {
        id: contractRequest.id,
        title: contractRequest.title,
        description: contractRequest.description,
        status: contractRequest.status,
        priority: contractRequest.priority,
        budgetRange: {
          min: contractRequest.budgetMin,
          max: contractRequest.budgetMax
        },
        deadline: contractRequest.deadline,
        createdAt: contractRequest.createdAt,
        artist: {
          id: contractRequest.artistUser.id,
          displayName: contractRequest.artistUser.profile?.displayName || 'Unknown Artist',
          avatarUrl: contractRequest.artistUser.profile?.avatarUrl
        },
        artwork: contractRequest.artwork ? {
          id: contractRequest.artwork.id,
          title: contractRequest.artwork.title,
          imageUrl: contractRequest.artwork.imageUrl,
          thumbnailUrl: contractRequest.artwork.thumbnailUrl
        } : null
      }
    });

  } catch (error) {
    console.error('Error creating contract request:', error);
    res.status(500).json({ 
      error: 'Failed to create contract request' 
    });
  }
});

/**
 * GET /api/contracts/requests
 * Get contract requests for the authenticated user
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const userType = req.user!.userType;
    
    const { status, limit = '20', offset = '0' } = req.query;

    const whereClause: any = {};
    
    // Filter by user role
    if (userType === 'VTUBER') {
      whereClause.vtuberUserId = userId;
    } else if (userType === 'ARTIST') {
      whereClause.artistUserId = userId;
    } else {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Filter by status if provided
    if (status && typeof status === 'string') {
      whereClause.status = status.toUpperCase();
    }

    const requests = await prisma.contractRequest.findMany({
      where: whereClause,
      include: {
        vtuberUser: {
          include: { profile: true }
        },
        artistUser: {
          include: { profile: true }
        },
        artwork: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.contractRequest.count({ where: whereClause });

    const formattedRequests = requests.map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      budgetRange: {
        min: request.budgetMin,
        max: request.budgetMax,
        currency: request.currency
      },
      deadline: request.deadline,
      deliverables: request.deliverables,
      requirements: request.requirements,
      notes: request.notes,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      viewedAt: request.viewedAt,
      respondedAt: request.respondedAt,
      vtuber: {
        id: request.vtuberUser.id,
        displayName: request.vtuberUser.profile?.displayName || 'Unknown VTuber',
        avatarUrl: request.vtuberUser.profile?.avatarUrl
      },
      artist: {
        id: request.artistUser.id,
        displayName: request.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: request.artistUser.profile?.avatarUrl
      },
      artwork: request.artwork ? {
        id: request.artwork.id,
        title: request.artwork.title,
        imageUrl: request.artwork.imageUrl,
        thumbnailUrl: request.artwork.thumbnailUrl
      } : null
    }));

    res.json({
      requests: formattedRequests,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + formattedRequests.length < total
      }
    });

  } catch (error) {
    console.error('Error getting contract requests:', error);
    res.status(500).json({ 
      error: 'Failed to get contract requests' 
    });
  }
});

/**
 * GET /api/contracts/requests/:id
 * Get specific contract request details
 */
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const request = await prisma.contractRequest.findUnique({
      where: { id },
      include: {
        vtuberUser: {
          include: { profile: true }
        },
        artistUser: {
          include: { profile: true }
        },
        artwork: true
      }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Contract request not found' 
      });
    }

    // Check if user has access to this request
    if (request.vtuberUserId !== userId && request.artistUserId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Mark as viewed if accessed by artist and not viewed yet
    if (request.artistUserId === userId && !request.viewedAt) {
      await prisma.contractRequest.update({
        where: { id },
        data: { 
          viewedAt: new Date(),
          status: request.status === 'PENDING' ? 'VIEWED' : request.status
        }
      });
      request.viewedAt = new Date();
      if (request.status === 'PENDING') {
        request.status = 'VIEWED';
      }
    }

    const response = {
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      budgetRange: {
        min: request.budgetMin,
        max: request.budgetMax,
        currency: request.currency
      },
      deadline: request.deadline,
      deliverables: request.deliverables,
      requirements: request.requirements,
      notes: request.notes,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      viewedAt: request.viewedAt,
      respondedAt: request.respondedAt,
      acceptedAt: request.acceptedAt,
      rejectedAt: request.rejectedAt,
      completedAt: request.completedAt,
      vtuber: {
        id: request.vtuberUser.id,
        displayName: request.vtuberUser.profile?.displayName || 'Unknown VTuber',
        avatarUrl: request.vtuberUser.profile?.avatarUrl,
        bio: request.vtuberUser.profile?.bio
      },
      artist: {
        id: request.artistUser.id,
        displayName: request.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: request.artistUser.profile?.avatarUrl,
        bio: request.artistUser.profile?.bio,
        rating: request.artistUser.profile?.rating,
        totalReviews: request.artistUser.profile?.totalReviews
      },
      artwork: request.artwork ? {
        id: request.artwork.id,
        title: request.artwork.title,
        description: request.artwork.description,
        imageUrl: request.artwork.imageUrl,
        thumbnailUrl: request.artwork.thumbnailUrl,
        style: request.artwork.style,
        category: request.artwork.category,
        tags: request.artwork.tags
      } : null
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting contract request details:', error);
    res.status(500).json({ 
      error: 'Failed to get contract request details' 
    });
  }
});

/**
 * PUT /api/contracts/requests/:id/status
 * Update contract request status (for artists)
 */
router.put('/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body;

    const request = await prisma.contractRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ 
        error: 'Contract request not found' 
      });
    }

    // Check if user is the artist for this request
    if (request.artistUserId !== userId) {
      return res.status(403).json({ 
        error: 'Only the target artist can update request status' 
      });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['VIEWED', 'ACCEPTED', 'REJECTED'],
      'VIEWED': ['IN_NEGOTIATION', 'ACCEPTED', 'REJECTED'],
      'IN_NEGOTIATION': ['ACCEPTED', 'REJECTED'],
      'ACCEPTED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'REJECTED': [],
      'COMPLETED': [],
      'CANCELLED': []
    };

    if (!validTransitions[request.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${request.status} to ${status}` 
      });
    }

    // Prepare update data
    const updateData: any = {
      status: status as ContractStatus,
      updatedAt: new Date()
    };

    // Set timestamps based on status
    if (status === 'VIEWED' && !request.viewedAt) {
      updateData.viewedAt = new Date();
    }
    
    if (['ACCEPTED', 'REJECTED', 'IN_NEGOTIATION'].includes(status) && !request.respondedAt) {
      updateData.respondedAt = new Date();
    }
    
    if (status === 'ACCEPTED' && !request.acceptedAt) {
      updateData.acceptedAt = new Date();
    }
    
    if (status === 'REJECTED' && !request.rejectedAt) {
      updateData.rejectedAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }
    
    if (status === 'COMPLETED' && !request.completedAt) {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Update the request
    const updatedRequest = await prisma.contractRequest.update({
      where: { id },
      data: updateData,
      include: {
        vtuberUser: {
          include: { profile: true }
        },
        artistUser: {
          include: { profile: true }
        }
      }
    });

    // TODO: Send notification to VTuber about status change

    res.json({
      success: true,
      message: `Contract request ${status.toLowerCase()}`,
      status: updatedRequest.status,
      updatedAt: updatedRequest.updatedAt
    });

  } catch (error) {
    console.error('Error updating contract request status:', error);
    res.status(500).json({ 
      error: 'Failed to update contract request status' 
    });
  }
});

export default router;
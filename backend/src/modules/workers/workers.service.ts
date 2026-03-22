import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';
import { CreateWorkerProfileDto } from './dto/create-worker-profile.dto';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto';
import { WorkerQueryDto } from './dto/worker-query.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateWorkerProfileDto) {
    // Verify user is a WORKER
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.WORKER) {
      throw new ForbiddenException('Only workers can create a worker profile');
    }

    // Check if profile already exists
    const existing = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Worker profile already exists');
    }

    return this.prisma.workerProfile.create({
      data: {
        userId,
        bio: dto.bio,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        skills: dto.skills,
        hourlyRate: dto.hourlyRate,
        experienceYears: dto.experienceYears,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateWorkerProfileDto) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    return profile || null;
  }

  async findAll(query: WorkerQueryDto) {
    const { skip, limit, city, skills, isAvailable, minRating } = query;

    const where: any = {
      verificationStatus: 'VERIFIED',
      user: { isActive: true },
    };

    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      where.skills = { hasSome: skillList };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (minRating) {
      where.avgRating = { gte: minRating };
    }

    const [workers, total] = await Promise.all([
      this.prisma.workerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { avgRating: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.workerProfile.count({ where }),
    ]);

    return {
      items: workers,
      meta: {
        total,
        page: query.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('Worker not found');
    }
    return profile;
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.workerProfile.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
      select: { id: true, isAvailable: true },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
      },
      select: { id: true, latitude: true, longitude: true, address: true },
    });
  }

  async updateIdProof(userId: string, idProofUrl: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.workerProfile.update({
      where: { userId },
      data: { idProofUrl, verificationStatus: 'PENDING' },
      select: { id: true, idProofUrl: true, verificationStatus: true },
    });
  }
}

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { WorkersService } from '../workers/workers.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly workersService: WorkersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('id-proof')
  @Roles(Role.WORKER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload ID proof document (worker only)' })
  async uploadIdProof(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileUrl = await this.uploadsService.uploadFile(
      file,
      'id-proofs',
      ['image/jpeg', 'image/png', 'application/pdf'],
      5 * 1024 * 1024,
    );

    return this.workersService.updateIdProof(userId, fileUrl);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload profile avatar' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileUrl = await this.uploadsService.uploadFile(
      file,
      'avatars',
      ['image/jpeg', 'image/png'],
      5 * 1024 * 1024,
    );

    // Persist avatar URL to user record
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: fileUrl },
    });

    return { avatarUrl: fileUrl };
  }
}

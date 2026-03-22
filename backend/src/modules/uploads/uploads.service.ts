import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadsService implements OnModuleInit {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    this.bucket = this.configService.get<string>('S3_BUCKET', 'rentaman-uploads');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch {
      this.logger.log(`Creating bucket "${this.bucket}"...`);
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" created`);
    }

    // Set public-read policy so uploaded files are accessible from the browser
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${this.bucket}/*`],
      }],
    });
    await this.s3.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }));
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeBytes: number = 5 * 1024 * 1024,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSizeBytes / (1024 * 1024)}MB`,
      );
    }

    const ext = file.originalname.split('.').pop();
    const key = `${folder}/${uuid()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.replace(`${this.endpoint}/${this.bucket}/`, '');
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

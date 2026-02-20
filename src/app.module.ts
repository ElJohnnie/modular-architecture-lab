import { Module } from '@nestjs/common';
import { PrismaService } from '@src/persistence/prisma/prisma.service';
import { ContentController } from '@src/http/rest/controller/content.controller';
import { ContentManagementService } from '@src/core/service/content-management.service';
import { MediaPlayerService } from '@src/core/service/media-player.service';

@Module({
  imports: [],
  controllers: [ContentController],
  providers: [PrismaService, ContentManagementService, MediaPlayerService],
})
export class AppModule {}

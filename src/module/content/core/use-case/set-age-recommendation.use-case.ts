import {
  AgeRecommendationSchema,
  VideoAgeRecommendationAdapter,
} from '@contentModule/core/adapter/video-recommendation.adapter.interface';
import { ContentAgeRecommendationService } from '@contentModule/core/service/content-age-recommendation.service';
import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoMetadataRepository } from '@contentModule/persistence/repository/video-metadata.repository';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AppLogger } from '@sharedModules/logger/service/app-logger.service';

import { runInTransaction } from 'typeorm-transactional';

@Injectable()
export class SetAgeRecommendationUseCase {
  constructor(
    @Inject(VideoAgeRecommendationAdapter)
    private readonly videoAgeRecommendationAdapter: VideoAgeRecommendationAdapter,
    private readonly videoMetadataRepository: VideoMetadataRepository,
    private readonly contentAgeRecommendationService: ContentAgeRecommendationService,
    private readonly contentRepository: ContentRepository,
    private readonly logger: AppLogger,
  ) {}

  public async execute(video: Video): Promise<void> {
    const ageRecommendation =
      await this.videoAgeRecommendationAdapter.getAgeRecommendation(video.url);
    if (!ageRecommendation) {
      throw new Error(
        `Failed to generate age recommendation for video with ID ${video.id}`,
      );
    }
    this.logger.log(`Generated age recommendation for video ID ${video.id}`, {
      ageRecommendation,
      videoId: video.id,
    });

    const metadata = await this.getAndPopulateMetadata(
      video,
      ageRecommendation,
    );

    const content = await this.contentRepository.findContentByVideoId(video.id);
    if (!content) {
      throw new BadRequestException(
        `Content not found for video with ID ${video.id}`,
      );
    }

    await runInTransaction(
      async () => {
        await this.videoMetadataRepository.save(metadata);
        this.contentAgeRecommendationService.setAgeRecommendationForContent(
          content,
          metadata,
        );
        await this.contentRepository.saveMovieOrTvShow(content);
      },
      {
        connectionName: 'content',
      },
    );
  }

  private async getAndPopulateMetadata(
    video: Video,
    ageRecommendation: AgeRecommendationSchema,
  ): Promise<VideoMetadata> {
    const metadata = await this.videoMetadataRepository.findOne({
      where: { video },
    });

    if (metadata) {
      metadata.ageRating = ageRecommendation?.ageRating;
      metadata.ageRatingExplanation = ageRecommendation?.explanation;
      metadata.ageRatingCategories = ageRecommendation?.categories;
      return metadata;
    }

    return new VideoMetadata({
      ageRating: ageRecommendation?.ageRating,
      ageRatingExplanation: ageRecommendation?.explanation,
      ageRatingCategories: ageRecommendation?.categories,
      video,
    });
  }
}

import { VideoAgeRecommendationAdapter } from '@contentModule/core/adapter/video-recommendation.adapter.interface';
import { VideoSummaryGenerationAdapter } from '@contentModule/core/adapter/video-summary-generator.adapter.interface';
import { VideoTranscriptGenerationAdapter } from '@contentModule/core/adapter/video-transcript-generator.adapter.interface';
import { AgeRecommendationService } from '@contentModule/core/service/age-recommendation.service';
import { ContentAgeRecommendationService } from '@contentModule/core/service/content-age-recommendation.service';
import { ContentDistributionService } from '@contentModule/core/service/content-distribution.service';
import { EpisodeLifecycleService } from '@contentModule/core/service/episode-lifecycle.service';
import { VideoProcessorService } from '@contentModule/core/service/video-processor.service';
import { VideoProfanityFilterService } from '@contentModule/core/service/video-profanity-filter.service';
import { CreateMovieUseCase } from '@contentModule/core/use-case/create-movie.use-case';
import { CreateTvShowEpisodeUseCase } from '@contentModule/core/use-case/create-tv-show-episode.use-case';
import { CreateTvShowUseCase } from '@contentModule/core/use-case/create-tv-show.use-case';
import { GenerateSummaryForVideoUseCase } from '@contentModule/core/use-case/generate-summary-for-video.use-case';
import { GetStreamingURLUseCase } from '@contentModule/core/use-case/get-streaming-url.use-case';
import { SetAgeRecommendationUseCase } from '@contentModule/core/use-case/set-age-recommendation.use-case';
import { TranscribeVideoUseCase } from '@contentModule/core/use-case/transcribe-video.use-case';
import { ExternalMovieClient } from '@contentModule/http/client/external-movie-rating/external-movie-rating.client';
import { GeminiTextExtractorClient } from '@contentModule/http/client/gemini/gemini-text-extractor.client';
import { AdminMovieController } from '@contentModule/http/rest/controller/admin-movie.controller';
import { AdminTvShowController } from '@contentModule/http/rest/controller/admin-tv-show.controller';
import { MediaPlayerController } from '@contentModule/http/rest/controller/media-player.controller';
import { ContentPersistenceModule } from '@contentModule/persistence/content-persistence.module';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { VideoAgeRecommendationConsumer } from '@contentModule/queue/consumer/video-age-recommendation.queue-consumer';
import { VideoSummaryConsumer } from '@contentModule/queue/consumer/video-summary.queue-consumer';
import { VideoTranscriptionConsumer } from '@contentModule/queue/consumer/video-transcription.queue-consumer';
import { VideoProcessingJobProducer } from '@contentModule/queue/producer/video-processing-job.queue-producer';
import { QUEUES } from '@contentModule/queue/queue.constant';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '@sharedModules/auth/auth.module';
import { ConfigModule } from '@sharedModules/config/config.module';
import { ConfigService } from '@sharedModules/config/service/config.service';
import { HttpClientModule } from '@sharedModules/http-client/http-client.module';
import { LoggerModule } from '@sharedModules/logger/logger.module';

@Module({
  imports: [
    ContentPersistenceModule,
    ConfigModule.forRoot(),
    HttpClientModule,
    AuthModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUES.VIDEO_AGE_RECOMMENDATION,
      },
      {
        name: QUEUES.VIDEO_SUMMARY,
      },
      {
        name: QUEUES.VIDEO_TRANSCRIPT,
      },
    ),
  ],
  controllers: [
    AdminMovieController,
    MediaPlayerController,
    AdminTvShowController,
  ],
  providers: [
    {
      provide: VideoSummaryGenerationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoTranscriptGenerationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    {
      provide: VideoAgeRecommendationAdapter,
      useClass: GeminiTextExtractorClient,
    },
    ContentRepository,
    VideoRepository,
    ExternalMovieClient,
    AgeRecommendationService,
    VideoProfanityFilterService,
    VideoProcessorService,
    EpisodeLifecycleService,
    CreateMovieUseCase,
    CreateTvShowEpisodeUseCase,
    CreateTvShowUseCase,
    GetStreamingURLUseCase,
    ContentDistributionService,
    TranscribeVideoUseCase,
    VideoSummaryConsumer,
    VideoAgeRecommendationConsumer,
    VideoTranscriptionConsumer,
    VideoProcessingJobProducer,
    SetAgeRecommendationUseCase,
    GenerateSummaryForVideoUseCase,
    TranscribeVideoUseCase,
    ContentAgeRecommendationService,
  ],
})
export class ContentModule {}

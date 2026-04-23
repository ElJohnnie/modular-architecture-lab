import { VideoNotFoundException } from '@contentModule/core/exception/video-not-found.exception';
import { SetAgeRecommendationUseCase } from '@contentModule/core/use-case/set-age-recommendation.use-case';
import { VideoRepository } from '@contentModule/persistence/repository/video.repository';
import { QUEUES } from '@contentModule/queue/queue.constant';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { OnApplicationShutdown } from '@nestjs/common';
import { AppLogger } from '@sharedModules/logger/service/app-logger.service';
import { Job } from 'bullmq';

@Processor(QUEUES.VIDEO_AGE_RECOMMENDATION)
export class VideoAgeRecommendationConsumer
  extends WorkerHost
  implements OnApplicationShutdown
{
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly setAgeRecommendationUseCase: SetAgeRecommendationUseCase,
    private readonly logger: AppLogger,
  ) {
    super();
  }
  async onApplicationShutdown() {
    await this.worker.close(true);
  }

  async process(job: Job<{ videoId: string; url: string }, void>) {
    this.logger.log(
      `Processing age recommendation for video ${job.data.videoId}`,
    );

    const video = await this.videoRepository.findOneById(job.data.videoId);
    if (!video) {
      throw new VideoNotFoundException(
        `Video with ID ${job.data.videoId} not found`,
      );
    }

    try {
      await this.setAgeRecommendationUseCase.execute(video);
    } catch (error) {
      this.logger.error(
        `Error processing age recommendation for video ${video.id}`,
        {
          error,
          videoId: video.id,
        },
      );
      throw new Error(
        `Failed to process age recommendation for video ID ${video.id}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, {
      job,
      error,
    });
    //Do something with the error, log it, send a notification, put in a dead letter queue, etc.
  }
}

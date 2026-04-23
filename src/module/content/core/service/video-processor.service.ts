import { VideoProcessingJobProducer } from '@contentModule/queue/producer/video-processing-job.queue-producer';
import { Injectable } from '@nestjs/common';
import { Video } from '@src/module/content/persistence/entity/video.entity';

@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly videoProcessingJobProducer: VideoProcessingJobProducer,
  ) {}

  async processMetadataAndModeration(video: Video) {
    //Triggers the async processing of video metadata and moderation
    return Promise.all([
      this.videoProcessingJobProducer.processRecommendation(video),
      this.videoProcessingJobProducer.processTranscript(video),
      this.videoProcessingJobProducer.processSummary(video),
    ]);
  }
}

import { MovieContentModel } from '@contentModule/core/model/movie-content.model';
import { TvShowContentModel } from '@contentModule/core/model/tv-show-content.model';
import { VideoMetadata } from '@contentModule/persistence/entity/video-metadata.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentAgeRecommendationService {
  setAgeRecommendationForContent(
    content: TvShowContentModel | MovieContentModel,
    latestVideoMetadata: VideoMetadata,
  ): void {
    /**
     * Age recommendation for the whole content is based on the highest
     * age recommendation of the videos
     * If the content has an age recommendation, it will be replaced
     */
    if (!content.ageRecommendation && latestVideoMetadata.ageRating) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
      return;
    }
    if (
      content.ageRecommendation &&
      latestVideoMetadata.ageRating &&
      latestVideoMetadata.ageRating > content.ageRecommendation
    ) {
      content.ageRecommendation = latestVideoMetadata.ageRating;
    }
  }
}

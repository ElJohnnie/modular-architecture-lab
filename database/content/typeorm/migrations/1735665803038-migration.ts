import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1735665803038 implements MigrationInterface {
    name = 'Migration1735665803038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0"`);
        await queryRunner.query(`CREATE TABLE "Episode" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying(255) NOT NULL, "description" text NOT NULL, "season" integer NOT NULL, "number" integer NOT NULL, "tvShowId" uuid NOT NULL, "thumbnailId" uuid, CONSTRAINT "REL_7153938ad76137550256fd3b40" UNIQUE ("thumbnailId"), CONSTRAINT "PK_c61e604db606b512a70c676a5f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Episode" ADD CONSTRAINT "FK_3dc5f16eddbe518eff23f510ec6" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Episode" ADD CONSTRAINT "FK_7153938ad76137550256fd3b40a" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0"`);
        await queryRunner.query(`ALTER TABLE "Episode" DROP CONSTRAINT "FK_7153938ad76137550256fd3b40a"`);
        await queryRunner.query(`ALTER TABLE "Episode" DROP CONSTRAINT "FK_3dc5f16eddbe518eff23f510ec6"`);
        await queryRunner.query(`DROP TABLE "Episode"`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

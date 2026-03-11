import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1735665749553 implements MigrationInterface {
    name = 'Migration1735665749553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Content" ADD "ageRecommendation" integer`);
        await queryRunner.query(`ALTER TABLE "episode" DROP CONSTRAINT "FK_bc417590af57a49dc42ce4ba038"`);
        await queryRunner.query(`ALTER TABLE "episode" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "episode" ADD "title" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "episode" ADD "description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" ALTER COLUMN "tvShowId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "Content" ADD "title" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "Content" ADD "description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" ADD CONSTRAINT "FK_bc417590af57a49dc42ce4ba038" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "episode" DROP CONSTRAINT "FK_bc417590af57a49dc42ce4ba038"`);
        await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "Content" ADD "description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "Content" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" ALTER COLUMN "tvShowId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "episode" ADD "description" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "episode" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "episode" ADD CONSTRAINT "FK_bc417590af57a49dc42ce4ba038" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Content" DROP COLUMN "ageRecommendation"`);
    }

}

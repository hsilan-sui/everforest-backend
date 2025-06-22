import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsRejectedToEventInfo1750418482049 implements MigrationInterface {
    name = 'AddIsRejectedToEventInfo1750418482049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ORDER_INFO" ALTER COLUMN "quantity" SET DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ORDER_INFO" ALTER COLUMN "quantity" SET DEFAULT '1'`);
    }

}

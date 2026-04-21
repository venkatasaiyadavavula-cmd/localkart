import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddShopGeo0021700000000002 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

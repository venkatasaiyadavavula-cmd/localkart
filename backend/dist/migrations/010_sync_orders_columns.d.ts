import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class SyncOrdersColumns0101700000000010 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

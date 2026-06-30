export declare class BulkUploadService {
    uploadProducts(file: any, shopId: string): Promise<{
        message: string;
    }>;
    downloadTemplate(): Promise<Buffer<ArrayBuffer>>;
}

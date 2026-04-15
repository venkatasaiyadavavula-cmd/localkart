// ... inside the component
import { ProductScannerFree } from '@/components/seller/product-scanner-free';

// In the JSX, replace the old scanner or add a new option
<Card>
  <CardHeader>
    <CardTitle>Add New Product</CardTitle>
    <CardDescription>Use free AI scan or enter manually</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="scan">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="scan">📷 Smart Scan (Free)</TabsTrigger>
        <TabsTrigger value="manual">✏️ Manual Entry</TabsTrigger>
      </TabsList>
      
      <TabsContent value="scan" className="mt-4">
        <ProductScannerFree 
          onScanComplete={(images, detectedText) => {
            // Auto-fill form fields with extracted data
            setValue('name', extractedData.suggestedName || '');
            setValue('price', extractedData.suggestedPrice || '');
            // ... set other fields
            
            // Convert images to File objects and store in state
            // ... (implementation depends on your form state)
            
            toast.success('Product details auto-filled! Review and save.');
          }} 
        />
      </TabsContent>
      
      <TabsContent value="manual" className="space-y-4">
        {/* Your existing manual form fields */}
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>

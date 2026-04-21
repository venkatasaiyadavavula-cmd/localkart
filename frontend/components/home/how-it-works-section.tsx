import { MapPin, Search, Truck, Package } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      icon: MapPin,
      title: 'Set Your Location',
      description: 'Allow GPS to find shops near you in Kadapa',
    },
    {
      icon: Search,
      title: 'Browse & Search',
      description: 'Discover products from trusted local shops',
    },
    {
      icon: Package,
      title: 'Place Order',
      description: 'Add to cart and checkout with COD or online',
    },
    {
      icon: Truck,
      title: 'Same Day Delivery',
      description: 'Get your order delivered by the shop owner',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold">How It Works</h2>
        <p className="mt-2 text-muted-foreground">Shop from local stores in 4 simple steps</p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <step.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

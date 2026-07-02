import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  MapPin, 
  Truck, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle,
  Store,
  Users,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="w-fit bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                🎉 Now in Kadapa & Surrounding Areas
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Shop Local,
                <span className="text-blue-600 dark:text-blue-400"> Delivered Fast</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Discover products from local shops in your city. Same-day delivery, best prices, and support your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/browse">
                  <Button size="lg" className="w-full sm:w-auto">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/seller-onboarding">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Easy Returns</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <Store className="h-12 w-12 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Local Shops</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Happy Customers</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800 shadow-lg">
                    <CardContent className="p-6 text-center">
                      <Star className="h-12 w-12 mx-auto mb-3 text-yellow-600 dark:text-yellow-400" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">4.8</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose LocalKart?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Supporting local businesses has never been easier
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardContent className="p-8">
                <MapPin className="h-16 w-16 mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Hyperlocal Shopping
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Find shops within your radius. Get products from your neighborhood stores with same-day delivery.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-purple-500 transition-colors">
              <CardContent className="p-8">
                <Truck className="h-16 w-16 mb-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Fast Delivery
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Order now and get it delivered today. Real-time tracking so you know exactly when your order arrives.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-green-500 transition-colors">
              <CardContent className="p-8">
                <Shield className="h-16 w-16 mb-4 text-green-600 dark:text-green-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Secure Payments
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Pay securely with Razorpay or choose Cash on Delivery. Your transactions are always protected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Sellers Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="w-fit bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-4">
                For Business Owners
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Grow Your Local Business
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of local shops already selling on LocalKart. Reach more customers, manage orders easily, and grow your revenue.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Easy product management with AI-powered descriptions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time order tracking and notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Analytics dashboard to track sales and performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Flexible subscription plans for every business size</span>
                </li>
              </ul>
              <Link href="/seller-onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Start Selling Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-2xl p-8">
              <Card className="bg-white dark:bg-gray-800 shadow-lg mb-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Sales</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      +45%
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    ₹2,45,000
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    vs ₹1,69,000 last month
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 dark:text-gray-400">Total Orders</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      +32%
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    1,234
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    vs 934 last month
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Find everything you need from local stores
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Groceries', icon: '🛒', slug: 'groceries', color: 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800' },
              { name: 'Electronics', icon: '📱', slug: 'electronics', color: 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800' },
              { name: 'Fashion', icon: '👔', slug: 'fashion', color: 'from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800' },
              { name: 'Home & Kitchen', icon: '🏠', slug: 'home_essentials', color: 'from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800' },
              { name: 'Beauty', icon: '💄', slug: 'beauty', color: 'from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800' },
              { name: 'Sports', icon: '⚽', slug: 'sports', color: 'from-red-100 to-red-200 dark:from-red-900 dark:to-red-800' },
              { name: 'Books', icon: '📚', slug: 'books', color: 'from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800' },
              { name: 'Pharmacy', icon: '💊', slug: 'groceries', color: 'from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800' },
            ].map((category) => (
              <Link key={category.name} href={`/browse/${category.slug}`}>
                <Card className={`cursor-pointer hover:shadow-xl transition-all bg-gradient-to-br ${category.color}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{category.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of customers already enjoying local shopping
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

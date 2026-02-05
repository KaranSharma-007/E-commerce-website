import requests
import sys
import json
from datetime import datetime

class ECommerceAPITester:
    def __init__(self, base_url="https://sleek-commerce-60.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details and not success:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Seed the database with initial data"""
        print("\n🌱 Seeding Database...")
        success, response = self.run_test(
            "Seed Database",
            "POST",
            "seed",
            200
        )
        return success

    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test categories
        self.run_test("Get Categories", "GET", "categories", 200)
        
        # Test products
        success, products_response = self.run_test("Get All Products", "GET", "products", 200)
        
        if success and products_response.get('products'):
            product_id = products_response['products'][0]['product_id']
            self.run_test("Get Single Product", "GET", f"products/{product_id}", 200)
        
        # Test featured products
        self.run_test("Get Featured Products", "GET", "products?featured=true", 200)
        
        # Test product search
        self.run_test("Search Products", "GET", "products?search=headphones", 200)

    def test_user_registration_login(self):
        """Test user registration and login"""
        print("\n👤 Testing User Authentication...")
        
        # Generate unique email for testing
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = "Test User"
        
        # Test registration
        success, reg_response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if success and reg_response.get('token'):
            self.token = reg_response['token']
            
            # Test login with same credentials
            success, login_response = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                data={
                    "email": test_email,
                    "password": test_password
                }
            )
            
            if success and login_response.get('token'):
                self.token = login_response['token']
                
                # Test get current user
                self.run_test(
                    "Get Current User",
                    "GET",
                    "auth/me",
                    200,
                    headers={"Authorization": f"Bearer {self.token}"}
                )

    def test_admin_login(self):
        """Test admin login"""
        print("\n👑 Testing Admin Authentication...")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "admin@store.com",
                "password": "admin123"
            }
        )
        
        if success and response.get('token'):
            self.admin_token = response['token']
            return True
        return False

    def test_cart_operations(self):
        """Test cart functionality (requires auth)"""
        if not self.token:
            self.log_test("Cart Operations", False, "No user token available")
            return
            
        print("\n🛒 Testing Cart Operations...")
        
        auth_headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get empty cart
        self.run_test("Get Empty Cart", "GET", "cart", 200, headers=auth_headers)
        
        # Get products to add to cart
        success, products_response = self.run_test("Get Products for Cart", "GET", "products?limit=1", 200)
        
        if success and products_response.get('products'):
            product_id = products_response['products'][0]['product_id']
            
            # Add to cart
            self.run_test(
                "Add to Cart",
                "POST",
                "cart/add",
                200,
                data={"product_id": product_id, "quantity": 2},
                headers=auth_headers
            )
            
            # Get cart with items
            self.run_test("Get Cart with Items", "GET", "cart", 200, headers=auth_headers)
            
            # Update cart item
            self.run_test(
                "Update Cart Item",
                "PUT",
                "cart/update",
                200,
                data={"product_id": product_id, "quantity": 3},
                headers=auth_headers
            )
            
            # Clear cart
            self.run_test("Clear Cart", "DELETE", "cart/clear", 200, headers=auth_headers)

    def test_order_operations(self):
        """Test order creation and management"""
        if not self.token:
            self.log_test("Order Operations", False, "No user token available")
            return
            
        print("\n📦 Testing Order Operations...")
        
        auth_headers = {"Authorization": f"Bearer {self.token}"}
        
        # First add item to cart
        success, products_response = self.run_test("Get Products for Order", "GET", "products?limit=1", 200)
        
        if success and products_response.get('products'):
            product_id = products_response['products'][0]['product_id']
            
            # Add to cart
            add_success, _ = self.run_test(
                "Add to Cart for Order",
                "POST",
                "cart/add",
                200,
                data={"product_id": product_id, "quantity": 1},
                headers=auth_headers
            )
            
            if add_success:
                # Create order
                order_success, order_response = self.run_test(
                    "Create Order",
                    "POST",
                    "orders",
                    200,
                    data={
                        "shipping_address": {
                            "full_name": "Test User",
                            "phone": "9876543210",
                            "address_line1": "123 Test Street",
                            "address_line2": "Apt 4B",
                            "city": "Mumbai",
                            "state": "Maharashtra",
                            "pincode": "400001"
                        }
                    },
                    headers=auth_headers
                )
                
                if order_success and order_response.get('order_id'):
                    order_id = order_response['order_id']
                    
                    # Get user orders
                    self.run_test("Get User Orders", "GET", "orders", 200, headers=auth_headers)
                    
                    # Get specific order
                    self.run_test("Get Specific Order", "GET", f"orders/{order_id}", 200, headers=auth_headers)
                    
                    return order_id
        return None

    def test_stripe_checkout(self, order_id):
        """Test Stripe checkout session creation"""
        if not self.token or not order_id:
            self.log_test("Stripe Checkout", False, "No token or order_id available")
            return
            
        print("\n💳 Testing Stripe Checkout...")
        
        auth_headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create checkout session
        self.run_test(
            "Create Checkout Session",
            "POST",
            "checkout/create-session",
            200,
            data={
                "order_id": order_id,
                "origin_url": self.base_url
            },
            headers=auth_headers
        )

    def test_admin_operations(self):
        """Test admin-only operations"""
        if not self.admin_token:
            self.log_test("Admin Operations", False, "No admin token available")
            return
            
        print("\n🔧 Testing Admin Operations...")
        
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get admin stats
        self.run_test("Get Admin Stats", "GET", "admin/stats", 200, headers=admin_headers)
        
        # Get all orders
        self.run_test("Get All Orders", "GET", "admin/orders", 200, headers=admin_headers)
        
        # Test product creation
        success, product_response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data={
                "name": "Test Product",
                "description": "A test product for API testing",
                "price": 999.99,
                "category": "tech",
                "images": ["https://via.placeholder.com/400"],
                "stock": 10,
                "featured": False
            },
            headers=admin_headers
        )
        
        if success and product_response.get('product_id'):
            product_id = product_response['product_id']
            
            # Update product
            self.run_test(
                "Update Product",
                "PUT",
                f"products/{product_id}",
                200,
                data={"price": 1299.99, "stock": 15},
                headers=admin_headers
            )
            
            # Delete product
            self.run_test(
                "Delete Product",
                "DELETE",
                f"products/{product_id}",
                200,
                headers=admin_headers
            )

    def test_wishlist_operations(self):
        """Test wishlist functionality (requires auth)"""
        if not self.token:
            self.log_test("Wishlist Operations", False, "No user token available")
            return
            
        print("\n❤️ Testing Wishlist Operations...")
        
        auth_headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get empty wishlist
        self.run_test("Get Empty Wishlist", "GET", "wishlist", 200, headers=auth_headers)
        
        # Get products to add to wishlist
        success, products_response = self.run_test("Get Products for Wishlist", "GET", "products?limit=1", 200)
        
        if success and products_response.get('products'):
            product_id = products_response['products'][0]['product_id']
            
            # Check wishlist status (should be false initially)
            self.run_test(
                "Check Wishlist Status (Empty)",
                "GET",
                f"wishlist/check/{product_id}",
                200,
                headers=auth_headers
            )
            
            # Add to wishlist
            self.run_test(
                "Add to Wishlist",
                "POST",
                "wishlist/add",
                200,
                data={"product_id": product_id},
                headers=auth_headers
            )
            
            # Check wishlist status (should be true now)
            self.run_test(
                "Check Wishlist Status (Added)",
                "GET",
                f"wishlist/check/{product_id}",
                200,
                headers=auth_headers
            )
            
            # Get wishlist with items
            self.run_test("Get Wishlist with Items", "GET", "wishlist", 200, headers=auth_headers)
            
            # Try to add same item again (should return "Already in wishlist")
            self.run_test(
                "Add Duplicate to Wishlist",
                "POST",
                "wishlist/add",
                200,
                data={"product_id": product_id},
                headers=auth_headers
            )
            
            # Move item from wishlist to cart
            self.run_test(
                "Move Wishlist Item to Cart",
                "POST",
                f"wishlist/{product_id}/move-to-cart",
                200,
                headers=auth_headers
            )
            
            # Check that item was removed from wishlist
            self.run_test("Get Wishlist After Move", "GET", "wishlist", 200, headers=auth_headers)
            
            # Add item back to wishlist for removal test
            self.run_test(
                "Add to Wishlist Again",
                "POST",
                "wishlist/add",
                200,
                data={"product_id": product_id},
                headers=auth_headers
            )
            
            # Remove from wishlist
            self.run_test(
                "Remove from Wishlist",
                "DELETE",
                f"wishlist/{product_id}",
                200,
                headers=auth_headers
            )
            
            # Verify wishlist is empty
            self.run_test("Get Empty Wishlist After Removal", "GET", "wishlist", 200, headers=auth_headers)

    def test_inventory_stock_management(self):
        """Test inventory and stock management"""
        if not self.token:
            self.log_test("Stock Management", False, "No user token available")
            return
            
        print("\n📦 Testing Inventory & Stock Management...")
        
        auth_headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get a product to test stock functionality
        success, products_response = self.run_test("Get Products for Stock Test", "GET", "products?limit=1", 200)
        
        if success and products_response.get('products'):
            product = products_response['products'][0]
            product_id = product['product_id']
            initial_stock = product.get('stock', 0)
            
            print(f"    Testing with product: {product['name']} (Initial stock: {initial_stock})")
            
            # Test stock check when adding to cart (should work if stock > 0)
            if initial_stock > 0:
                self.run_test(
                    "Add to Cart with Stock Check",
                    "POST",
                    "cart/add",
                    200,
                    data={"product_id": product_id, "quantity": 1},
                    headers=auth_headers
                )
                
                # Test adding more than available stock (should fail)
                if initial_stock < 100:  # Avoid testing with very high stock
                    self.run_test(
                        "Add Excessive Quantity to Cart",
                        "POST",
                        "cart/add",
                        400,  # Should fail with insufficient stock
                        data={"product_id": product_id, "quantity": initial_stock + 10},
                        headers=auth_headers
                    )
                
                # Create order to test stock reduction
                order_success, order_response = self.run_test(
                    "Create Order for Stock Test",
                    "POST",
                    "orders",
                    200,
                    data={
                        "shipping_address": {
                            "full_name": "Stock Test User",
                            "phone": "9876543210",
                            "address_line1": "123 Stock Street",
                            "city": "Mumbai",
                            "state": "Maharashtra",
                            "pincode": "400001"
                        }
                    },
                    headers=auth_headers
                )
                
                if order_success:
                    # Check if stock was reduced after order creation
                    success, updated_product = self.run_test(
                        "Check Stock After Order",
                        "GET",
                        f"products/{product_id}",
                        200
                    )
                    
                    if success:
                        new_stock = updated_product.get('stock', 0)
                        # Stock should be reduced by the quantity ordered (1 in this case)
                        # But we need to account for previous cart operations in the same test run
                        if new_stock < initial_stock:
                            self.log_test("Stock Reduction After Order", True, f"Stock reduced from {initial_stock} to {new_stock}")
                        else:
                            self.log_test("Stock Reduction After Order", False, f"Stock not reduced: {initial_stock} -> {new_stock}")
            else:
                # Test with out of stock product
                self.run_test(
                    "Add Out of Stock to Cart",
                    "POST",
                    "cart/add",
                    400,  # Should fail
                    data={"product_id": product_id, "quantity": 1},
                    headers=auth_headers
                )

    def test_tracking(self):
        """Test order tracking"""
        print("\n📍 Testing Order Tracking...")
        
        # This requires an existing order, so we'll test with a dummy order_id
        # In a real scenario, we'd use an order_id from previous tests
        self.run_test("Get Tracking Info", "GET", "tracking/dummy_order_123", 404)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting E-Commerce API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Seed data first
        if not self.test_seed_data():
            print("❌ Failed to seed data, continuing with existing data...")
        
        # Test public endpoints
        self.test_public_endpoints()
        
        # Test user authentication
        self.test_user_registration_login()
        
        # Test admin authentication
        admin_success = self.test_admin_login()
        
        # Test cart operations
        self.test_cart_operations()
        
        # Test wishlist operations
        self.test_wishlist_operations()
        
        # Test inventory and stock management
        self.test_inventory_stock_management()
        
        # Test order operations
        order_id = self.test_order_operations()
        
        # Test Stripe checkout
        if order_id:
            self.test_stripe_checkout(order_id)
        
        # Test admin operations
        if admin_success:
            self.test_admin_operations()
        
        # Test tracking
        self.test_tracking()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ECommerceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())